import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
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
    borderRadius: scale(6),
    padding: scale(3),
    marginBottom: verticalScale(12),
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(4),
  },
  leftTab: {
    marginRight: scale(1),
  },
  rightTab: {
    marginLeft: scale(1),
  },
  activeTab: {
    backgroundColor: '#00CFFF',
  },
  tabText: {
    fontSize: moderateScale(12),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.backgroundDark,
  },
});

export default TabSelector;
