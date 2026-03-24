import { useState, useEffect, useCallback } from 'react';
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

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage?.removeItem(key);
    return;
  }
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync(key);
}

export function useBiometric() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');

  useEffect(() => {
    checkAvailability();
    checkEnabled();
  }, []);

  const checkAvailability = async () => {
    if (Platform.OS === 'web') {
      setIsAvailable(false);
      return;
    }
    try {
      const LocalAuthentication = await import('expo-local-authentication');
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsAvailable(compatible && enrolled);

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Fingerprint');
      }
    } catch {
      setIsAvailable(false);
    }
  };

  const checkEnabled = async () => {
    try {
      const enabled = await getItem('biometric_enabled');
      setIsEnabled(enabled === 'true');
    } catch {
      setIsEnabled(false);
    }
  };

  const enableBiometric = async () => {
    await setItem('biometric_enabled', 'true');
    setIsEnabled(true);
  };

  const disableBiometric = async () => {
    await removeItem('biometric_enabled');
    setIsEnabled(false);
  };

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !isAvailable || !isEnabled) return false;

    try {
      const LocalAuthentication = await import('expo-local-authentication');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to RxSure',
        cancelLabel: 'Use Password',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    }
  }, [isAvailable, isEnabled]);

  return {
    isAvailable,
    isEnabled,
    biometricType,
    enableBiometric,
    disableBiometric,
    authenticate,
  };
}
