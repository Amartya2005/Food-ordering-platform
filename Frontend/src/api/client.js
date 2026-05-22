import axios from 'axios';

export const TOKEN_KEY = 'del_app_jwt';
export const USER_KEY = 'del_app_user';
const defaultOrigin =
  typeof window !== 'undefined' ? window.location.origin.replace(/\/$/, '') : 'http://127.0.0.1:5000';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || `${defaultOrigin}/api`).replace(/\/$/, '');
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || defaultOrigin).replace(/\/$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const details = error.response?.data?.errors;
    const detailMessage = Array.isArray(details)
      ? details
          .map((entry) => entry?.message)
          .filter(Boolean)
          .join(' ')
      : '';
    const message =
      detailMessage ||
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';

    if (status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject({
      ...error,
      status,
      details,
      message
    });
  }
);

export function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

export function toFormData(values) {
  const formData = new FormData();

  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, item));
      return;
    }

    formData.append(key, value);
  });

  return formData;
}

export default api;
