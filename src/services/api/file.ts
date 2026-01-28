import axios from './httpRequest';

export const uploadFile = (data: FormData) => {
  const url = `/files/upload`;
  return axios({ method: 'POST', url, data, headers: { 'Content-Type': 'multipart/form-data' } });
};
