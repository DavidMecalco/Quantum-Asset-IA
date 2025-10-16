import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LoginCredentials, AuthResponse, AuthError, AuthErrorType } from '../types/auth';
import { authServiceMock } from './authService.mock';

// Configuración base de la API
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';

// Crear instancia de Axios con configuración base
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests - agregar token de autorización
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses - manejo de errores y refresh token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si el token expiró (401) y no hemos intentado renovarlo
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          // Reintentar la request original con el nuevo token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Si el refresh falla, limpiar tokens y redirigir al login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Función para mapear errores de la API a nuestro formato
const mapApiError = (error: any): AuthError => {
  if (error.response) {
    // Error de respuesta del servidor
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return {
          code: AuthErrorType.VALIDATION_ERROR,
          message: data.message || 'Datos inválidos',
          field: data.field,
        };
      case 401:
        return {
          code: AuthErrorType.INVALID_CREDENTIALS,
          message: 'Email o contraseña incorrectos',
        };
      case 429:
        return {
          code: AuthErrorType.RATE_LIMIT,
          message: 'Demasiados intentos. Intenta en unos minutos',
        };
      case 500:
        return {
          code: AuthErrorType.SERVER_ERROR,
          message: 'Error del servidor. Intenta nuevamente',
        };
      default:
        return {
          code: AuthErrorType.SERVER_ERROR,
          message: data.message || 'Error desconocido',
        };
    }
  } else if (error.request) {
    // Error de red
    return {
      code: AuthErrorType.NETWORK_ERROR,
      message: 'Error de conexión. Verifica tu internet',
    };
  } else {
    // Error de configuración
    return {
      code: AuthErrorType.SERVER_ERROR,
      message: 'Error inesperado. Intenta nuevamente',
    };
  }
};



// Determinar si usar mock o servicio real
const isDevelopment = (import.meta as any).env?.DEV;
const useMockAuth = isDevelopment && !(import.meta as any).env?.VITE_API_URL;

// Exportar el servicio apropiado
export const authService = useMockAuth ? authServiceMock : {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      
      // Almacenar tokens en localStorage
      const { accessToken, refreshToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      return response.data;
    } catch (error) {
      throw mapApiError(error);
    }
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
        refreshToken,
      });

      const { accessToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      
      return accessToken;
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      throw mapApiError(error);
    }
  },

  async forgotPassword(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch (error) {
      throw mapApiError(error);
    }
  },

  hasValidToken(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};

// Exportar la instancia de Axios configurada para uso en otros servicios
export { apiClient };