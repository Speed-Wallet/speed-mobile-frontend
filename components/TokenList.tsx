import React from 'react';
import { StyleSheet, Text } from 'react-native';
import TokenItem from './TokenItem';
import { EnrichedTokenEntry } from '@/data/types';
import { getAllTokenInfo } from '@/data/tokens';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useTokenAssets } from '@/hooks/useTokenAsset';
import { useWalletPublicKey } from '@/services/walletService';
import colors from '@/constants/colors';
import { moderateScale, scale } from 'react-native-size-matters';

type TokenListProps = {
  onSelectToken: (token: EnrichedTokenEntry) => void;
  showBalance?: boolean;
  priceFontSize?: number;
  showSelectorIcon?: boolean;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
};

const TokenList = ({
  onSelectToken,
  showBalance,
  priceFontSize,
  showSelectorIcon,
  ListHeaderComponent,
}: TokenListProps) => {
  const walletAddress = useWalletPublicKey();
  const { data, isLoading, error } = useTokenAssets(walletAddress);
  const tokenMetadata = getAllTokenInfo();

  // Merge token balances with metadata
  const tokens = (data?.tokenBalances || []).map((tokenBalance) => {
    const metadata = tokenMetadata.find(
      (t) => t.address === tokenBalance.address,
    );
    return {
      tokenBalance,
      metadata: metadata || {
        address: tokenBalance.address,
        name: tokenBalance.name,
        symbol: tokenBalance.symbol,
        decimals: tokenBalance.decimals,
        logoURI: tokenBalance.logoURI,
        priceChangePercentage: 0,
      },
    };
  });

  if (error) {
    return (
      <Text style={styles.errorText}>
        Error loading tokens: {error.message}
      </Text>
    );
  }

  return (
    <Animated.FlatList
      data={tokens}
      keyExtractor={(item) => item.tokenBalance.address}
      ListHeaderComponent={ListHeaderComponent}
      renderItem={({ item, index }) => {
        const enrichedToken: EnrichedTokenEntry = {
          ...item.metadata,
          balance: item.tokenBalance.balance,
          price: item.tokenBalance.pricePerToken,
        } as EnrichedTokenEntry;

        return (
          <Animated.View
            entering={FadeInRight.delay(100 + index * 100).duration(400)}
          >
            <TokenItem
              balance={item.tokenBalance.balance}
              pricePerToken={item.tokenBalance.pricePerToken}
              totalPrice={item.tokenBalance.totalPrice}
              logoURI={item.tokenBalance.logoURI}
              name={item.tokenBalance.name}
              symbol={item.tokenBalance.symbol}
              decimals={item.tokenBalance.decimals}
              isLoading={isLoading}
              priceChangePercentage={item.metadata.priceChangePercentage}
              onPress={() => onSelectToken(enrichedToken)}
              showBalance={showBalance}
              priceFontSize={priceFontSize}
              showSelectorIcon={showSelectorIcon}
            />
          </Animated.View>
        );
      }}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    padding: scale(12),
  },
  errorText: {
    color: colors.error,
    fontSize: moderateScale(14),
    textAlign: 'center',
    marginTop: 20,
  },
});

export default TokenList;
