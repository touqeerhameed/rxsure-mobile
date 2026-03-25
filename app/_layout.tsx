import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { queryClient } from '../src/lib/queryClient';
import { useAuthStore } from '../src/store/authStore';
import { COLORS } from '../src/utils/constants';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadStoredAuth = useAuthStore((s) => s.loadStoredAuth);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    loadStoredAuth().finally(() => {
      SplashScreen.hideAsync();
    });
  }, []);

  if (isLoading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: COLORS.primary },
            headerTintColor: COLORS.white,
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: COLORS.slate50 },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="select-pharmacy" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ title: 'Create Account', headerBackTitle: 'Back' }} />
          <Stack.Screen name="verify-otp" options={{ title: 'Verify OTP', headerBackTitle: 'Back' }} />
          <Stack.Screen name="reset-password" options={{ title: 'Reset Password', headerBackTitle: 'Back' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="service/[id]" options={{ title: 'Service Details' }} />
          <Stack.Screen name="booking/select-time" options={({ route }: any) => ({
            title: route?.params?.rescheduleId ? 'Reschedule Booking' : 'Select Date & Time'
          })} />
          <Stack.Screen name="booking/[id]" options={{ title: 'Booking Details' }} />
          <Stack.Screen name="questionnaire/[bookingId]" options={{ title: 'Pre-Screening' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
