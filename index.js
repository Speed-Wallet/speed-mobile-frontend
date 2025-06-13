import { install } from 'react-native-quick-crypto';
install();

// Test if crypto is working
try {
  const testArray = new Uint8Array(4);
  if (global.crypto && global.crypto.getRandomValues) {
    global.crypto.getRandomValues(testArray);
  } else {
    alert("❌ Crypto setup failed - getRandomValues not available");
    throw new Error("Crypto polyfill not available");
  }
} catch (error) {
  alert(`❌ Crypto test error: ${error.message}`);
  throw error;
}

// Import the main app entry point last
import "expo-router/entry";