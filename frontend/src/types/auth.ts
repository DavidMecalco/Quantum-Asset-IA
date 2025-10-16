// Enums para roles de usuario y tipos de error
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer'
}

export enum AuthErrorType {
  INVALID_CREDENTIALS = 'invalid_credentials',
  NETWORK_ERROR = 'network_error',
  VALIDATION_ERROR = 'validation_error',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error'
}

// Interfaces para preferencias de usuario
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
}

// Interface principal del usuario
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  lastLogin: Date;
  preferences: UserPreferences;
}

// Interfaces para autenticación
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

// Interfaces para validación
export interface ValidationRules {
  email: {
    required: true;
    pattern: RegExp;
    message: string;
  };
  password: {
    required: true;
    minLength: number;
    message: string;
  };
}

// Interfaces para componentes
export interface LoginPageProps {
  redirectTo?: string;
}

export interface LoginFormProps {
  onSuccess?: (user: User) => void;
  onError?: (error: string) => void;
}

export interface LoginFormState {
  email: string;
  password: string;
  isLoading: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
  showPassword: boolean;
}

// Interfaces para hooks
export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  error: string | null;
}

export interface UseLoginReturn {
  login: (credentials: LoginCredentials) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

// Interface para manejo de errores
export interface ErrorHandling {
  display: (error: AuthError) => string;
  log: (error: AuthError) => void;
  retry: (action: () => Promise<void>) => Promise<void>;
}

// Interface para props de accesibilidad
export interface AccessibilityProps {
  'aria-label': string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  role?: string;
}

// Tipos para el store de Zustand
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export type AuthStore = AuthState & AuthActions;