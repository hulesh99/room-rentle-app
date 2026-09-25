import api from './api';

export const axiosBaseQuery =
  ({ baseUrl = '' } = {}) =>
  async ({ url, method = 'GET', body, params }, { signal } = {}) => {
    try {
      const config = {
        url: baseUrl + url,
        method,
        data: body,
        params,
        signal,
      };
      if (body instanceof FormData) {
        config.headers = { 'Content-Type': 'multipart/form-data' };
      }
      const result = await api(config);
      return { data: result.data };
    } catch (err) {
      return {
        error: {
          status: err.response?.status ?? 'NETWORK_ERROR',
          data: err.response?.data ?? { message: err.message },
        },
      };
    }
  };
