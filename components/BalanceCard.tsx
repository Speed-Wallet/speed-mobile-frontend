import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ActionButton from '@/components/ActionButton'; // Assuming this is your shared ActionButton
import { ArrowUp, ArrowDown, ShoppingCart, RotateCw } from 'lucide-react-native';
import colors from '@/constants/colors'; // Assuming you might want to use consistent colors

interface BalanceCardProps {
  balance: number;
  currencySymbol?: string;
  onActionPress: (action: string) => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ 
  balance, 
  currencySymbol = '$',
  onActionPress
}) => {
  const formattedBalance = balance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const actions = [
    { label: "SEND", icon: ArrowUp, bgColor: "#5B68F6", actionId: "send" },
    { label: "RECEIVE", icon: ArrowDown, bgColor: "#28C165", actionId: "receive" },
    { label: "BUY", icon: ShoppingCart, bgColor: "#F5A623", actionId: "buy" },
    { label: "TRADE", icon: RotateCw, bgColor: "#A259FF", actionId: "trade" },
  ];

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={['#1A1A1A', '#121212']} // Darker gradient as per new style
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.upperContent}>
          <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
          <Text style={styles.balanceAmount}>
            {currencySymbol}{formattedBalance}
          </Text>
        </View>

        <View style={styles.actionButtonsContainer}>
          {actions.map(action => (
            <ActionButton 
              key={action.label}
              icon={<action.icon color="#FFF" size={20} />}
              label={action.label}
              onPress={() => onActionPress(action.actionId)}
              // Assuming your ActionButton can take a style prop for backgroundColor
              // or has a specific prop like `backgroundColor`
              // For this example, I'll assume it can take a style override or a direct prop.
              // If your ActionButton is simple, you might need to wrap it or modify it
              // to accept a background color. For now, let's pass it as a prop.
              backgroundColor={action.bgColor} 
              // Alternatively, if ActionButton accepts a style prop for its container:
              // containerStyle={{ backgroundColor: action.bgColor }}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.5, // Adjusted for better visibility on Android
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    maxWidth: 400, // Ensure it doesn't get too wide on tablets
    alignSelf: 'center',
    marginBottom: 24, // Added margin for spacing from content below
  },
  gradientBackground: {
    padding: 24,
    width: '100%',
  },
  upperContent: {
    marginBottom: 24, // Reduced from 32 to decrease gap
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 8,
    fontFamily: 'Inter-Medium', // Example: using your existing font family
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'Inter-Bold', // Example: using your existing font family
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default BalanceCard;
