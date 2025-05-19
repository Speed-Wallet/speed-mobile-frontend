import { Tabs } from 'expo-router';
import { View, useWindowDimensions } from 'react-native'; // Import useWindowDimensions instead of Dimensions
import { House, ChartPie as PieChart, ChartBar as BarChart3, Settings, Gift } from 'lucide-react-native';
import colors from '@/constants/colors';

const TABLET_BREAKPOINT = 600; // Define a breakpoint for tablet screens

export default function TabLayout() {
  const { width } = useWindowDimensions(); // Use the hook to get dynamic width
  const isTablet = width >= TABLET_BREAKPOINT;

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.backgroundDark,
          borderTopWidth: 0,
          elevation: 0,
          height: 70, // Increased height for more space
          paddingTop: 8, // Added for consistent vertical padding
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarLabelStyle: {
          fontWeight: '500',
          fontSize: 12,
          marginBottom: 4, // Added margin to lift text away from bottom edge
        },
        tabBarIconStyle: {
          ...(isTablet ? {} : { marginBottom: 4 }), // Increased from 2 to 4 for a larger gap
        },
        tabBarLabelPosition: isTablet ? 'beside-icon' : 'below-icon', // Conditional layout
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <House size={size} color={color} />
          ),
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
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color, size }) => (
            <PieChart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, size }) => (
            <Gift size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}