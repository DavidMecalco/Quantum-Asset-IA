import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import { AuthErrorLayout } from '../auth/AuthLayout';
import { useCurrentUser } from '../../hooks/auth/useAuth';

/**
 * Página de acceso no autorizado
 */
export const UnauthorizedPage: React.FC = () => {
  const location = useLocation();
  const { user } = useCurrentUser();
  
  const state = location.state as any;
  const requiredRole = state?.requiredRole;
  const allowedRoles = state?.allowedRoles;

  return (
    <AuthErrorLayout title="Acceso No Autorizado">
      <div className="space-y-6">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          
          <h2 className="text-xl font-semibold text-white mb-2">
            No tienes permisos para acceder a esta página
          </h2>
          
          <div className="text-glass-200 text-sm space-y-2">
            {user && (
              <p>
                Estás conectado como: <strong>{user.firstName} {user.lastName}</strong><br />
                Rol actual: <strong className="capitalize">{user.role}</strong>
              </p>
            )}
            
            {requiredRole && (
              <p>
                Esta página requiere el rol: <strong className="capitalize">{requiredRole}</strong>
              </p>
            )}
            
            {allowedRoles && (
              <p>
                Roles permitidos: <strong className="capitalize">{allowedRoles.join(', ')}</strong>
              </p>
            )}
          </div>
        </div>

        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-4">
          <h3 className="text-sm font-medium text-white mb-2">
            ¿Necesitas acceso?
          </h3>
          <p className="text-glass-200 text-xs mb-3">
            Si crees que deberías tener acceso a esta funcionalidad, contacta a tu administrador.
          </p>
          <div className="text-glass-200 text-xs">
            <strong>Soporte:</strong> soporte@quantumasset.com
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-4 py-2 bg-quantum-blue/20 hover:bg-quantum-blue/30 text-white rounded-lg transition-colors duration-200 border border-quantum-blue/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver Atrás
          </button>
          
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 bg-quantum-purple/20 hover:bg-quantum-purple/30 text-white rounded-lg transition-colors duration-200 border border-quantum-purple/30"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </AuthErrorLayout>
  );
};

export default UnauthorizedPage;