import { Tabs } from 'expo-router';
import { useWindowDimensions, View, TouchableOpacity } from 'react-native';
import { moderateScale } from 'react-native-size-matters';
import {
  House,
  ChartBar as BarChart3,
  ArrowLeftRight,
  CreditCard,
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { TabBarVisibilityProvider } from '@/contexts/TabBarVisibilityContext';
import { Easing } from 'react-native-reanimated';

const TABLET_BREAKPOINT = 600;

function TabsContent() {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.backgroundDark,
          borderTopWidth: 0,
          // paddingVertical: 4,
        },
        tabBarActiveTintColor: '#00CFFF',
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarLabelStyle: {
          fontWeight: '500',
          fontSize: moderateScale(10),
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarLabelPosition: isTablet ? 'beside-icon' : 'below-icon', // Conditional layout
        animation: 'shift',
        transitionSpec: {
          animation: 'timing',
          config: {
            duration: 300,
            easing: Easing.out(Easing.cubic),
          },
        },
        sceneStyle: {
          backgroundColor: colors.backgroundDark,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <House size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'Market',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          title: 'Trade',
          tabBarIcon: ({ color, size }) => (
            <ArrowLeftRight size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="spend"
        options={{
          title: 'Spend',
          tabBarIcon: ({ color, size }) => (
            <CreditCard size={size} color={color} />
          ),
        }}
      />
      {/* Hide rewards and settings from tabs */}
      <Tabs.Screen
        name="rewards"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <TabBarVisibilityProvider>
      <TabsContent />
    </TabBarVisibilityProvider>
  );
}
