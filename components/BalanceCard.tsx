import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import ActionButton from '@/components/ActionButton'; 
import { ArrowUp, ArrowDown, ShoppingCart, ArrowRightLeft } from 'lucide-react-native';
import colors from '@/constants/colors'; 
import GradientCard from './GradientCard'; // Import the new GradientCard

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
    { label: "TRADE", icon: ArrowRightLeft, bgColor: "#A259FF", actionId: "trade" },
  ];

  return (
    <GradientCard style={styles.balanceCardSpecificContainer}>
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
            backgroundColor={action.bgColor} 
          />
        ))}
      </View>
    </GradientCard>
  );
};

const styles = StyleSheet.create({
  balanceCardSpecificContainer: { // Style for the GradientCard instance if needed
    marginBottom: 24, 
  },
  upperContent: {
    marginBottom: 24, 
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
