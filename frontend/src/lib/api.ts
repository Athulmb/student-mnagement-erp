import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname || 'localhost';
    if (hostname !== 'localhost' && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes('localhost'))) {
      return `http://${hostname}:3001`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // Send and receive HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach access token if stored in memory/localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      config.baseURL = getApiBaseUrl();
      const token = localStorage.getItem('bmn_access_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 by attempting token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Unpack standardized { success: true, data: ... } wrapper
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh on auth login, register or refresh endpoints
    if (
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'An error occurred';
      const customCode = error.response?.data?.code || error.response?.data?.message?.code;
      return Promise.reject({
        message,
        code: customCode,
        status: error.response?.status,
        original: error,
      });
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem('bmn_refresh_token')
            : null;

        const refreshRes = await axios.post(
          `${getApiBaseUrl()}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true },
        );

        const newAccessToken =
          refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
        const newRefreshToken =
          refreshRes.data?.data?.refreshToken || refreshRes.data?.refreshToken;

        if (typeof window !== 'undefined' && newAccessToken) {
          localStorage.setItem('bmn_access_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('bmn_refresh_token', newRefreshToken);
          }
        }

        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('bmn_access_token');
          localStorage.removeItem('bmn_refresh_token');
          localStorage.removeItem('bmn_user');
          if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    const customCode = error.response?.data?.code;

    return Promise.reject({
      message,
      code: customCode,
      status: error.response?.status,
      original: error,
    });
  },
);

export default api;
