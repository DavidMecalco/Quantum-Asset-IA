import React, { useState } from 'react';

// Componente principal HomePage simplificado para pruebas
export const HomePage: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'notifications' | 'settings' | 'help' | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      {/* Header simplificado */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Quantum Asset IA</h1>
              <span className="text-white/60 text-sm">Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveModal('notifications')}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                title="Notificaciones"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 17H6l5 5v-5z" />
                </svg>
              </button>
              
              <button
                onClick={() => setActiveModal('settings')}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                title="Configuración"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-200 rounded-lg transition-colors duration-200 border border-red-500/30"
                title="Cerrar Sesión"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Widget de Bienvenida */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">¡Bienvenido!</h2>
            <p className="text-white/70 mb-4">
              Tu dashboard está listo. Aquí podrás ver el estado del sistema, tareas pendientes y más.
            </p>
            <div className="text-sm text-white/60">
              <p>Último acceso: Hoy</p>
              <p>Estado: Conectado</p>
            </div>
          </div>

          {/* Widget de Estado del Sistema */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Estado del Sistema</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white/70">Maximo</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-200 rounded-full text-sm">Conectado</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Base de Datos</span>
                <span className="px-2 py-1 bg-green-500/20 text-green-200 rounded-full text-sm">Activa</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70">Usuarios Activos</span>
                <span className="text-white">25</span>
              </div>
            </div>
          </div>

          {/* Widget de Tareas */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Tareas Pendientes</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Mantenimiento Bomba #1</p>
                  <p className="text-white/60 text-sm">WO-2024-001</p>
                </div>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-200 rounded-full text-xs">Alta</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="text-white font-medium">Inspección Eléctrica</p>
                  <p className="text-white/60 text-sm">WO-2024-002</p>
                </div>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-200 rounded-full text-xs">Media</span>
              </div>
            </div>
          </div>

          {/* Widget de Acciones Rápidas */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 rounded-lg transition-colors duration-200 text-center">
                <div className="text-2xl mb-1">📋</div>
                <div className="text-sm">Nueva Orden</div>
              </button>
              <button className="p-3 bg-green-600/20 hover:bg-green-600/30 text-green-200 rounded-lg transition-colors duration-200 text-center">
                <div className="text-2xl mb-1">📊</div>
                <div className="text-sm">Reportes</div>
              </button>
              <button className="p-3 bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 rounded-lg transition-colors duration-200 text-center">
                <div className="text-2xl mb-1">🔧</div>
                <div className="text-sm">Inventario</div>
              </button>
              <button className="p-3 bg-orange-600/20 hover:bg-orange-600/30 text-orange-200 rounded-lg transition-colors duration-200 text-center">
                <div className="text-2xl mb-1">👥</div>
                <div className="text-sm">Usuarios</div>
              </button>
            </div>
          </div>

          {/* Widget de Notificaciones */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Notificaciones</h2>
            <div className="space-y-3">
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-blue-200 font-medium text-sm">Sistema actualizado</p>
                <p className="text-blue-200/70 text-xs">Hace 2 horas</p>
              </div>
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-200 font-medium text-sm">Mantenimiento programado</p>
                <p className="text-yellow-200/70 text-xs">Mañana 8:00 AM</p>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-green-200 font-medium text-sm">Tarea completada</p>
                <p className="text-green-200/70 text-xs">Hace 1 día</p>
              </div>
            </div>
          </div>

          {/* Widget de Métricas */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Métricas del Sistema</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">CPU</span>
                  <span className="text-white">45%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">Memoria</span>
                  <span className="text-white">60%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white/70">Disco</span>
                  <span className="text-white">30%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modales simplificados */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Notificaciones</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-white/70">Centro de notificaciones en desarrollo...</p>
              <button
                onClick={() => setActiveModal(null)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'settings' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Configuración</h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <p className="text-white/70">Panel de configuración en desarrollo...</p>
              <button
                onClick={() => setActiveModal(null)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;