import axios from 'axios';
import Constants from 'expo-constants';

const apiUrl = (Constants.expoConfig?.extra?.apiUrl as string) ?? 'http://localhost:3001';

export const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000,
});

let _getAccessToken: (() => string | null) | null = null;
let _refreshToken: (() => Promise<boolean>) | null = null;
let _logout: (() => void) | null = null;

export function setupApiInterceptors(
  getAccessToken: () => string | null,
  refreshToken: () => Promise<boolean>,
  logout: () => void,
) {
  _getAccessToken = getAccessToken;
  _refreshToken = refreshToken;
  _logout = logout;
}

api.interceptors.request.use((config) => {
  if (_getAccessToken) {
    const token = _getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      if (_refreshToken) {
        const success = await _refreshToken();
        if (success) {
          if (_getAccessToken) {
            originalRequest.headers.Authorization = `Bearer ${_getAccessToken()}`;
          }
          return api(originalRequest);
        }
      }
      if (_logout) _logout();
    }
    return Promise.reject(error);
  },
);
