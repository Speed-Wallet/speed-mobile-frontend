import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { ArrowDown, ArrowUp, ArrowRightLeft } from 'lucide-react-native';
import colors from '@/constants/colors';
import { formatCurrency, formatDate } from '@/utils/formatters';

type TransactionItemProps = {
  transaction: any;
  tokenData: any[];
  showDate?: boolean;
};

const TransactionItem = ({ transaction, tokenData, showDate = false }: TransactionItemProps) => {
  const token = tokenData.find(c => c.id === transaction.tokenId);
  
  if (!token) return null;
  
  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'receive':
        return <ArrowDown size={20} color={colors.success} />;
      case 'send':
        return <ArrowUp size={20} color={colors.error} />;
      case 'trade':
        return <ArrowRightLeft size={20} color={colors.primary} />;
      default:
        return <ArrowUp size={20} color={colors.textSecondary} />;
    }
  };
  
  const getTransactionTitle = () => {
    switch (transaction.type) {
      case 'receive':
        return `Received ${token.symbol}`;
      case 'send':
        return `Sent ${token.symbol}`;
      case 'trade':
        return `Traded ${token.symbol}`;
      case 'withdraw':
        return `Withdrew ${token.symbol}`;
      default:
        return `${token.name} Transaction`;
    }
  };
  
  const getTransactionDescription = () => {
    switch (transaction.type) {
      case 'receive':
        return `From ${transaction.from}`;
      case 'send':
        return `To ${transaction.to}`;
      case 'trade':
        return `${transaction.tradePair}`;
      case 'withdraw':
        return `To ${transaction.method}`;
      default:
        return '';
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {getTransactionIcon()}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{getTransactionTitle()}</Text>
        <Text style={styles.description}>{getTransactionDescription()}</Text>
        {showDate && (
          <Text style={styles.date}>{formatDate(transaction.date)}</Text>
        )}
      </View>
      
      <View style={styles.amountContainer}>
        <Text 
          style={[
            styles.amount,
            transaction.type === 'receive' ? styles.receiveAmount : styles.otherAmount
          ]}
        >
          {transaction.type === 'receive' ? '+' : '-'} {transaction.amount} {token.symbol}
        </Text>
        <Text style={styles.fiatAmount}>
          {formatCurrency(transaction.amount * transaction.price)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.backgroundMedium,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundMedium,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
  date: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  receiveAmount: {
    color: colors.success,
  },
  otherAmount: {
    color: colors.error,
  },
  fiatAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.textSecondary,
  },
});

export default TransactionItem;