import { store } from '@/app/store';
import { type RootState } from '@/app/store';

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const state: RootState = store.getState();
  const token = state.auth.token;

  const headers = new Headers(options.headers);
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response.json();
};
