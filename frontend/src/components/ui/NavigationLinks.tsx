import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Home, HelpCircle, Shield, FileText } from 'lucide-react';

export interface NavigationLinksProps {
  variant?: 'auth' | 'footer' | 'sidebar';
  showBackToLogin?: boolean;
  className?: string;
}

/**
 * Componente de enlaces de navegación reutilizable
 */
export const NavigationLinks: React.FC<NavigationLinksProps> = ({
  variant = 'footer',
  showBackToLogin = false,
  className = '',
}) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  if (variant === 'auth') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Enlaces principales de autenticación */}
        <div className="text-center">
          <div className="flex justify-center space-x-6 text-sm">
            <Link
              to="/forgot-password"
              className={`transition-colors duration-200 hover:underline ${
                isActive('/forgot-password') 
                  ? 'text-quantum-blue' 
                  : 'text-quantum-blue hover:text-quantum-blue/80'
              }`}
            >
              ¿Olvidaste tu contraseña?
            </Link>
            
            <span className="text-glass-200">•</span>
            
            <Link
              to="/register"
              className={`transition-colors duration-200 hover:underline font-medium ${
                isActive('/register') 
                  ? 'text-quantum-purple' 
                  : 'text-quantum-purple hover:text-quantum-purple/80'
              }`}
            >
              Crear Cuenta
            </Link>
          </div>
        </div>

        {/* Enlaces de información */}
        <div className="text-center">
          <div className="flex justify-center space-x-4 text-xs">
            <Link
              to="/support"
              className={`flex items-center space-x-1 transition-colors duration-200 hover:underline ${
                isActive('/support') 
                  ? 'text-quantum-indigo' 
                  : 'text-quantum-indigo hover:text-quantum-indigo/80'
              }`}
            >
              <HelpCircle className="w-3 h-3" />
              <span>Soporte</span>
            </Link>
            
            <span className="text-glass-200">•</span>
            
            <Link
              to="/privacy"
              className={`flex items-center space-x-1 transition-colors duration-200 hover:underline ${
                isActive('/privacy') 
                  ? 'text-quantum-indigo' 
                  : 'text-quantum-indigo hover:text-quantum-indigo/80'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>Privacidad</span>
            </Link>
            
            <span className="text-glass-200">•</span>
            
            <Link
              to="/terms"
              className={`flex items-center space-x-1 transition-colors duration-200 hover:underline ${
                isActive('/terms') 
                  ? 'text-quantum-indigo' 
                  : 'text-quantum-indigo hover:text-quantum-indigo/80'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Términos</span>
            </Link>
          </div>
        </div>

        {/* Botón de regreso al login si es necesario */}
        {showBackToLogin && !isActive('/login') && (
          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center px-3 py-1.5 bg-quantum-blue/20 hover:bg-quantum-blue/30 text-white rounded-md transition-colors duration-200 border border-quantum-blue/30 text-sm"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Volver al Login
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <footer className={`text-center space-y-3 ${className}`}>
        <div className="flex justify-center space-x-4 text-xs">
          <Link
            to="/support"
            className="text-quantum-indigo hover:text-quantum-indigo/80 transition-colors duration-200 hover:underline"
          >
            Soporte Técnico
          </Link>
          <span className="text-glass-200">•</span>
          <Link
            to="/privacy"
            className="text-quantum-indigo hover:text-quantum-indigo/80 transition-colors duration-200 hover:underline"
          >
            Privacidad
          </Link>
          <span className="text-glass-200">•</span>
          <Link
            to="/terms"
            className="text-quantum-indigo hover:text-quantum-indigo/80 transition-colors duration-200 hover:underline"
          >
            Términos
          </Link>
        </div>
        
        <p className="text-glass-200 text-xs">
          © 2024 Quantum Asset IA. Todos los derechos reservados.
        </p>
      </footer>
    );
  }

  // Sidebar variant para dashboard
  return (
    <nav className={`space-y-2 ${className}`}>
      <Link
        to="/dashboard"
        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
          isActive('/dashboard')
            ? 'bg-quantum-blue/20 text-white border border-quantum-blue/30'
            : 'text-glass-200 hover:text-white hover:bg-glass-50'
        }`}
      >
        <Home className="w-4 h-4" />
        <span>Dashboard</span>
      </Link>
      
      <Link
        to="/support"
        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
          isActive('/support')
            ? 'bg-quantum-blue/20 text-white border border-quantum-blue/30'
            : 'text-glass-200 hover:text-white hover:bg-glass-50'
        }`}
      >
        <HelpCircle className="w-4 h-4" />
        <span>Soporte</span>
      </Link>
    </nav>
  );
};

/**
 * Breadcrumb navigation component
 */
export interface BreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
    isActive?: boolean;
  }>;
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-glass-200">/</span>
          )}
          
          {item.href && !item.isActive ? (
            <Link
              to={item.href}
              className="text-quantum-blue hover:text-quantum-blue/80 transition-colors duration-200 hover:underline"
            >
              {item.label}
            </Link>
          ) : (
            <span className={item.isActive ? 'text-white font-medium' : 'text-glass-200'}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default NavigationLinks;