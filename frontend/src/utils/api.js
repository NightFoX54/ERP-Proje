import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://erp-proje-production.up.railway.app';
//const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Debug: API URL'ini console'a yazdır
console.log('[API Config] API_BASE_URL:', API_BASE_URL);
console.log('[API Config] VITE_API_URL env:', import.meta.env.VITE_API_URL);

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 saniye timeout
});

// Request interceptor - JWT token ekleme
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !config.url.includes('/api/auth/login') && !config.url.includes('/api/auth/register')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug için
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Error handling
api.interceptors.response.use(
  (response) => {
    // Debug için
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`, {
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  (error) => {
    console.error('[API Response Error]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    });
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API metodlarını doğrulama (debugging için)
if (typeof api.get !== 'function') {
  console.error('ERROR: api.get is not a function! Axios instance may not be initialized correctly.');
}

export default api;

