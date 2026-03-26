import axios from 'axios';

// In dev, VITE_API_URL=http://localhost:5000/api (set in frontend/.env)
// In production, Express serves the frontend so relative /api works perfectly
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
