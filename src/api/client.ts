import axios, { type AxiosInstance } from 'axios';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://devai.neoron.co.uk';

// Platform-safe storage: SecureStore on native, localStorage on web
async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return typeof localStorage !== 'undefined' ? localStorage.getItem('patient_token') : null;
  }
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync('patient_token');
}

class FrappeClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.client.interceptors.request.use(async (config) => {
      try {
        const token = await getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {}
      return config;
    });
  }

  async getList(doctype: string, fields: string[] = ['*'], filters: any = {}) {
    const response = await this.client.get(`/api/resource/${doctype}`, {
      params: {
        fields: JSON.stringify(fields),
        filters: JSON.stringify(filters),
      },
    });
    return response.data.data;
  }

  async getDoc(doctype: string, name: string) {
    const response = await this.client.get(`/api/resource/${doctype}/${name}`);
    return response.data.data;
  }

  async createDoc(doctype: string, doc: any) {
    const response = await this.client.post(`/api/resource/${doctype}`, doc);
    return response.data.data;
  }

  async updateDoc(doctype: string, name: string, doc: any) {
    const response = await this.client.put(`/api/resource/${doctype}/${name}`, doc);
    return response.data.data;
  }

  async call(method: string, args?: any) {
    const response = await this.client.post(`/api/method/${method}`, args);
    return response.data.message;
  }

  async callWithFullResponse(method: string, args?: any) {
    const response = await this.client.post(`/api/method/${method}`, args);
    return response.data;
  }

  async callWithTimeout(method: string, args?: any, timeoutMs: number = 300000) {
    const response = await this.client.post(`/api/method/${method}`, args, {
      timeout: timeoutMs,
    });
    return response.data.message;
  }

  getBaseUrl(): string {
    return API_BASE_URL;
  }
}

export const frappeClient = new FrappeClient();
export { API_BASE_URL };
