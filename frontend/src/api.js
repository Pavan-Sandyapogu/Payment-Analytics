import axios from 'axios';

// Use relative /api — works in production (Express serves frontend on same domain)
// and locally via Vite's proxy configuration
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Configure Interceptors to automatically fetch token from local storage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Append JWT Token implicitly
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
