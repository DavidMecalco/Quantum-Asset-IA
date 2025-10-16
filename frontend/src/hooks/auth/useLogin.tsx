import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { UseLoginReturn, LoginCredentials, AuthError, AuthErrorType } from '../../types/auth';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../stores/authStore';

/**
 * Hook especializado para lógica de inicio de sesión
 * Integra React Query para manejo de mutaciones y retry automático
 */
export const useLogin = (): UseLoginReturn => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setError: setAuthError, clearError } = useAuthStore();
  
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Mutación de React Query para login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      // Verificar rate limiting local
      if (isRateLimited) {
        throw new Error('Demasiados intentos. Intenta en unos minutos.');
      }

      return await authService.login(credentials);
    },
    
    onSuccess: (response) => {
      // Actualizar store con datos del usuario
      setUser(response.user);
      clearError();
      
      // Reset attempt count
      setAttemptCount(0);
      setIsRateLimited(false);
      
      // Redirección automática
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    },
    
    onError: (error: AuthError) => {
      // Incrementar contador de intentos
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      
      // Implementar rate limiting local
      if (newAttemptCount >= 5) {
        setIsRateLimited(true);
        // Desbloquear después de 5 minutos
        setTimeout(() => {
          setIsRateLimited(false);
          setAttemptCount(0);
        }, 5 * 60 * 1000);
      }
      
      // Actualizar error en el store
      setAuthError(error.message);
    },
    
    // Configuración de retry
    retry: (failureCount, error: any) => {
      // No reintentar en ciertos casos
      if (error?.code === AuthErrorType.INVALID_CREDENTIALS) return false;
      if (error?.code === AuthErrorType.RATE_LIMIT) return false;
      if (error?.code === AuthErrorType.VALIDATION_ERROR) return false;
      
      // Reintentar hasta 2 veces para errores de red/servidor
      return failureCount < 2;
    },
    
    retryDelay: (attemptIndex) => {
      // Delay exponencial: 1s, 2s, 4s
      return Math.min(1000 * 2 ** attemptIndex, 4000);
    },
  });

  // Función de login principal
  const login = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    try {
      await loginMutation.mutateAsync(credentials);
    } catch (error) {
      // El error ya está manejado en onError de la mutación
      throw error;
    }
  }, [loginMutation]);

  // Función para resetear estado
  const reset = useCallback(() => {
    loginMutation.reset();
    setAttemptCount(0);
    setIsRateLimited(false);
    clearError();
  }, [loginMutation, clearError]);

  // Función para manejar retry manual
  const retry = useCallback(() => {
    if (loginMutation.failureCount > 0) {
      loginMutation.reset();
    }
  }, [loginMutation]);

  return {
    login,
    isLoading: loginMutation.isPending,
    error: loginMutation.error?.message || null,
    reset,
    
    // Propiedades adicionales útiles
    attemptCount,
    isRateLimited,
    canRetry: loginMutation.isError && !isRateLimited,
    retry,
    
    // Estados de React Query
    isSuccess: loginMutation.isSuccess,
    isError: loginMutation.isError,
    failureCount: loginMutation.failureCount,
  };
};

/**
 * Hook para manejar login con diferentes estrategias de retry
 */
export const useLoginWithRetry = () => {
  const baseLogin = useLogin();
  
  const loginWithExponentialBackoff = useCallback(async (
    credentials: LoginCredentials,
    maxRetries: number = 3
  ): Promise<void> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await baseLogin.login(credentials);
        return; // Éxito
      } catch (error: any) {
        lastError = error;
        
        // No reintentar para ciertos tipos de error
        if (error.code === AuthErrorType.INVALID_CREDENTIALS ||
            error.code === AuthErrorType.VALIDATION_ERROR) {
          throw error;
        }
        
        // Si no es el último intento, esperar antes del siguiente
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * 2 ** attempt, 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Si llegamos aquí, todos los intentos fallaron
    throw lastError;
  }, [baseLogin]);

  return {
    ...baseLogin,
    loginWithExponentialBackoff,
  };
};

/**
 * Hook para login con validación previa
 */
export const useValidatedLogin = () => {
  const baseLogin = useLogin();
  
  const loginWithValidation = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    // Validación básica antes de enviar
    if (!credentials.email || !credentials.password) {
      throw new Error('Email y contraseña son requeridos');
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      throw new Error('Formato de email inválido');
    }
    
    if (credentials.password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }
    
    return await baseLogin.login(credentials);
  }, [baseLogin]);

  return {
    ...baseLogin,
    loginWithValidation,
  };
};

/**
 * Hook para login con métricas y analytics
 */
export const useLoginWithAnalytics = () => {
  const baseLogin = useLogin();
  
  const loginWithAnalytics = useCallback(async (credentials: LoginCredentials): Promise<void> => {
    const startTime = Date.now();
    
    try {
      await baseLogin.login(credentials);
      
      // Métricas de éxito
      const duration = Date.now() - startTime;
      console.log('Login successful', {
        duration,
        email: credentials.email,
        rememberMe: credentials.rememberMe,
      });
      
    } catch (error: any) {
      // Métricas de error
      const duration = Date.now() - startTime;
      console.error('Login failed', {
        duration,
        error: error.message,
        code: error.code,
        attemptCount: baseLogin.attemptCount,
      });
      
      throw error;
    }
  }, [baseLogin]);

  return {
    ...baseLogin,
    loginWithAnalytics,
  };
};

export default useLogin;