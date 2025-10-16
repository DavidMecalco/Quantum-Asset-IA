import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
}

/**
 * Layout compartido para páginas de autenticación
 * Implementa el diseño glassmorphism con gradiente quantum
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  showLogo = true,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      {/* Efectos de fondo decorativos */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-quantum-blue/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-quantum-purple/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-quantum-indigo/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Contenedor principal */}
      <div className="relative w-full max-w-md">
        {/* Logo y branding */}
        {showLogo && (
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img
                src="/src/assets/QAI_logo.png"
                alt="Quantum Asset IA"
                className="h-16 w-auto mx-auto mb-4 drop-shadow-lg hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">
              Quantum Asset IA
            </h1>
            <p className="text-glass-200 text-sm">
              Portal de Integración con IBM Maximo
            </p>
          </div>
        )}

        {/* Tarjeta principal con glassmorphism */}
        <div className="bg-glass-50 backdrop-blur-md rounded-2xl border border-glass-100 shadow-2xl p-8 relative overflow-hidden">
          {/* Efecto de brillo sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          
          {/* Contenido */}
          <div className="relative z-10">
            {/* Título y subtítulo de la página */}
            {title && (
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-white mb-2">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-glass-200 text-sm">
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Contenido principal (formulario, etc.) */}
            {children}
          </div>
        </div>

        {/* Footer con enlaces adicionales */}
        <div className="text-center mt-6">
          <p className="text-glass-200 text-xs">
            © 2024 Quantum Asset IA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Variante del layout para páginas de error o estados especiales
 */
export const AuthErrorLayout: React.FC<{
  children: React.ReactNode;
  title: string;
}> = ({ children, title }) => {
  return (
    <AuthLayout title={title} showLogo={true}>
      <div className="text-center">
        {children}
        <div className="mt-6">
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 bg-quantum-blue/20 hover:bg-quantum-blue/30 text-white rounded-lg transition-colors duration-200 border border-quantum-blue/30"
          >
            Volver al Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

/**
 * Layout minimalista para páginas de carga
 */
export const AuthLoadingLayout: React.FC = () => {
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
        <p className="text-glass-200 text-sm mt-4">Cargando...</p>
      </div>
    </div>
  );
};

export default AuthLayout;