import { create } from 'zustand';
import { Platform } from 'react-native';
import { loginPatient, checkAuth, logoutPatient, registerPatient } from '../api/services';
import type { Patient, RegisterData } from '../types';

// Platform-safe storage helpers
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    }
    const SecureStore = await import('expo-secure-store');
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage?.setItem(key, value);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage?.removeItem(key);
      return;
    }
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
  },
};

interface AuthState {
  patient: Patient | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  organization: string;

  // Actions
  login: (email: string, password: string) => Promise<any>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
  setToken: (token: string) => Promise<void>;
  setPatient: (patient: Patient) => void;
  setOrganization: (org: string) => void;
  clearError: () => void;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  patient: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  organization: '',

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await loginPatient(email, password, get().organization);

      if (result?.requires_2fa) {
        set({ isLoading: false });
        return { requires_2fa: true, email };
      }

      if (result?.token) {
        await storage.set('patient_token', result.token);
        await storage.set('patient_org', get().organization);
        set({
          token: result.token,
          patient: result.patient,
          isAuthenticated: true,
          isLoading: false,
        });
      }
      return result;
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data?._server_messages || 'Login failed';
      let errorMessage = msg;
      if (typeof msg === 'string' && msg.startsWith('[')) {
        try {
          const parsed = JSON.parse(msg);
          errorMessage = typeof parsed[0] === 'string' ? JSON.parse(parsed[0]).message : parsed[0]?.message || msg;
        } catch {
          errorMessage = msg;
        }
      }
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await registerPatient({ ...data, organization: get().organization });
      if (result?.token) {
        await storage.set('patient_token', result.token);
        await storage.set('patient_org', get().organization);
        set({
          token: result.token,
          patient: result.patient,
          isAuthenticated: true,
          isLoading: false,
        });
      }
      return result;
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Registration failed';
      set({ isLoading: false, error: msg });
      throw error;
    }
  },

  logout: async () => {
    const { token } = get();
    try {
      if (token) await logoutPatient(token);
    } catch {}
    await storage.remove('patient_token');
    await storage.remove('biometric_enabled');
    set({
      patient: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  checkAuthStatus: async () => {
    const { token } = get();
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return false;
    }
    try {
      const result = await checkAuth(token);
      if (result?.patient) {
        set({ patient: result.patient, isAuthenticated: true, isLoading: false });
        return true;
      }
      set({ isAuthenticated: false, isLoading: false });
      return false;
    } catch {
      await storage.remove('patient_token');
      set({ token: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  },

  setToken: async (token: string) => {
    await storage.set('patient_token', token);
    set({ token, isAuthenticated: true });
  },

  setPatient: (patient: Patient) => set({ patient }),

  setOrganization: (org: string) => set({ organization: org }),

  clearError: () => set({ error: null }),

  loadStoredAuth: async () => {
    try {
      const token = await storage.get('patient_token');
      const org = await storage.get('patient_org');
      if (token) {
        set({ token, organization: org || '' });
        await get().checkAuthStatus();
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
