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

export interface StoredCredentials {
  email: string;
  password: string;
  organization: string;
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

  // Store credentials (called after successful login)
  const storeCredentials = async (credentials: StoredCredentials) => {
    await setItem('biometric_email', credentials.email);
    await setItem('biometric_password', credentials.password);
    await setItem('biometric_organization', credentials.organization);
  };

  // Enable biometric — verify fingerprint first, then set flag
  const enableBiometric = async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !isAvailable) return false;

    // Check if credentials are stored (user must have logged in first)
    const email = await getItem('biometric_email');
    if (!email) return false;

    try {
      const LocalAuthentication = await import('expo-local-authentication');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricType} Login`,
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        await setItem('biometric_enabled', 'true');
        setIsEnabled(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const disableBiometric = async () => {
    await removeItem('biometric_enabled');
    setIsEnabled(false);
    // Keep credentials stored — user can re-enable later
  };

  // Clear all stored data (called on logout)
  const clearBiometric = async () => {
    await removeItem('biometric_enabled');
    await removeItem('biometric_email');
    await removeItem('biometric_password');
    await removeItem('biometric_organization');
    setIsEnabled(false);
  };

  // Check if stored credentials exist (for app startup redirect)
  const hasStoredCredentials = async (): Promise<boolean> => {
    const enabled = await getItem('biometric_enabled');
    const email = await getItem('biometric_email');
    return enabled === 'true' && !!email;
  };

  // Get stored organization (to skip pharmacy selection)
  const getStoredOrganization = async (): Promise<string | null> => {
    const enabled = await getItem('biometric_enabled');
    if (enabled !== 'true') return null;
    return getItem('biometric_organization');
  };

  // Authenticate with fingerprint and return stored credentials
  const authenticate = useCallback(async (): Promise<StoredCredentials | null> => {
    if (Platform.OS === 'web' || !isAvailable || !isEnabled) return null;

    try {
      const LocalAuthentication = await import('expo-local-authentication');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to RxSure',
        cancelLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        const email = await getItem('biometric_email');
        const password = await getItem('biometric_password');
        const organization = await getItem('biometric_organization');
        if (email && password && organization) {
          return { email, password, organization };
        }
      }
      return null;
    } catch {
      return null;
    }
  }, [isAvailable, isEnabled]);

  return {
    isAvailable,
    isEnabled,
    biometricType,
    storeCredentials,
    enableBiometric,
    disableBiometric,
    clearBiometric,
    authenticate,
    hasStoredCredentials,
    getStoredOrganization,
  };
}
