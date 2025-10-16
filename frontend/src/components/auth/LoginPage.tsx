import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { LoginForm } from './LoginForm';
import { NavigationLinks } from '../ui/NavigationLinks';
import { useAuthStatus } from '../../hooks/auth/useAuth';
import { LoginPageProps } from '../../types/auth';

/**
 * Página completa de inicio de sesión
 * Integra AuthLayout con LoginForm y maneja parámetros de redirección
 */
export const LoginPage: React.FC<LoginPageProps> = ({ redirectTo }) => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading } = useAuthStatus();

  // Obtener parámetros de la URL
  const redirectParam = searchParams.get('redirect');
  const errorParam = searchParams.get('error');
  const messageParam = searchParams.get('message');

  // Determinar la URL de redirección
  const finalRedirectTo = redirectTo || redirectParam || '/home';

  // Mostrar loading si está verificando autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <img
            src="/src/assets/QAI_logo.png"
            alt="Quantum Asset IA"
            className="h-16 w-auto mx-auto mb-4 animate-pulse"
          />
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-quantum-blue rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-quantum-purple rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-quantum-indigo rounded-full animate-bounce delay-200"></div>
          </div>
          <p className="text-glass-200 text-sm mt-4">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Iniciar Sesión"
      subtitle="Accede a tu cuenta de Quantum Asset IA"
    >
      {/* Mensaje de error desde URL (ej: sesión expirada) */}
      {errorParam && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-200 text-sm text-center">
            {errorParam === 'session_expired' && 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'}
            {errorParam === 'unauthorized' && 'Necesitas iniciar sesión para acceder a esta página.'}
            {errorParam === 'invalid_token' && 'Token inválido. Por favor, inicia sesión nuevamente.'}
            {!['session_expired', 'unauthorized', 'invalid_token'].includes(errorParam) && 
              'Ha ocurrido un error. Por favor, intenta nuevamente.'}
          </p>
        </div>
      )}

      {/* Mensaje informativo desde URL */}
      {messageParam && (
        <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
          <p className="text-blue-200 text-sm text-center">
            {messageParam === 'logout_success' && 'Has cerrado sesión correctamente.'}
            {messageParam === 'registration_success' && 'Cuenta creada exitosamente. Ahora puedes iniciar sesión.'}
            {messageParam === 'password_reset' && 'Contraseña restablecida. Inicia sesión con tu nueva contraseña.'}
            {!['logout_success', 'registration_success', 'password_reset'].includes(messageParam) && messageParam}
          </p>
        </div>
      )}

      {/* Formulario de login */}
      <LoginForm
        onSuccess={(user) => {
          console.log('Login exitoso:', user);
          // La redirección se maneja automáticamente en el hook useAuth
        }}
        onError={(error) => {
          console.error('Error de login:', error);
          // Los errores se manejan en el formulario
        }}
      />

      {/* Enlaces de navegación adicionales */}
      <div className="mt-6 space-y-4">
        {/* Separador */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-glass-100"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-glass-50 text-glass-200">o</span>
          </div>
        </div>

        {/* Enlaces de navegación */}
        <NavigationLinks variant="auth" />
      </div>
    </AuthLayout>
  );
};

export default LoginPage;