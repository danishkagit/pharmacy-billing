import axios from 'axios';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
export const UPLOAD_BASE = API_BASE.replace(/\/api\/?$/, '');
export const fileUrl = (path) => path ? `${UPLOAD_BASE}${path.startsWith('/') ? path : `/${path}`}` : null;

const API = axios.create({
  baseURL: API_BASE,
  headers: { 'Accept': 'application/json' }
});

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || { success: false, error: 'Network error' });
  }
);

export default API;
