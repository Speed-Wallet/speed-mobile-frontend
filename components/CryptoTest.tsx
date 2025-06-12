import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';

export default function CryptoTest() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const testCryptoPolyfill = () => {
    const results: string[] = [];
    
    try {
      // Test 1: Check if crypto is available
      if (typeof crypto !== 'undefined') {
        results.push('✅ crypto is available');
      } else {
        results.push('❌ crypto is not available');
      }

      // Test 2: Check if getRandomValues works
      if (crypto && crypto.getRandomValues) {
        const array = new Uint8Array(10);
        crypto.getRandomValues(array);
        results.push('✅ crypto.getRandomValues works');
        results.push(`Random values: ${Array.from(array).join(', ')}`);
      } else {
        results.push('❌ crypto.getRandomValues not available');
      }

      // Test 3: Test react-native-quick-crypto import
      import('react-native-quick-crypto').then((quickCrypto) => {
        results.push('✅ react-native-quick-crypto import successful');
        
        // Test createHash
        const hash = quickCrypto.createHash('sha256');
        hash.update('test');
        const hashResult = hash.digest('hex');
        results.push(`✅ SHA256 hash test: ${hashResult}`);
        
        setTestResults([...results]);
      }).catch((error) => {
        results.push('❌ react-native-quick-crypto import failed: ' + error.message);
        setTestResults([...results]);
      });

    } catch (error) {
      results.push('❌ Error during crypto test: ' + (error as Error).message);
      setTestResults(results);
    }
  };

  useEffect(() => {
    testCryptoPolyfill();
  }, []);

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Crypto Polyfill Test Results:
      </Text>
      
      {testResults.map((result, index) => (
        <Text key={index} style={{ marginBottom: 5, fontFamily: 'monospace' }}>
          {result}
        </Text>
      ))}
      
      <Button 
        title="Run Test Again" 
        onPress={testCryptoPolyfill}
        style={{ marginTop: 20 }}
      />
    </View>
  );
}
