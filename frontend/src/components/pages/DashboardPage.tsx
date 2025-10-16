import React from 'react';
import { useCurrentUser } from '../../hooks/auth/useAuth';
import { LogOut, Settings, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

/**
 * Dashboard principal (placeholder)
 */
export const DashboardPage: React.FC = () => {
  const { user, fullName } = useCurrentUser();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header */}
      <header className="bg-glass-50 backdrop-blur-md border-b border-glass-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src="/src/assets/QAI_logo.png"
                alt="Quantum Asset IA"
                className="h-8 w-auto"
              />
              <h1 className="text-xl font-bold text-white">
                Quantum Asset IA
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white text-sm font-medium">
                  {fullName}
                </p>
                <p className="text-glass-200 text-xs capitalize">
                  {user?.role}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-2 text-glass-200 hover:text-white transition-colors duration-200">
                  <Settings className="w-4 h-4" />
                </button>
                
                <button className="p-2 text-glass-200 hover:text-white transition-colors duration-200">
                  <User className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleLogout}
                  className="p-2 text-glass-200 hover:text-red-400 transition-colors duration-200"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-glass-50 backdrop-blur-md rounded-2xl border border-glass-100 p-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              ¡Bienvenido, {user?.firstName}!
            </h2>
            <p className="text-glass-200 mb-6">
              Has iniciado sesión exitosamente en Quantum Asset IA. 
              Este es tu portal de integración con IBM Maximo Application Suite.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-quantum-blue/20 rounded-lg p-4 border border-quantum-blue/30">
                <h3 className="text-white font-medium mb-2">Estado del Sistema</h3>
                <p className="text-green-400 text-sm">✓ Conectado</p>
              </div>
              
              <div className="bg-quantum-purple/20 rounded-lg p-4 border border-quantum-purple/30">
                <h3 className="text-white font-medium mb-2">Último Acceso</h3>
                <p className="text-glass-200 text-sm">
                  {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Primer acceso'}
                </p>
              </div>
              
              <div className="bg-quantum-indigo/20 rounded-lg p-4 border border-quantum-indigo/30">
                <h3 className="text-white font-medium mb-2">Rol de Usuario</h3>
                <p className="text-glass-200 text-sm capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-glass-50 backdrop-blur-md rounded-2xl border border-glass-100 p-8">
            <h3 className="text-xl font-semibold text-white mb-6">
              Acciones Rápidas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button className="bg-glass-50 hover:bg-glass-100 rounded-lg p-4 border border-glass-100 transition-colors duration-200 text-left">
                <h4 className="text-white font-medium mb-2">Assets</h4>
                <p className="text-glass-200 text-sm">Gestionar activos</p>
              </button>
              
              <button className="bg-glass-50 hover:bg-glass-100 rounded-lg p-4 border border-glass-100 transition-colors duration-200 text-left">
                <h4 className="text-white font-medium mb-2">Work Orders</h4>
                <p className="text-glass-200 text-sm">Órdenes de trabajo</p>
              </button>
              
              <button className="bg-glass-50 hover:bg-glass-100 rounded-lg p-4 border border-glass-100 transition-colors duration-200 text-left">
                <h4 className="text-white font-medium mb-2">Reports</h4>
                <p className="text-glass-200 text-sm">Reportes y análisis</p>
              </button>
              
              <button className="bg-glass-50 hover:bg-glass-100 rounded-lg p-4 border border-glass-100 transition-colors duration-200 text-left">
                <h4 className="text-white font-medium mb-2">Settings</h4>
                <p className="text-glass-200 text-sm">Configuración</p>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;