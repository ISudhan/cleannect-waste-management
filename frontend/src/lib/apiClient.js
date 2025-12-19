import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const instance = axios.create({
  baseURL,
});

instance.interceptors.request.use((config) => {
  const stored = window.localStorage.getItem('cleannect_auth');
  const token = stored ? JSON.parse(stored)?.token : null;

  if (!config.headers) config.headers = {};

  if (!config.skipAuthHeader && token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default {
  get: (url, config) => instance.get(url, config),
  post: (url, data, config) => instance.post(url, data, config),
  put: (url, data, config) => instance.put(url, data, config),
  delete: (url, config) => instance.delete(url, config),
};


