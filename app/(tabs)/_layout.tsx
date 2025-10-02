import { Tabs } from 'expo-router';
import { useWindowDimensions } from 'react-native'; // Import useWindowDimensions instead of Dimensions
import { verticalScale, moderateScale } from 'react-native-size-matters';
import {
  House,
  ChartPie as PieChart,
  ChartBar as BarChart3,
  Settings,
  Gift,
} from 'lucide-react-native';
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
          // elevation: 0,
          // height: verticalScale(28) + insets.bottom, // Add bottom safe area
          // paddingBottom: verticalScale(52),
          // paddingBottom: insets.bottom, // Add bottom safe area padding
          marginTop: 6,
        },
        tabBarActiveTintColor: '#4682B4', // Steel Blue
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarLabelStyle: {
          fontWeight: '500',
          fontSize: moderateScale(10),
          // marginBottom: verticalScale(30), // Responsive margin
        },
        tabBarIconStyle: {
          ...(isTablet ? {} : { marginBottom: verticalScale(3) }), // Responsive gap
        },
        tabBarLabelPosition: isTablet ? 'beside-icon' : 'below-icon', // Conditional layout
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
      {/* <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color, size }) => (
            <PieChart size={size} color={color} />
          ),
        }}
      /> */}
      <Tabs.Screen
        name="rewards"
        options={{
          title: 'Rewards',
          tabBarIcon: ({ color, size }) => <Gift size={size} color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
          },
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
