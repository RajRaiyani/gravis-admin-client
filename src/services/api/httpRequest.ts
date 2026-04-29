import axios from 'axios';
import Env from '@/config/env';
import { toast } from 'react-hot-toast';
import { clearStoredAuth, getStoredToken } from '@/utils/authStorage';

const axiosInstance = axios.create({
  baseURL: Env.apiEndpoint,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response.data,

  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    if (import.meta.env.DEV) {
      console.warn('[http]', status ?? 'network', data?.message ?? error.message);
    }

    if (status === 401) {
      clearStoredAuth();
      location.href = '/login';
    }
    if (status === 403) {
      toast.error('You are not allowed to access this resource');
      return Promise.reject({
        code: "forbidden",
        message: 'You are not authorized to access this resource'
      });
    }
    if (status === 500) {
      toast.error('Internal server error');
    }

    return Promise.reject(data ?? error);
  },
);

export default axiosInstance;
