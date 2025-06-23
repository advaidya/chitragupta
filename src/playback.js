// Import required Node.js modules
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Main class that handles playing back recorded interactions
class InteractionPlayback {
  constructor() {
    this.browser = null;
    this.page = null;
    this.playbackSpeed = 1; // 1 = normal speed, 0.5 = half speed, 2 = double speed
    this.recording = null;
  }

  // Load a recording file
  loadRecording(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Recording file not found: ${filePath}`);
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    this.recording = JSON.parse(fileContent);
    console.log(`Loaded recording: ${this.recording.sessionId}`);
    console.log(`Total interactions: ${this.recording.totalInteractions}`);
    console.log(`Duration: ${new Date(this.recording.startTime).toLocaleString()} - ${new Date(this.recording.endTime).toLocaleString()}`);
  }

  // Initialize the browser for playback
  async initialize(headless = false) {
    console.log('Launching browser for playback...');
    
    this.browser = await puppeteer.launch({ 
      headless: headless,
      defaultViewport: null,
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=site-per-process'
      ]
    });
    
    this.page = await this.browser.newPage();
    
    // Set realistic user agent
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('Browser initialized for playback');
  }

  // Set playback speed (1 = normal, 0.5 = half speed, 2 = double speed)
  setPlaybackSpeed(speed) {
    this.playbackSpeed = speed;
    console.log(`Playback speed set to: ${speed}x`);
  }

  // Calculate delay between interactions based on timestamps
  calculateDelay(previousTimestamp, currentTimestamp) {
    const realDelay = currentTimestamp - previousTimestamp;
    return Math.max(realDelay / this.playbackSpeed, 50); // Minimum 50ms delay
  }

  // Play back a single interaction
  async playInteraction(interaction, index) {
    try {
      console.log(`[${index + 1}/${this.recording.totalInteractions}] Playing: ${interaction.type} on ${interaction.url}`);
      
      // Check if page is still attached and refresh reference if needed
      try {
        await this.page.url();
      } catch (error) {
        console.log(`  → Refreshing page reference due to detached frame`);
        const pages = await this.browser.pages();
        this.page = pages[pages.length - 1]; // Get the latest page
      }
      
      // Navigate to the correct page if needed
      const currentUrl = this.page.url();
      if (currentUrl !== interaction.url && interaction.url) {
        console.log(`  → Navigating to: ${interaction.url}`);
        try {
          await this.page.goto(interaction.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
          // Wait a bit for dynamic content to load
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (navError) {
          console.log(`  → Navigation failed, continuing with current page`);
        }
      }

      switch (interaction.type) {
        case 'navigation':
          await this.playNavigation(interaction);
          break;
        case 'click':
          await this.playClick(interaction);
          break;
        case 'input':
        case 'text':
        case 'search':
          await this.playInput(interaction);
          break;
        case 'change':
        case 'select-one':
          await this.playChange(interaction);
          break;
        case 'submit':
          await this.playSubmit(interaction);
          break;
        case 'checkbox':
          await this.playCheckbox(interaction);
          break;
        case 'range':
          await this.playRange(interaction);
          break;
        default:
          console.log(`  → Skipping unsupported interaction type: ${interaction.type}`);
      }
    } catch (error) {
      console.error(`  → Error playing interaction ${index + 1}: ${error.message}`);
      // Continue with next interaction instead of stopping
    }
  }

  // Play navigation interaction
  async playNavigation(interaction) {
    if (interaction.url && this.page.url() !== interaction.url) {
      try {
        await this.page.goto(interaction.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        // Wait for dynamic content
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log(`  → Navigated to: ${interaction.url}`);
      } catch (error) {
        console.log(`  → Navigation failed: ${error.message}`);
      }
    }
  }

  // Play click interaction
  async playClick(interaction) {
    await this.ensurePageReady();
    await this.waitForElement(interaction.selector);
    
    // Try multiple selector strategies
    const selectors = [
      interaction.selector,
      `#${interaction.id}`,
      `.${interaction.className?.split(' ').join('.')}`,
      interaction.tagName?.toLowerCase()
    ].filter(Boolean);

    let clicked = false;
    for (const selector of selectors) {
      try {
        // Check if element exists and is clickable
        const element = await this.page.$(selector);
        if (element) {
          await this.page.click(selector, { timeout: 3000 });
          clicked = true;
          console.log(`  → Clicked: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }

    if (!clicked) {
      // Try clicking by coordinates as fallback
      if (interaction.coordinates) {
        try {
          await this.page.mouse.click(interaction.coordinates.x, interaction.coordinates.y);
          console.log(`  → Clicked at coordinates: (${interaction.coordinates.x}, ${interaction.coordinates.y})`);
        } catch (error) {
          console.log(`  → Could not click at coordinates: ${error.message}`);
        }
      } else {
        console.log(`  → Could not click element: ${interaction.selector}`);
      }
    }
  }

  // Play input/text interaction
  async playInput(interaction) {
    await this.ensurePageReady();
    await this.waitForElement(interaction.selector);
    
    const selectors = [
      interaction.selector,
      `#${interaction.id}`,
      `[name="${interaction.name}"]`
    ].filter(Boolean);

    let typed = false;
    for (const selector of selectors) {
      try {
        // Check if element exists
        const element = await this.page.$(selector);
        if (!element) continue;
        
        // Clear the field first
        await this.page.focus(selector);
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('KeyA');
        await this.page.keyboard.up('Control');
        await this.page.keyboard.press('Backspace');
        
        // Type the value
        if (interaction.value) {
          await this.page.type(selector, interaction.value, { delay: 50 });
          console.log(`  → Typed "${interaction.value}" in: ${selector}`);
        }
        typed = true;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!typed) {
      console.log(`  → Could not type in element: ${interaction.selector}`);
    }
  }

  // Play change/select interaction
  async playChange(interaction) {
    await this.waitForElement(interaction.selector);
    
    const selectors = [
      interaction.selector,
      `#${interaction.id}`,
      `[name="${interaction.name}"]`
    ].filter(Boolean);

    let changed = false;
    for (const selector of selectors) {
      try {
        if (interaction.tagName === 'SELECT') {
          await this.page.select(selector, interaction.value);
          console.log(`  → Selected "${interaction.value}" in: ${selector}`);
        } else {
          await this.page.evaluate((selector, value) => {
            const element = document.querySelector(selector);
            if (element) {
              element.value = value;
              element.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }, selector, interaction.value);
          console.log(`  → Changed value to "${interaction.value}" in: ${selector}`);
        }
        changed = true;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!changed) {
      throw new Error(`Could not change element: ${interaction.selector}`);
    }
  }

  // Play checkbox interaction
  async playCheckbox(interaction) {
    await this.waitForElement(interaction.selector);
    
    const selectors = [
      interaction.selector,
      `#${interaction.id}`,
      `[name="${interaction.name}"]`
    ].filter(Boolean);

    let clicked = false;
    for (const selector of selectors) {
      try {
        const isChecked = await this.page.$eval(selector, el => el.checked);
        const shouldBeChecked = interaction.checked || interaction.value === 'true';
        
        if (isChecked !== shouldBeChecked) {
          await this.page.click(selector);
          console.log(`  → ${shouldBeChecked ? 'Checked' : 'Unchecked'}: ${selector}`);
        }
        clicked = true;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!clicked) {
      throw new Error(`Could not toggle checkbox: ${interaction.selector}`);
    }
  }

  // Play range/slider interaction
  async playRange(interaction) {
    await this.waitForElement(interaction.selector);
    
    try {
      await this.page.evaluate((selector, value) => {
        const element = document.querySelector(selector);
        if (element) {
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, interaction.selector, interaction.value);
      console.log(`  → Set range to "${interaction.value}": ${interaction.selector}`);
    } catch (error) {
      throw new Error(`Could not set range value: ${interaction.selector}`);
    }
  }

  // Play submit interaction
  async playSubmit(interaction) {
    await this.waitForElement(interaction.selector);
    
    try {
      await this.page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (element && element.tagName === 'FORM') {
          element.submit();
        }
      }, interaction.selector);
      console.log(`  → Submitted form: ${interaction.selector}`);
    } catch (error) {
      throw new Error(`Could not submit form: ${interaction.selector}`);
    }
  }

  // Wait for an element to be available
  async waitForElement(selector, timeout = 5000) {
    try {
      await this.page.waitForSelector(selector, { timeout, visible: true });
    } catch (error) {
      // Element might not be immediately available, continue anyway
      console.log(`  → Warning: Element not found within timeout: ${selector}`);
    }
  }

  // Helper method to ensure page is ready
  async ensurePageReady() {
    try {
      // Check if page is still responsive
      await this.page.evaluate(() => document.readyState);
    } catch (error) {
      console.log(`  → Page became unresponsive, refreshing reference`);
      const pages = await this.browser.pages();
      this.page = pages[pages.length - 1];
    }
  }

  // Start playback of the loaded recording
  async startPlayback() {
    if (!this.recording) {
      throw new Error('No recording loaded. Call loadRecording() first.');
    }

    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    console.log(`\nStarting playback of ${this.recording.totalInteractions} interactions at ${this.playbackSpeed}x speed...`);
    console.log('Press Ctrl+C to stop playback\n');

    let previousTimestamp = null;
    
    for (let i = 0; i < this.recording.interactions.length; i++) {
      const interaction = this.recording.interactions[i];
      
      // Calculate and apply delay between interactions
      if (previousTimestamp && interaction.timestamp) {
        const delay = this.calculateDelay(previousTimestamp, interaction.timestamp);
        if (delay > 50) { // Only show delay if significant
          console.log(`  → Waiting ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      await this.playInteraction(interaction, i);
      previousTimestamp = interaction.timestamp;
    }

    console.log('\n✅ Playback completed successfully!');
  }

  // Stop playback and close browser
  async stop() {
    if (this.browser) {
      await this.browser.close();
      console.log('Browser closed');
    }
  }
}

// Main function for command line usage
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node src/playback.js <recording-file> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --speed <number>     Playback speed (default: 1, half: 0.5, double: 2)');
    console.log('  --headless          Run in headless mode');
    console.log('');
    console.log('Examples:');
    console.log('  node src/playback.js recordings/interactions_1234567890.json');
    console.log('  node src/playback.js recordings/interactions_1234567890.json --speed 0.5');
    console.log('  node src/playback.js recordings/interactions_1234567890.json --headless');
    process.exit(1);
  }

  const recordingFile = args[0];
  const headless = args.includes('--headless');
  
  // Parse speed option
  let speed = 1;
  const speedIndex = args.indexOf('--speed');
  if (speedIndex !== -1 && args[speedIndex + 1]) {
    speed = parseFloat(args[speedIndex + 1]);
    if (isNaN(speed) || speed <= 0) {
      console.error('Error: Speed must be a positive number');
      process.exit(1);
    }
  }

  // Create playback instance
  const playback = new InteractionPlayback();
  
  // Handle Ctrl+C to stop playback gracefully
  process.on('SIGINT', async () => {
    console.log('\n\nStopping playback...');
    await playback.stop();
    process.exit(0);
  });

  try {
    // Load recording
    const fullPath = path.resolve(recordingFile);
    await playback.loadRecording(fullPath);
    
    // Initialize browser
    await playback.initialize(headless);
    
    // Set playback speed
    if (speed !== 1) {
      await playback.setPlaybackSpeed(speed);
    }
    
    // Start playback
    await playback.startPlayback();
    
    // Close browser after completion
    await playback.stop();
    
  } catch (error) {
    console.error('Error:', error.message);
    await playback.stop();
    process.exit(1);
  }
}

// Only run main() if this file is executed directly
if (require.main === module) {
  main();
}

// Export the class for use in other files
module.exports = InteractionPlayback;