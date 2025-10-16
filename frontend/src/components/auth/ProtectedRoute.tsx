import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStatus } from '../../hooks/auth/useAuth';
import { AuthLoadingLayout } from './AuthLayout';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallbackPath?: string;
}

/**
 * Componente para proteger rutas que requieren autenticación
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login',
}) => {
  const { isAuthenticated, isLoading, user } = useAuthStatus();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <AuthLoadingLayout />;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Si se requiere un rol específico, verificarlo
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ from: location, requiredRole }} 
        replace 
      />
    );
  }

  // Si todo está bien, renderizar los children
  return <>{children}</>;
};

/**
 * Componente para rutas que solo deben ser accesibles por usuarios NO autenticados
 */
export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const { isAuthenticated, isLoading } = useAuthStatus();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <AuthLoadingLayout />;
  }

  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si no está autenticado, mostrar la ruta pública
  return <>{children}</>;
};

/**
 * Componente para rutas que requieren roles específicos
 */
export const RoleBasedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}> = ({ children, allowedRoles, fallbackPath = '/unauthorized' }) => {
  const { isAuthenticated, isLoading, user } = useAuthStatus();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return <AuthLoadingLayout />;
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Verificar si el usuario tiene uno de los roles permitidos
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location, allowedRoles }} 
        replace 
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;