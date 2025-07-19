import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import axios from 'axios';

// Set base URL for API calls
// In development: uses Vite proxy (localhost:8000)
// In production: uses environment variable or defaults to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:8000');
if (API_BASE_URL) {
  axios.defaults.baseURL = API_BASE_URL;
}

// Global axios interceptor for 401 Unauthorized
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      alert('Your session has expired. Please log in again.');
      window.location.href = '/';
      return Promise.reject();
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
