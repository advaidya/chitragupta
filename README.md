# Interaction Recorder

A Puppeteer-based application that records user interactions with websites and saves them in JSON format. This tool captures clicks, form inputs, navigation, and other user activities for analysis, testing, or automation purposes. By default, it's configured to record interactions on the Allstate purchase flow.

## Features

### Recording Features
- **Comprehensive Interaction Recording**: Captures clicks, text inputs, form changes, submissions, and page navigation
- **Detailed Element Information**: Records element selectors, attributes, coordinates, and content
- **JSON Output**: Saves all interactions in structured JSON format with timestamps
- **Session Management**: Each recording session gets a unique ID and metadata
- **Browser Control**: Run in visible or headless mode
- **Real-time Recording**: Interactions are captured as they happen

### Playback Features
- **Accurate Replay**: Reproduces recorded interactions with precise timing and element targeting
- **Speed Control**: Adjust playback speed from 0.25x to 4x (or any custom speed)
- **Smart Element Finding**: Uses multiple selector strategies (ID, class, name, coordinates) for reliable playback
- **Error Handling**: Continues playback even if individual interactions fail
- **Progress Tracking**: Shows real-time progress during playback
- **Flexible Navigation**: Handles page navigation and URL changes automatically

## Installation

### Prerequisites

- Node.js version 16 or higher
- NPM (comes with Node.js)

### Setup Steps

1. **Clone or download this project** to your local machine

2. **Navigate to the project directory**:
   ```bash
   cd chitragupta
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```
   This will install Puppeteer and download a Chromium browser automatically.

## Usage

### Recording Interactions

**Start recording with default website (Allstate purchase page):**
```bash
npm start
```

**Record interactions on a specific website:**
```bash
npm start https://www.google.com
npm start https://github.com
npm start https://your-website.com
```

**Run in headless mode (no browser window visible):**
```bash
npm start --headless
# Or with a specific URL
npm start https://example.com --headless
```

### Playing Back Recordings

The playback system allows you to replay any recorded session with full automation control.

#### Basic Playback Commands

**Play back a recorded session:**
```bash
npm run playback recordings/interactions_1234567890.json
```

**Available Options:**
- `--speed <number>` - Playback speed multiplier (default: 1)
- `--headless` - Run without visible browser window

#### Speed Control Examples

```bash
# Debug mode (very slow)
npm run playback recordings/interactions_1234567890.json -- --speed 0.1

# Half speed (easier to follow)
npm run playback recordings/interactions_1234567890.json -- --speed 0.5

# Normal speed
npm run playback recordings/interactions_1234567890.json -- --speed 1

# Double speed (faster)
npm run playback recordings/interactions_1234567890.json -- --speed 2

# Custom speed
npm run playback recordings/interactions_1234567890.json -- --speed 1.5
```

#### Advanced Usage

**Silent background playback:**
```bash
npm run playback recordings/interactions_1234567890.json -- --headless --speed 2
```

**Debug specific interactions:**
```bash
npm run playback recordings/interactions_1234567890.json -- --speed 0.25
```

#### What Playback Supports

- ✅ **Clicks** - Buttons, links, any clickable elements
- ✅ **Text Input** - Form fields, search boxes, text areas
- ✅ **Form Controls** - Dropdowns, checkboxes, radio buttons
- ✅ **Navigation** - Page changes, URL navigation
- ✅ **Form Submission** - Form submissions and data entry
- ✅ **Range Sliders** - Slider controls and range inputs
- ✅ **Coordinate Fallback** - Uses mouse coordinates when selectors fail
- ✅ **Smart Retry** - Multiple selector strategies for reliability

### How to Use Recording

1. **Run the command** - The browser will open and navigate to your specified URL
2. **Interact with the website** - Click buttons, fill forms, navigate pages, etc.
3. **Stop recording** - Press `Ctrl+C` (or `Cmd+C` on Mac) in the terminal
4. **Check the output** - Your interactions will be saved in the `recordings/` folder

### How to Use Playback

1. **Run the playback command** with a recording file - The browser will open and start replaying your interactions
2. **Watch the automation** - The browser will automatically perform all recorded actions
3. **Stop playback** - Press `Ctrl+C` (or `Cmd+C` on Mac) in the terminal to stop early, or let it complete
4. **Analysis complete** - The playback will show you exactly how the interactions were performed

### Example Sessions

#### Recording Session
```bash
# Start recording with default Allstate page
npm start

# Or record a specific website
npm start https://purchase.allstate.com/onlineshopping/warmup/1

# The browser opens and shows:
# "Recording started. Interact with the page..."
# "Press Ctrl+C to stop recording and save data."

# After interacting with the website, press Ctrl+C
# Terminal shows:
# "Stopping recording..."
# "Interactions saved to: recordings/interactions_1234567890.json"
# "Total interactions recorded: 15"
```

#### Playback Session
```bash
# Play back the recorded interactions
npm run playback recordings/interactions_1234567890.json

# Terminal shows:
# "Loaded recording: 1234567890"
# "Total interactions: 15"
# "Duration: 12/23/2024, 2:30:00 PM - 12/23/2024, 2:35:00 PM"
# "Starting playback of 15 interactions at 1x speed..."
# "[1/15] Playing: click on https://www.example.com"
# "[2/15] Playing: input on https://www.example.com"
# "✅ Playback completed successfully!"
```

## Output Format

The recorded interactions are saved as JSON files in the `recordings/` directory. Each file contains:

### File Structure
```json
{
  "sessionId": "1234567890",
  "startTime": "2024-01-15T10:30:00.000Z",
  "endTime": "2024-01-15T10:35:00.000Z",
  "totalInteractions": 5,
  "interactions": [...]
}
```

### Interaction Types

#### Click Events
```json
{
  "type": "click",
  "timestamp": 1234567890123,
  "url": "https://purchase.allstate.com/onlineshopping/warmup/1",
  "pageTitle": "Allstate Purchase Flow",
  "tagName": "BUTTON",
  "id": "continue-btn",
  "className": "btn btn-primary",
  "text": "Continue",
  "href": null,
  "selector": "#continue-btn",
  "coordinates": { "x": 150, "y": 300 }
}
```

#### Input Events (Text Typing)
```json
{
  "type": "input",
  "timestamp": 1234567890456,
  "url": "https://example.com",
  "pageTitle": "Contact Form",
  "tagName": "INPUT",
  "id": "email",
  "className": "form-control",
  "name": "email",
  "type": "email",
  "value": "user@example.com",
  "selector": "#email"
}
```

#### Change Events (Dropdowns, Checkboxes)
```json
{
  "type": "change",
  "timestamp": 1234567890789,
  "url": "https://example.com",
  "tagName": "SELECT",
  "name": "country",
  "value": "USA",
  "selector": "[name=\"country\"]"
}
```

#### Navigation Events
```json
{
  "type": "navigation",
  "timestamp": 1234567890012,
  "url": "https://example.com/page2",
  "pageTitle": "Page 2"
}
```

## Testing

### Basic Testing

Run the included tests to verify recording functionality:

```bash
npm test
```

The test will:
- Create a recorder instance
- Test interaction recording
- Test file saving
- Validate JSON output format

### Playback Testing

Test the playback functionality with your recorded sessions:

**Quick Test (First 10 interactions only):**
```bash
node test-playback.js
```

**Full Recording Playback:**
```bash
npm run playback recordings/interactions_XXXXXX.json
```

**Test Different Speeds:**
```bash
# Slow motion for debugging
npm run playback recordings/interactions_XXXXXX.json -- --speed 0.25

# Normal speed
npm run playback recordings/interactions_XXXXXX.json -- --speed 1

# Fast playback
npm run playback recordings/interactions_XXXXXX.json -- --speed 2
```

**Test Headless Mode:**
```bash
npm run playback recordings/interactions_XXXXXX.json -- --headless
```

### End-to-End Testing

Complete workflow test:

```bash
# 1. Record interactions (interact with the site, then Ctrl+C)
npm start

# 2. List your recordings
ls recordings/

# 3. Play back the recording
npm run playback recordings/interactions_[your-session-id].json

# 4. Test with different options
npm run playback recordings/interactions_[your-session-id].json -- --speed 0.5 --headless
```

## Project Structure

```
interaction-recorder/
├── src/
│   ├── index.js          # Main recording application
│   └── playback.js       # Playback application
├── test/
│   └── test.js           # Test cases
├── recordings/           # Output directory (created automatically)
├── package.json          # Project configuration
└── README.md            # This file
```

## Troubleshooting

### Recording Issues

**Error: "Browser failed to launch"**
- Make sure you have sufficient permissions
- Try running with `--no-sandbox` flag: modify the launch options in `src/index.js`

**Error: "Cannot find module 'puppeteer'"**
- Run `npm install` to install dependencies
- Make sure you're in the correct directory

**No interactions recorded**
- Make sure you're clicking/typing on the page after it loads
- Check that the browser window is focused
- Verify the terminal shows "Recording started..." message

**JSON file not created**
- Make sure you press `Ctrl+C` to stop recording properly
- Check file permissions in the project directory
- Look for error messages in the terminal

### Playback Issues

**Error: "Recording file not found"**
- Check that the file path is correct
- Use absolute or relative paths from the project root
- Verify the recording file exists in the `recordings/` directory

**Playback fails on specific interactions**
- Website might have changed since recording
- Try slower playback speed: `--speed 0.5`
- Check browser console for JavaScript errors
- Some interactions may be skipped but playback continues

**Elements not found during playback**
- Website structure may have changed
- Use slower playback speed for better element detection
- Check if the website requires login or has changed URLs

**Playback too fast or slow**
- Adjust speed with `--speed` option (0.25 = quarter speed, 2 = double speed)
- Use `--speed 0.1` for very detailed debugging

### Performance Notes

- Recording many interactions can use memory - for long sessions, consider stopping and restarting
- Large websites with many elements might slow down recording slightly
- Headless mode uses less resources than visible browser mode

## Advanced Usage

### Customizing the Code

The main logic is in `src/index.js`. You can modify:

- **Event listeners**: Add more interaction types in the `setupEventListeners()` method
- **Data collection**: Modify what information is captured for each interaction
- **Output format**: Change how the JSON file is structured
- **Browser settings**: Adjust Puppeteer launch options

### Example Modifications

**Record scroll events:**
```javascript
// Add this in the evaluateOnNewDocument section
document.addEventListener('scroll', (event) => {
  recordInteraction('scroll', {
    scrollX: window.scrollX,
    scrollY: window.scrollY
  });
});
```

**Record hover events:**
```javascript
document.addEventListener('mouseover', (event) => {
  recordInteraction('hover', {
    tagName: event.target.tagName,
    selector: this.getSelector(event.target)
  });
});
```

## Security and Privacy

- This tool only records interactions on websites you explicitly visit
- Sensitive information like passwords may be captured in form fields
- Review recorded JSON files before sharing
- Use headless mode and limit recording time for privacy

## License

MIT License - feel free to modify and distribute.

## Quick Reference

### Available Commands

```bash
# Recording
npm start                                    # Record with default Allstate URL
npm start <url>                             # Record specific website
npm start --headless                        # Record in headless mode
npm start <url> --headless                  # Record specific URL headless

# Playback
npm run playback <recording-file>           # Basic playback
npm run playback <file> -- --speed <num>   # Custom speed
npm run playback <file> -- --headless      # Headless playback
npm run playback <file> -- --speed 0.5 --headless  # Combined options

# Testing
npm test                                    # Run recording tests
node test-playback.js                      # Quick playback test
ls recordings/                             # List all recordings
```

### File Locations

- **Recordings**: `recordings/interactions_[timestamp].json`
- **Main recorder**: `src/index.js`
- **Playback engine**: `src/playback.js`
- **Tests**: `test/test.js` and `test-playback.js`

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Make sure you have the latest Node.js version
3. Try running the test suite: `npm test`
4. For playback issues, try slower speeds: `--speed 0.25`
5. Check the terminal output for specific error messages
