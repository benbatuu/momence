import axios, { InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// İstek Öncesi Interceptor (Token & Tenant Header Ekleme)
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Subdomain Algılama (Örn: om-pilates.domain.com veya localhost dev ortamı)
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    // Eğer localhost veya ana domain değilse subdomain'i ekle
    if (parts.length > 2 && parts[0] !== 'www') {
      config.headers['x-studio-subdomain'] = parts[0];
    } else {
      // Hem camelCase hem snake_case kontrolü ekleyelim
      const storedSubdomain =
        localStorage.getItem('studioSubdomain') ||
        localStorage.getItem('studio_subdomain') ||
        'om-pilates';

      if (storedSubdomain && config.headers) {
        config.headers['x-studio-subdomain'] = storedSubdomain;
      }
    }
  }
  return config;
});

// Yanıt Interceptor (401 Yenileme Mantığı)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Giriş yapma (login) veya token yenileme (refresh-token) istekleri 401 aldığında doğrudan hatayı döndür, yönlendirme döngüsüne girme!
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('Refresh token bulunamadı');

        const res = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = res.data.data;

        localStorage.setItem('accessToken', newAccessToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

        document.cookie = `accessToken=${newAccessToken}; path=/; max-age=604800; SameSite=Lax`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshErr) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);