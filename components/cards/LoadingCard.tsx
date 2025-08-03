import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { User, Eye, X, Clock, CheckCircle, AlertCircle } from 'lucide-react-native';
import { PaymentCard as PaymentCardType } from '@/data/types';
import LoadingSkeleton from '@/components/LoadingSkeleton';

interface LoadingCardProps {
  card: PaymentCardType;
  onDeleteCard: (cardId: string) => void;
  getBrandLogo: (brand: 'mastercard' | 'visa') => any;
  isDevelopment?: boolean;
  // Development functions for simulating creation steps
  onSimulateUSDTReceived?: (cardId: string) => void;
  onAdvanceCreationStep?: (cardId: string) => void;
  onResetCreationStep?: (cardId: string) => void;
}

/**
 * LoadingCard - Shows a card that is currently being created
 * Displays the 3-step creation process with real-time status updates
 */
export const LoadingCard: React.FC<LoadingCardProps> = ({
  card,
  onDeleteCard,
  getBrandLogo,
  isDevelopment = false,
  onSimulateUSDTReceived,
  onAdvanceCreationStep,
  onResetCreationStep,
}) => {
  // Determine the current step based on card status/state
  const getCreationStep = () => {
    // Check if we have creation step data in the card
    if (card.creationStep) {
      return card.creationStep;
    }
    
    // Default to step 1 for backward compatibility
    return 1;
  };

  const currentStep = getCreationStep();

  // Step configuration
  const steps = [
    {
      number: 1,
      title: 'Confirming Transaction',
      description: 'Processing payment details',
      icon: Clock,
      color: '#3182ce'
    },
    {
      number: 2,
      title: 'Verifying KYC',
      description: 'Identity verification in progress',
      icon: Clock,
      color: '#3182ce'
    },
    {
      number: 3,
      title: 'Creating Card',
      description: 'Generating virtual card',
      icon: Clock,
      color: '#3182ce'
    }
  ];

  const getStepStatus = (stepNumber: number) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'pending';
  };

  const getStepIcon = (stepNumber: number) => {
    const status = getStepStatus(stepNumber);
    if (status === 'completed') return CheckCircle;
    if (status === 'active') return Clock;
    return Clock;
  };

  const getStepColor = (stepNumber: number) => {
    const status = getStepStatus(stepNumber);
    if (status === 'completed') return '#10b981';
    if (status === 'active') return '#3182ce';
    return '#6b7280';
  };

  return (
    <View style={[styles.paymentCard, styles.loadingCard]}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHolderSection}>
          <View style={styles.userIcon}>
            <User size={14} color="#ffffff" />
          </View>
          <Text style={styles.cardHolderName}>{card.holder || card.cardName || 'Card'}</Text>
          <View style={[styles.loadingBadge, { backgroundColor: getStepColor(currentStep) }]}>
            <Clock size={12} color="#ffffff" />
            <Text style={styles.loadingBadgeText}>Creating...</Text>
          </View>
        </View>
        <View style={styles.cardHeaderActions}>
          <Image
            source={getBrandLogo(card.brand)}
            style={[styles.brandLogo, styles.loadingOpacity]}
            resizeMode="contain"
          />
          {isDevelopment && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDeleteCard(card.id)}
            >
              <X size={16} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Card Number Section */}
      <View style={styles.cardNumberSection}>
        <LoadingSkeleton width="65%" height={22} borderRadius={4} />
        <View style={styles.visibilityButton}>
          <Eye size={20} color="#555555" />
        </View>
      </View>

      {/* Creation Steps Progress */}
      <View style={styles.stepsContainer}>
        <View style={styles.stepsHeader}>
          <View style={styles.stepIndicators}>
            {steps.map((step, index) => {
              const Icon = getStepIcon(step.number);
              const color = getStepColor(step.number);
              const status = getStepStatus(step.number);
              
              return (
                <React.Fragment key={step.number}>
                  <View style={[styles.stepIndicator, { borderColor: color }]}>
                    <Icon size={16} color={color} />
                  </View>
                  {index < steps.length - 1 && (
                    <View style={[styles.stepConnector, {
                      backgroundColor: step.number < currentStep ? '#10b981' : '#374151'
                    }]} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Current Step Details */}
        <View style={styles.currentStepContainer}>
          <View style={styles.currentStepHeader}>
            <CheckCircle size={16} color="#10b981" />
            <Text style={styles.currentStepTitle}>
              {steps[currentStep - 1]?.title}
            </Text>
          </View>
          <Text style={styles.currentStepDescription}>
            {steps[currentStep - 1]?.description}
          </Text>
        </View>

        {/* All Steps List */}
        <View style={styles.stepsList}>
          {steps.map((step) => {
            const Icon = getStepIcon(step.number);
            const color = getStepColor(step.number);
            const status = getStepStatus(step.number);
            
            return (
              <View key={step.number} style={styles.stepItem}>
                <View style={styles.stepItemIcon}>
                  <Icon size={14} color={color} />
                </View>
                <View style={styles.stepItemContent}>
                  <Text style={[styles.stepItemTitle, {
                    color: status === 'completed' ? '#10b981' : 
                           status === 'active' ? '#ffffff' : '#9ca3af'
                  }]}>
                    {step.title}
                  </Text>
                  <Text style={styles.stepItemDescription}>
                    {step.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Processing Time Notice */}
      <View style={styles.processingNotice}>
        <Clock size={16} color="#3182ce" />
        <View style={styles.processingNoticeContent}>
          <Text style={styles.processingNoticeTitle}>Processing Time</Text>
          <Text style={styles.processingNoticeText}>
            Card creation may take up to 10 minutes to complete.
          </Text>
        </View>
      </View>

      {/* Development Simulation Controls */}
      {isDevelopment && (
        <View style={styles.devControls}>
          <Text style={styles.devTitle}>Development Controls</Text>
          <View style={styles.devButtonRow}>
            <TouchableOpacity
              style={[styles.devButton, styles.usdtButton]}
              onPress={() => onSimulateUSDTReceived?.(card.id)}
            >
              <Text style={styles.devButtonText}>Simulate USDT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devButton, styles.advanceButton]}
              onPress={() => onAdvanceCreationStep?.(card.id)}
            >
              <Text style={styles.devButtonText}>Advance Step</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devButton, styles.resetButton]}
              onPress={() => onResetCreationStep?.(card.id)}
            >
              <Text style={styles.devButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  paymentCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingCard: {
    borderColor: '#4a5568',
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHolderSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  cardHolderName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  loadingBadge: {
    backgroundColor: '#3182ce',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loadingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogo: {
    width: 40,
    height: 25,
  },
  loadingOpacity: {
    opacity: 0.5,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNumberSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  visibilityButton: {
    padding: 4,
  },
  stepsContainer: {
    marginBottom: 20,
  },
  stepsHeader: {
    marginBottom: 16,
  },
  stepIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  stepConnector: {
    width: 40,
    height: 2,
    marginHorizontal: 8,
  },
  currentStepContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  currentStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginLeft: 8,
  },
  currentStepDescription: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepItemIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepItemContent: {
    flex: 1,
  },
  stepItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepItemDescription: {
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 16,
  },
  processingNotice: {
    backgroundColor: 'rgba(49, 130, 206, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#3182ce',
  },
  processingNoticeContent: {
    flex: 1,
  },
  processingNoticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3182ce',
    marginBottom: 4,
  },
  processingNoticeText: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: 18,
  },
  // Development Control Styles
  devControls: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  devTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffd700',
    marginBottom: 12,
    textAlign: 'center',
  },
  devButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  devButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  usdtButton: {
    backgroundColor: '#10b981',
  },
  advanceButton: {
    backgroundColor: '#3182ce',
  },
  resetButton: {
    backgroundColor: '#ef4444',
  },
  devButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});
