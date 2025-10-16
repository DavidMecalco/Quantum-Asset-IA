import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, authSelectors } from '../../stores/authStore';
import { UseAuthReturn, LoginCredentials } from '../../types/auth';

/**
 * Hook personalizado para gestión de autenticación
 * Proporciona una interfaz limpia para interactuar con el store de auth
 * e incluye lógica de redirección automática
 */
export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Obtener estado y acciones del store
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: storeLogin,
    logout: storeLogout,
    setError,
    clearError,
    checkAuth,
  } = useAuthStore();

  // Función de login con redirección automática
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      await storeLogin(credentials);
      
      // Redirección después del login exitoso
      const from = (location.state as any)?.from?.pathname || '/home';
      navigate(from, { replace: true });
    } catch (error) {
      // El error ya está manejado en el store, solo lo re-lanzamos
      throw error;
    }
  };

  // Función de logout con redirección
  const logout = (): void => {
    storeLogout();
    navigate('/login', { replace: true });
  };

  // Verificar autenticación al montar el componente
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Auto-redirección si no está autenticado (para rutas protegidas)
  useEffect(() => {
    const isLoginPage = location.pathname === '/login';
    const isPublicRoute = ['/login', '/register', '/forgot-password'].includes(location.pathname);
    
    if (!isAuthenticated && !isLoading && !isPublicRoute) {
      // Guardar la ruta actual para redirección después del login
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
    }
    
    // Si está autenticado y está en la página de login, redirigir al home
    if (isAuthenticated && isLoginPage) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, isLoading, location, navigate]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    error,
  };
};

/**
 * Hook para verificar roles de usuario
 */
export const useUserRole = () => {
  const user = useAuthStore(authSelectors.user);
  
  return {
    user,
    isAdmin: user?.role === 'admin',
    isUser: user?.role === 'user',
    isViewer: user?.role === 'viewer',
    hasRole: (role: string) => user?.role === role,
    hasAnyRole: (roles: string[]) => user ? roles.includes(user.role) : false,
  };
};

/**
 * Hook para manejar redirecciones basadas en autenticación
 */
export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore(authSelectors.isAuthenticated);
  const isLoading = useAuthStore(authSelectors.isLoading);

  const redirectToLogin = (from?: string) => {
    navigate('/login', {
      state: { from: from ? { pathname: from } : location },
      replace: true,
    });
  };

  const redirectToDashboard = () => {
    navigate('/home', { replace: true });
  };

  const redirectAfterLogin = () => {
    const from = (location.state as any)?.from?.pathname || '/home';
    navigate(from, { replace: true });
  };

  return {
    isAuthenticated,
    isLoading,
    redirectToLogin,
    redirectToDashboard,
    redirectAfterLogin,
  };
};

/**
 * Hook para gestión de errores de autenticación
 */
export const useAuthError = () => {
  const error = useAuthStore(authSelectors.error);
  const clearError = useAuthStore((state) => state.clearError);
  const setError = useAuthStore((state) => state.setError);

  // Limpiar error después de un tiempo
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return {
    error,
    hasError: !!error,
    clearError,
    setError,
  };
};

/**
 * Hook para verificar si el usuario está autenticado (sin redirecciones)
 * Útil para componentes que solo necesitan verificar el estado
 */
export const useAuthStatus = () => {
  const isAuthenticated = useAuthStore(authSelectors.isAuthenticated);
  const isLoading = useAuthStore(authSelectors.isLoading);
  const user = useAuthStore(authSelectors.user);

  return {
    isAuthenticated,
    isLoading,
    user,
    isReady: !isLoading, // Indica si la verificación de auth ha terminado
  };
};

/**
 * Hook para obtener información del usuario actual
 */
export const useCurrentUser = () => {
  const user = useAuthStore(authSelectors.user);
  const fullName = useAuthStore(authSelectors.fullName);
  const isAdmin = useAuthStore(authSelectors.isAdmin);
  const updateUser = useAuthStore((state) => state.updateUser);

  return {
    user,
    fullName,
    isAdmin,
    updateUser,
    initials: user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : null,
    email: user?.email,
    role: user?.role,
  };
};