import axios from 'axios';

const getBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env['NEXT_PUBLIC_BASE_URL'] || process.env['VITE_BASE_URL'];
  }
  try {
    return import.meta.env.VITE_BASE_URL || import.meta.env.BASE_URL;
  } catch (e) {
    return '/';
  }
};

const BASE_URL = getBaseUrl();

export const privateApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const publicApi = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});
