import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { storage } from '@/utils/mmkvStorage';
import ActionButton from '@/components/buttons/ActionButton';
import {
  ArrowUp,
  ArrowDown,
  CreditCard,
  ArrowRightLeft,
  ShoppingCart,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import GradientCard from './GradientCard';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';

interface BalanceCardProps {
  currencySymbol?: string;
  onActionPress: (action: string) => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({
  currencySymbol = '$',
  onActionPress,
}) => {
  const { portfolioValue } = usePortfolioValue();

  // Initialize state from MMKV storage, defaulting to true if not set
  const [isBalanceVisible, setIsBalanceVisible] = useState(() => {
    return storage.getBoolean('balanceVisible') ?? true;
  });

  const formattedBalance = portfolioValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const toggleBalanceVisibility = () => {
    const newVisibility = !isBalanceVisible;
    setIsBalanceVisible(newVisibility);
    // Persist the new state to MMKV
    storage.set('balanceVisible', newVisibility);
  };

  const actions = [
    { label: 'SEND', icon: ArrowUp, bgColor: '#5B68F6', actionId: 'send' },
    {
      label: 'RECEIVE',
      icon: ArrowDown,
      bgColor: '#28C165',
      actionId: 'receive',
    },
    { label: 'CARDS', icon: CreditCard, bgColor: '#F5A623', actionId: 'cards' },
    {
      label: 'TRADE',
      icon: ArrowRightLeft,
      bgColor: '#A259FF',
      actionId: 'trade',
    },
    { label: 'BUY', icon: ShoppingCart, bgColor: '#FF6B35', actionId: 'buy' },
  ];

  return (
    <GradientCard
      style={styles.balanceCardSpecificContainer}
      contentPaddingVertical={32}
    >
      <View style={styles.upperContent}>
        {/* <Text style={styles.balanceLabel}>TOTAL BALANCE</Text> */}
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceAmount}>
            {isBalanceVisible
              ? `${currencySymbol}${formattedBalance}`
              : '••••••'}
          </Text>
          <TouchableOpacity
            style={styles.visibilityButton}
            onPress={toggleBalanceVisibility}
          >
            {isBalanceVisible ? (
              <Eye size={scale(18)} color="#FFFFFF" opacity={0.7} />
            ) : (
              <EyeOff size={scale(18)} color="#FFFFFF" opacity={0.7} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionButtonsContainer}>
        {actions.map((action) => (
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
  balanceCardSpecificContainer: {
    // This style is specific to the balance card and overlays on GradientCard
  },
  upperContent: {
    marginBottom: verticalScale(18),
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(10),
  },
  balanceLabel: {
    fontSize: moderateScale(12),
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: verticalScale(6),
    fontFamily: 'Inter-Medium', // Example: using your existing font family
  },
  balanceAmount: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'Inter-Bold', // Example: using your existing font family
  },
  visibilityButton: {
    padding: scale(3),
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: scale(3),
  },
});

export default BalanceCard;
