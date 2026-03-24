import { create } from 'zustand';
import { Platform } from 'react-native';

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage?.setItem(key, value);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(key, value);
}

interface SettingsState {
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
  loadSettings: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  biometricEnabled: false,
  notificationsEnabled: true,

  loadSettings: async () => {
    const biometric = await getItem('biometric_enabled');
    const notifs = await getItem('notifications_enabled');
    set({
      biometricEnabled: biometric === 'true',
      notificationsEnabled: notifs !== 'false',
    });
  },

  setBiometricEnabled: async (enabled: boolean) => {
    await setItem('biometric_enabled', String(enabled));
    set({ biometricEnabled: enabled });
  },

  setNotificationsEnabled: async (enabled: boolean) => {
    await setItem('notifications_enabled', String(enabled));
    set({ notificationsEnabled: enabled });
  },
}));
