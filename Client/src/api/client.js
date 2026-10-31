import axios from 'axios';
import { getIdToken } from '@/auth/cognito';

// Backend ka error format: { success:false, error:{ code, message, details } }
export class ApiError extends Error {
  constructor(message, code, status, details) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 20000,
});

// Har request par Cognito ID token lagao (Amplify expire hone par khud refresh karta hai)
api.interceptors.request.use(async (config) => {
  const token = await getIdToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const e = err.response?.data?.error;
    const apiErr = new ApiError(
      e?.message || err.message,
      e?.code || (err.response ? `HTTP_${status}` : 'NETWORK_ERROR'),
      status,
      e?.details,
    );
    if (status === 401 && onUnauthorized) onUnauthorized();
    return Promise.reject(apiErr);
  },
);
