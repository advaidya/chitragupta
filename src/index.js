// Import required Node.js modules
const puppeteer = require('puppeteer'); // Web browser automation library
const fs = require('fs'); // File system operations
const path = require('path'); // File path utilities

// Main class that handles recording user interactions
class InteractionRecorder {
  constructor() {
    // Array to store all recorded interactions
    this.interactions = [];
    // Unique session ID based on current timestamp
    this.sessionId = Date.now().toString();
    // Will hold the browser instance
    this.browser = null;
    // Will hold the current page instance
    this.page = null;
  }

  // Initialize the browser and start recording
  async initialize(url = 'https://example.com', headless = false) {
    console.log('Launching browser...');
    
    // Launch Chrome/Chromium browser
    // headless: false means browser window will be visible
    // defaultViewport: null uses full screen
    this.browser = await puppeteer.launch({ 
      headless: headless,
      defaultViewport: null,
      args: ['--start-maximized'] // Start browser maximized
    });
    
    // Create a new page (tab) in the browser
    this.page = await this.browser.newPage();
    
    // Set up event listeners to capture user interactions
    await this.setupEventListeners();
    
    // Navigate to the specified URL
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url);
    
    console.log('Recording started. Interact with the page...');
    console.log('Press Ctrl+C to stop recording and save data.');
  }

  // Set up listeners for various user interactions
  async setupEventListeners() {
    // Inject JavaScript code into every new page that loads
    await this.page.evaluateOnNewDocument(() => {
      // Create array to store interactions in the browser context
      window.recordedInteractions = [];
      
      // Helper function to record an interaction
      const recordInteraction = (type, data) => {
        const interaction = {
          type, // Type of interaction (click, input, etc.)
          timestamp: Date.now(), // When it happened
          url: window.location.href, // Current page URL
          ...data // Additional data specific to the interaction
        };
        window.recordedInteractions.push(interaction);
      };

      // Listen for click events on any element
      document.addEventListener('click', (event) => {
        const element = event.target; // The element that was clicked
        recordInteraction('click', {
          tagName: element.tagName, // HTML tag name (DIV, BUTTON, etc.)
          id: element.id || null, // Element's ID attribute
          className: element.className || null, // Element's CSS classes
          text: element.textContent?.trim().substring(0, 100) || null, // Text content (first 100 chars)
          href: element.href || null, // Link URL if it's a link
          selector: this.getSelector(element), // CSS selector to find this element
          coordinates: { x: event.clientX, y: event.clientY } // Mouse click coordinates
        });
      }, true); // true means capture phase (before bubbling)

      // Listen for input events (typing in text fields)
      document.addEventListener('input', (event) => {
        const element = event.target;
        recordInteraction('input', {
          tagName: element.tagName,
          id: element.id || null,
          className: element.className || null,
          name: element.name || null, // Form field name
          type: element.type || null, // Input type (text, email, password, etc.)
          value: element.value?.substring(0, 100) || null, // Current value (first 100 chars)
          selector: this.getSelector(element)
        });
      }, true);

      // Listen for change events (dropdowns, checkboxes, radio buttons)
      document.addEventListener('change', (event) => {
        const element = event.target;
        recordInteraction('change', {
          tagName: element.tagName,
          id: element.id || null,
          className: element.className || null,
          name: element.name || null,
          type: element.type || null,
          value: element.value || null, // Selected value
          checked: element.checked || null, // For checkboxes/radio buttons
          selector: this.getSelector(element)
        });
      }, true);

      // Listen for form submissions
      document.addEventListener('submit', (event) => {
        const element = event.target; // The form element
        recordInteraction('submit', {
          tagName: element.tagName,
          id: element.id || null,
          className: element.className || null,
          action: element.action || null, // Form action URL
          method: element.method || null, // Form method (GET/POST)
          selector: this.getSelector(element)
        });
      }, true);

      // Helper function to generate a CSS selector for an element
      this.getSelector = function(element) {
        // If element has an ID, use that (most specific)
        if (element.id) return `#${element.id}`;
        // If element has a name attribute, use that
        if (element.name) return `[name="${element.name}"]`;
        
        // Build selector using tag name and classes
        let selector = element.tagName.toLowerCase();
        if (element.className) {
          // Convert space-separated classes to CSS selector format
          selector += `.${element.className.split(' ').join('.')}`;
        }
        
        // If there are multiple similar elements, add position info
        const parent = element.parentElement;
        if (parent && parent !== document.body) {
          // Find all sibling elements with same tag name
          const siblings = Array.from(parent.children).filter(child => 
            child.tagName === element.tagName
          );
          if (siblings.length > 1) {
            // Add nth-of-type to make selector unique
            const index = siblings.indexOf(element);
            selector += `:nth-of-type(${index + 1})`;
          }
        }
        
        return selector;
      };
    });

    // Listen for page navigation events
    this.page.on('framenavigated', (frame) => {
      // Only record navigation for main frame (not iframes)
      if (frame === this.page.mainFrame()) {
        this.recordInteraction('navigation', {
          url: frame.url(),
          title: null // Will be filled in later
        });
      }
    });

    // Every second, collect interactions from the browser and store them
    setInterval(async () => {
      try {
        // Get interactions from browser context and clear the array
        const pageInteractions = await this.page.evaluate(() => {
          const interactions = window.recordedInteractions || [];
          window.recordedInteractions = []; // Clear after collecting
          return interactions;
        });
        
        // Add collected interactions to our main array
        this.interactions.push(...pageInteractions);
        
        // Get page title and add it to interactions
        const title = await this.page.title();
        if (pageInteractions.length > 0) {
          pageInteractions.forEach(interaction => {
            interaction.pageTitle = title;
          });
        }
      } catch (error) {
        console.log('Error collecting interactions:', error.message);
      }
    }, 1000); // Run every 1000 milliseconds (1 second)
  }

  // Record an interaction from Node.js context (not browser context)
  recordInteraction(type, data) {
    const interaction = {
      type,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      ...data // Spread operator - includes all properties from data object
    };
    this.interactions.push(interaction);
  }

  // Save all recorded interactions to a JSON file
  async saveInteractions() {
    // Create recordings directory if it doesn't exist
    const recordingsDir = path.join(__dirname, '../recordings');
    if (!fs.existsSync(recordingsDir)) {
      fs.mkdirSync(recordingsDir, { recursive: true });
    }

    // Create filename with session ID
    const filename = `interactions_${this.sessionId}.json`;
    const filepath = path.join(recordingsDir, filename);
    
    // Prepare data object with metadata and interactions
    const data = {
      sessionId: this.sessionId,
      startTime: new Date(parseInt(this.sessionId)).toISOString(), // Convert timestamp to readable date
      endTime: new Date().toISOString(), // Current time
      totalInteractions: this.interactions.length,
      interactions: this.interactions // All recorded interactions
    };

    // Write JSON file with pretty formatting (2 space indentation)
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`\nInteractions saved to: ${filepath}`);
    console.log(`Total interactions recorded: ${this.interactions.length}`);
  }

  // Clean up - close the browser
  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main function that runs when script is executed
async function main() {
  // Create new recorder instance
  const recorder = new InteractionRecorder();
  
  // Get URL from command line arguments, default to example.com
  const url = process.argv[2] || 'https://example.com';
  // Check if --headless flag is provided
  const headless = process.argv.includes('--headless');
  
  // Handle Ctrl+C (SIGINT signal) - save data and exit gracefully
  process.on('SIGINT', async () => {
    console.log('\nStopping recording...');
    await recorder.saveInteractions();
    await recorder.close();
    process.exit(0); // Exit successfully
  });

  // Start the recording process
  try {
    await recorder.initialize(url, headless);
  } catch (error) {
    console.error('Error:', error);
    await recorder.close();
    process.exit(1); // Exit with error code
  }
}

// Only run main() if this file is executed directly (not imported as module)
if (require.main === module) {
  main();
}

// Export the class so it can be imported by other files
module.exports = InteractionRecorder;