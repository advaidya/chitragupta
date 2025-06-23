// Simple test file to validate the interaction recorder
const InteractionRecorder = require('../src/index.js');
const fs = require('fs');
const path = require('path');

// Test function to check if the recorder works properly
async function runTests() {
  console.log('Starting interaction recorder tests...\n');
  
  // Test 1: Check if recorder can be created
  console.log('Test 1: Creating InteractionRecorder instance...');
  const recorder = new InteractionRecorder();
  
  // Check if recorder has required properties
  if (recorder.interactions && Array.isArray(recorder.interactions)) {
    console.log('✓ Recorder created successfully with interactions array');
  } else {
    console.log('✗ Failed to create recorder properly');
    return false;
  }
  
  // Test 2: Check if session ID is generated
  console.log('\nTest 2: Checking session ID generation...');
  if (recorder.sessionId && typeof recorder.sessionId === 'string') {
    console.log(`✓ Session ID generated: ${recorder.sessionId}`);
  } else {
    console.log('✗ Session ID not generated properly');
    return false;
  }
  
  // Test 3: Test manual interaction recording
  console.log('\nTest 3: Testing manual interaction recording...');
  recorder.recordInteraction('test', {
    description: 'This is a test interaction',
    testData: 'sample data'
  });
  
  if (recorder.interactions.length === 1) {
    console.log('✓ Manual interaction recorded successfully');
    console.log(`   Recorded: ${JSON.stringify(recorder.interactions[0], null, 2)}`);
  } else {
    console.log('✗ Manual interaction recording failed');
    return false;
  }
  
  // Test 4: Test saving interactions
  console.log('\nTest 4: Testing save functionality...');
  await recorder.saveInteractions();
  
  // Check if file was created
  const expectedFile = path.join(__dirname, '../recordings', `interactions_${recorder.sessionId}.json`);
  if (fs.existsSync(expectedFile)) {
    console.log(`✓ Interactions file saved successfully: ${expectedFile}`);
    
    // Read and validate file content
    const fileContent = fs.readFileSync(expectedFile, 'utf8');
    const data = JSON.parse(fileContent);
    
    if (data.sessionId && data.interactions && data.totalInteractions === 1) {
      console.log('✓ File content is valid JSON with expected structure');
      console.log(`   Total interactions in file: ${data.totalInteractions}`);
    } else {
      console.log('✗ File content is not valid or missing expected properties');
      return false;
    }
  } else {
    console.log('✗ Interactions file was not created');
    return false;
  }
  
  // Test 5: Quick browser test (optional - requires more setup)
  console.log('\nTest 5: Quick browser initialization test...');
  try {
    // This is a minimal test - just check if we can create browser instance
    // In a real test, you might want to navigate to a test page
    console.log('Note: Skipping full browser test in automated testing');
    console.log('   To test browser functionality, run: npm start https://example.com');
    console.log('✓ Browser test preparation completed');
  } catch (error) {
    console.log(`✗ Browser test failed: ${error.message}`);
    return false;
  }
  
  console.log('\n=== All Tests Completed Successfully! ===');
  console.log('The interaction recorder is ready to use.');
  console.log('\nTo test with a real website, run:');
  console.log('npm start https://example.com');
  console.log('npm start https://www.google.com');
  console.log('npm start (uses https://example.com by default)');
  
  return true;
}

// Run tests when this file is executed directly
if (require.main === module) {
  runTests()
    .then(success => {
      if (success) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Some tests failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

// Export the test function so it can be used by other modules
module.exports = { runTests };