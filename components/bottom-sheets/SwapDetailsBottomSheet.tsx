import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
} from '@gorhom/bottom-sheet';
import { scale, verticalScale } from 'react-native-size-matters';
import colors from '@/constants/colors';
import { TokenMetadata } from '@/services/tokenAssetService';
import { PreparedJupiterSwap } from '@/services/walletService';
import SwapDetailsContent from './swap-details/SwapDetailsContent';
import SwapSuccessContent from './swap-details/SwapSuccessContent';
import SwapErrorContent from './swap-details/SwapErrorContent';
import BottomSheetScreenContainer from '@/components/bottom-sheets/BottomSheetScreenContainer';

export interface SwapDetailsBottomSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface SwapDetailsBottomSheetProps {
  // Token info
  fromToken: TokenMetadata | null;
  toToken: TokenMetadata | null;
  fromAmount: string;
  toAmount: string;

  // Quote data
  quote: any;
  exchangeRate: number | null;
  totalValueDisplay: string;
  fromTokenPrice: number;

  // Swap states
  preparedSwap: PreparedJupiterSwap | null;
  isPreparingSwap: boolean;
  isSwapping: boolean;
  swapComplete: boolean;
  swapSuccess: boolean;
  swapTxSignature: string;
  swapErrorMessage: string;

  // Callbacks
  onConfirmSwap: () => void;
  onClose: () => void;
  onDismiss: () => void;
}

const SwapDetailsBottomSheet = forwardRef<
  SwapDetailsBottomSheetRef,
  SwapDetailsBottomSheetProps
>(
  (
    {
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      quote,
      exchangeRate,
      totalValueDisplay,
      fromTokenPrice,
      preparedSwap,
      isPreparingSwap,
      isSwapping,
      swapComplete,
      swapSuccess,
      swapTxSignature,
      swapErrorMessage,
      onConfirmSwap,
      onClose,
      onDismiss,
    },
    ref,
  ) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={['75%']}
        enablePanDownToClose={true}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetHandle}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
            opacity={0.4}
          />
        )}
        onDismiss={onDismiss}
      >
        <BottomSheetView style={{ paddingHorizontal: scale(20) }}>
          <BottomSheetScreenContainer>
            {/* Swap Details (Preparing/Confirming) */}
            {!swapComplete && fromToken && toToken && (
              <SwapDetailsContent
                fromToken={fromToken}
                toToken={toToken}
                quote={quote}
                exchangeRate={exchangeRate}
                totalValueDisplay={totalValueDisplay}
                preparedSwap={preparedSwap}
                isPreparingSwap={isPreparingSwap}
                isSwapping={isSwapping}
                onConfirmSwap={onConfirmSwap}
              />
            )}

            {/* Success State */}
            {swapComplete && swapSuccess && fromToken && toToken && (
              <SwapSuccessContent
                fromToken={fromToken}
                toToken={toToken}
                fromAmount={fromAmount}
                toAmount={toAmount}
                fromTokenPrice={fromTokenPrice}
                swapTxSignature={swapTxSignature}
                onClose={onClose}
              />
            )}

            {/* Error State */}
            {swapComplete && !swapSuccess && (
              <SwapErrorContent
                onClose={onClose}
                errorMessage={swapErrorMessage}
              />
            )}
          </BottomSheetScreenContainer>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

SwapDetailsBottomSheet.displayName = 'SwapDetailsBottomSheet';

export default SwapDetailsBottomSheet;

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: colors.bottomSheetBackground,
  },
  bottomSheetHandle: {
    backgroundColor: colors.textSecondary,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: scale(20),
    paddingTop: verticalScale(20),
    // paddingBottom: 20,
  },
});
