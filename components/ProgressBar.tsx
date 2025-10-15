import React from 'react';
import { View, StyleSheet } from 'react-native';
import { verticalScale } from 'react-native-size-matters';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.progressTrack}>
        {Array.from({ length: totalSteps }, (_, index) => (
          <View
            key={index}
            style={[
              styles.progressStep,
              index < currentStep ? styles.completedStep : styles.pendingStep,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: verticalScale(16),
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 4,
  },
  progressStep: {
    flex: 1,
    height: 4,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  completedStep: {
    backgroundColor: '#00CFFF',
  },
  pendingStep: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default ProgressBar;
