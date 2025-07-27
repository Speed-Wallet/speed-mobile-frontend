import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAlert } from '@/providers/AlertProvider';

const AlertDemo: React.FC = () => {
  const { alert, success, error, warning, confirm } = useAlert();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Custom Alert Demo</Text>
      
      <TouchableOpacity 
        style={[styles.button, styles.infoButton]} 
        onPress={() => alert('Info Alert', 'This is an informational message')}
      >
        <Text style={styles.buttonText}>Show Info Alert</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.successButton]} 
        onPress={() => success('Success!', 'Operation completed successfully')}
      >
        <Text style={styles.buttonText}>Show Success Alert</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.errorButton]} 
        onPress={() => error('Error!', 'Something went wrong')}
      >
        <Text style={styles.buttonText}>Show Error Alert</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.warningButton]} 
        onPress={() => warning('Warning!', 'Please be careful')}
      >
        <Text style={styles.buttonText}>Show Warning Alert</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, styles.confirmButton]} 
        onPress={() => confirm(
          'Confirm Action', 
          'Are you sure you want to proceed?',
          () => alert('Confirmed!', 'You chose to proceed'),
          () => alert('Cancelled', 'You chose to cancel')
        )}
      >
        <Text style={styles.buttonText}>Show Confirm Dialog</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#121212',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  infoButton: {
    backgroundColor: '#3b82f6',
  },
  successButton: {
    backgroundColor: '#22c55e',
  },
  errorButton: {
    backgroundColor: '#ef4444',
  },
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  confirmButton: {
    backgroundColor: '#7c5cff',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default AlertDemo;
