import { Redirect, Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS } from '../../src/utils/constants';

export default function TabLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Don't redirect while still checking auth
  if (isLoading) return null;

  // If not authenticated, redirect to login flow
  if (!isAuthenticated) {
    return <Redirect href="/select-pharmacy" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.slate400,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.slate200,
          paddingTop: 8,
          paddingBottom: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: COLORS.white,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size }) => <Feather name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
