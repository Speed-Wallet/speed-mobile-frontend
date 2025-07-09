import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import colors from '@/constants/colors';
import { triggerShake } from '@/utils/animations';

type TabSelectorProps = {
  activeTab: 'tokens' | 'activity';
  onTabPress: (tab: 'tokens' | 'activity') => void;
};

const TabSelector = ({ activeTab, onTabPress }: TabSelectorProps) => {
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const handleTabPress = (tab: 'tokens' | 'activity') => {
    if (tab === 'activity') {
      // Trigger shake animation for disabled activity tab
      triggerShake(shakeAnimation);
      return;
    }
    onTabPress(tab);
  };

  const animatedStyle = {
    transform: [
      {
        translateX: shakeAnimation,
      },
    ],
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.tab,
          styles.leftTab,
          activeTab === 'tokens' && styles.activeTab,
        ]}
        onPress={() => handleTabPress('tokens')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'tokens' && styles.activeTabText,
          ]}
        >
          Tokens
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          styles.rightTab,
          activeTab === 'activity' && styles.activeTab,
        ]}
        onPress={() => handleTabPress('activity')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'activity' && styles.activeTabText,
          ]}
        >
          Activity
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundMedium,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  leftTab: {
    marginRight: 2,
  },
  rightTab: {
    marginLeft: 2,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.textPrimary,
  },
});

export default TabSelector;
