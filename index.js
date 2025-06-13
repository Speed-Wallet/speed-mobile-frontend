import { install } from 'react-native-quick-crypto';
install();

// Test if crypto is working
try {
  const testArray = new Uint8Array(4);
  if (global.crypto && global.crypto.getRandomValues) {
    global.crypto.getRandomValues(testArray);
    console.log("✅ Crypto polyfill is working! Random values:", Array.from(testArray));
    alert(`✅ Crypto setup complete! Random test: ${Array.from(testArray).join(',')}`);
  } else {
    console.log("❌ Crypto polyfill failed");
    alert("❌ Crypto setup failed - getRandomValues not available");
  }
} catch (error) {
  console.log("❌ Crypto test error:", error);
  alert(`❌ Crypto test error: ${error.message}`);
}

// Import the main app entry point last
import "expo-router/entry";