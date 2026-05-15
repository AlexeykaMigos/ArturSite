import axios from 'axios';

// Access token kept in memory (not localStorage) to protect against XSS.
// The refresh token lives in an httpOnly cookie managed by the server.
let _accessToken: string | null = null;

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          'http://localhost:8000/api/auth/refresh',
          {},
          { withCredentials: true }
        );
        const { access_token } = response.data;

        setAccessToken(access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        return api(originalRequest);
      } catch {
        setAccessToken(null);
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
