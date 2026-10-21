import axios from 'axios';

// Create configured Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // Crucial for sending and receiving HTTP-only session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for consistent error messaging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize error message extraction
    const customMessage =
      error.response?.data?.message ||
      (error.response?.data?.errors && error.response.data.errors.map(e => e.message).join(', ')) ||
      error.message ||
      'An unexpected error occurred.';
    
    // Attach clean error message to error object
    error.friendlyMessage = customMessage;
    return Promise.reject(error);
  }
);

export default api;
