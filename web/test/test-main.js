/**
 * Test Main
 * Initialize and run tests
 */

// Wait for page to load
window.addEventListener('load', () => {
    console.log('Test framework loaded');
    console.log(`Registered ${testFramework.tests.length} tests`);
    
    // Auto-run tests after a short delay (optional)
    // setTimeout(() => {
    //     runAllTests();
    // }, 1000);
});

