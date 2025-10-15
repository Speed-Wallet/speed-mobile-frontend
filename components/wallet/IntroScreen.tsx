import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Platform,
} from 'react-native';
import { scale, verticalScale } from 'react-native-size-matters';
import ScreenContainer from '@/components/ScreenContainer';
import IntroHeader from './IntroHeader';

interface IntroScreenProps {
  title: string;
  subtitle: string;
  username?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  showDevSkip?: boolean;
  onDevSkip?: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({
  title,
  subtitle,
  username,
  children,
  footer,
  showDevSkip = false,
  onDevSkip,
}) => {
  return (
    <View style={{ flex: 1 }}>
      {/* Dev Mode Skip Button */}
      {process.env.EXPO_PUBLIC_APP_ENV === 'development' &&
        showDevSkip &&
        onDevSkip && (
          <TouchableOpacity style={styles.skipButton} onPress={onDevSkip}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        )}

      <View style={styles.content}>
        {/* Header - Fixed at top */}
        <View style={styles.headerContainer}>
          <IntroHeader title={title} subtitle={subtitle} username={username} />
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        {/* Footer - Fixed at bottom */}
        {footer && <View style={styles.footerContainer}>{footer}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: scale(20),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
    flexGrow: 1,
    justifyContent: 'center',
  },
  footerContainer: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(20),
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(20),
    right: scale(20),
    zIndex: 1000,
    backgroundColor: '#FFB800',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    borderRadius: scale(8),
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: scale(14),
    fontWeight: '600',
    color: '#121212',
  },
});

export default IntroScreen;
