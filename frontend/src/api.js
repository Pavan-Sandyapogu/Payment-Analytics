import axios from 'axios';

// Automatically construct endpoints relative to the Express backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Assumes server spins up mostly on default ports
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
