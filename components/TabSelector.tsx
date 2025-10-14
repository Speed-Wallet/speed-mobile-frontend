import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import colors from '@/constants/colors';

type TabSelectorProps = {
  activeTab: 'tokens' | 'activity';
  onTabPress: (tab: 'tokens' | 'activity') => void;
  onActivityPress?: () => void;
};

const TabSelector = ({
  activeTab,
  onTabPress,
  onActivityPress,
}: TabSelectorProps) => {
  const handleTabPress = (tab: 'tokens' | 'activity') => {
    if (tab === 'activity') {
      // Call the callback if provided, otherwise call onTabPress
      if (onActivityPress) {
        onActivityPress();
        return;
      }
    }
    onTabPress(tab);
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundMedium,
    borderRadius: scale(6),
    padding: scale(3),
    marginVertical: 8,
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
    fontSize: moderateScale(13),
    fontFamily: 'Inter-Medium',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.backgroundDark,
  },
});

export default TabSelector;
