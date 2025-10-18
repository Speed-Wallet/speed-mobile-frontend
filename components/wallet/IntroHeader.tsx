import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { scale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';

interface IntroHeaderProps {
  title: string;
  subtitle: string;
  username?: string;
  rightComponent?: React.ReactNode;
}

const IntroHeader: React.FC<IntroHeaderProps> = ({
  title,
  subtitle,
  username,
  rightComponent,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>
            {title}
            {username && <Text style={styles.username}> {username}</Text>}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {rightComponent && (
          <View style={styles.rightComponentContainer}>{rightComponent}</View>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    flex: 0,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  rightComponentContainer: {
    marginLeft: scale(16),
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'left',
  },
  username: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: moderateScale(16),
    color: '#9ca3af',
    textAlign: 'left',
    lineHeight: moderateScale(22),
  },
});

export default IntroHeader;
