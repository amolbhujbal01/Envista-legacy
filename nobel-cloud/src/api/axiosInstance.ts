import axios from 'axios';
import { type RootState, store } from '@/app/store';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
});

instance.interceptors.request.use(
  (config) => {
    const state: RootState = store.getState();
    const authKey = state.auth.accessToken;
    if (authKey) {
      config.headers.Authorization = `Bearer ${authKey}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
