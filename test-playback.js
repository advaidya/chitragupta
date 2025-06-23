// Simple test script for playback functionality
const InteractionPlayback = require('./src/playback.js');

async function testPlayback() {
  const playback = new InteractionPlayback();
  
  try {
    console.log('🧪 Testing playback functionality...\n');
    
    // Load the recording
    console.log('📁 Loading recording...');
    await playback.loadRecording('./recordings/interactions_1750718332829.json');
    
    // Initialize browser
    console.log('🌐 Initializing browser...');
    await playback.initialize(false); // Visible mode for testing
    
    // Set a slower speed for testing
    console.log('⚡ Setting playback speed to 0.75x...');
    await playback.setPlaybackSpeed(0.75);
    
    // Start playback with a limited number of interactions for testing
    console.log('▶️  Starting playback (first 10 interactions only)...\n');
    
    // Override the interactions array to limit for testing
    const originalInteractions = playback.recording.interactions;
    playback.recording.interactions = originalInteractions.slice(0, 10);
    playback.recording.totalInteractions = 10;
    
    await playback.startPlayback();
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await playback.stop();
  }
}

// Run the test
testPlayback();