import axios from './httpRequest';
import type { LoginFormValues } from '@/schema/auth';

export const login = (data: LoginFormValues) => {
  const url = `/users/login`;
  return axios({ method: 'POST', url, data });
};
