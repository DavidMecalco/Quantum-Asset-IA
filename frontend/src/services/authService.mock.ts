import { LoginCredentials, AuthResponse, AuthError, AuthErrorType, UserRole } from '../types/auth';

// Usuarios mock para desarrollo
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@quantum.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    lastLogin: new Date(),
    preferences: {
      theme: 'dark' as const,
      language: 'es',
      notifications: true,
    },
  },
  {
    id: '2',
    email: 'user@quantum.com',
    password: 'user123',
    firstName: 'Regular',
    lastName: 'User',
    role: UserRole.USER,
    lastLogin: new Date(),
    preferences: {
      theme: 'light' as const,
      language: 'es',
      notifications: true,
    },
  },
  {
    id: '3',
    email: 'viewer@quantum.com',
    password: 'viewer123',
    firstName: 'Viewer',
    lastName: 'User',
    role: UserRole.VIEWER,
    lastLogin: new Date(),
    preferences: {
      theme: 'system' as const,
      language: 'es',
      notifications: false,
    },
  },
];

// Simular delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generar token mock
const generateMockToken = (userId: string): string => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 horas
    iat: Math.floor(Date.now() / 1000),
  }));
  const signature = btoa('mock-signature');
  
  return `${header}.${payload}.${signature}`;
};

// Servicio de autenticación mock
export const authServiceMock = {
  /**
   * Iniciar sesión con credenciales mock
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    await delay(800); // Simular delay de red

    const user = MOCK_USERS.find(u => u.email === credentials.email);
    
    if (!user || user.password !== credentials.password) {
      const error: AuthError = {
        code: AuthErrorType.INVALID_CREDENTIALS,
        message: 'Email o contraseña incorrectos',
      };
      throw error;
    }

    // Simular rate limiting
    const lastAttempt = localStorage.getItem('lastLoginAttempt');
    const now = Date.now();
    
    if (lastAttempt && (now - parseInt(lastAttempt)) < 1000) {
      const error: AuthError = {
        code: AuthErrorType.RATE_LIMIT,
        message: 'Demasiados intentos. Espera un momento',
      };
      throw error;
    }
    
    localStorage.setItem('lastLoginAttempt', now.toString());

    const accessToken = generateMockToken(user.id);
    const refreshToken = generateMockToken(user.id + '_refresh');

    // Almacenar tokens
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        lastLogin: user.lastLogin,
        preferences: user.preferences,
      },
      accessToken,
      refreshToken,
      expiresIn: 86400, // 24 horas
    };
  },

  /**
   * Cerrar sesión
   */
  async logout(): Promise<void> {
    await delay(200);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  /**
   * Renovar token de acceso
   */
  async refreshToken(): Promise<string> {
    await delay(300);
    
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // En un caso real, validaríamos el refresh token
    const newAccessToken = generateMockToken('mock_user_id');
    localStorage.setItem('accessToken', newAccessToken);
    
    return newAccessToken;
  },

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(email: string): Promise<void> {
    await delay(1000);
    
    const user = MOCK_USERS.find(u => u.email === email);
    if (!user) {
      const error: AuthError = {
        code: AuthErrorType.VALIDATION_ERROR,
        message: 'Email no encontrado',
        field: 'email',
      };
      throw error;
    }
    
    // En un caso real, se enviaría un email
    console.log(`Mock: Password reset email sent to ${email}`);
  },

  /**
   * Verificar si hay un token válido almacenado
   */
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

  /**
   * Obtener el token de acceso actual
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },

  /**
   * Limpiar todos los tokens almacenados
   */
  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};