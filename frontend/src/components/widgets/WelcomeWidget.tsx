import React, { useMemo } from 'react';
import { Clock, Calendar, Activity, TrendingUp, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { WidgetContainer } from '../layout/WidgetContainer';
import { WidgetProps, WidgetType } from '../../types/widgets';

// Props específicas para WelcomeWidget
interface WelcomeWidgetProps extends WidgetProps {
  showLastLogin?: boolean;
  showActivitySummary?: boolean;
  showQuickStats?: boolean;
}

// Función para obtener saludo según la hora
const getGreeting = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'Buenos días';
  if (hour >= 12 && hour < 18) return 'Buenas tardes';
  if (hour >= 18 && hour < 22) return 'Buenas noches';
  return 'Buenas madrugadas';
};

// Función para formatear fecha de último login
const formatLastLogin = (date: Date): string => {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Hace menos de una hora';
  if (diffInHours === 1) return 'Hace 1 hora';
  if (diffInHours < 24) return `Hace ${diffInHours} horas`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

// Función para obtener el día de la semana
const getCurrentDay = (): string => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[new Date().getDay()];
};

// Componente de estadísticas rápidas
const QuickStats: React.FC = () => {
  // Datos simulados - en producción vendrían de APIs
  const stats = useMemo(() => ({
    tasksCompleted: Math.floor(Math.random() * 15) + 5,
    hoursWorked: Math.floor(Math.random() * 6) + 2,
    efficiency: Math.floor(Math.random() * 20) + 80
  }), []);

  return (
    <div className="grid grid-cols-3 gap-3 mt-4">
      <div className="text-center">
        <div className="flex items-center justify-center w-8 h-8 bg-green-500/20 rounded-lg mx-auto mb-1">
          <Activity className="w-4 h-4 text-green-400" />
        </div>
        <p className="text-lg font-semibold text-white">{stats.tasksCompleted}</p>
        <p className="text-xs text-glass-300">Tareas hoy</p>
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-500/20 rounded-lg mx-auto mb-1">
          <Clock className="w-4 h-4 text-blue-400" />
        </div>
        <p className="text-lg font-semibold text-white">{stats.hoursWorked}h</p>
        <p className="text-xs text-glass-300">Trabajadas</p>
      </div>
      
      <div className="text-center">
        <div className="flex items-center justify-center w-8 h-8 bg-purple-500/20 rounded-lg mx-auto mb-1">
          <TrendingUp className="w-4 h-4 text-purple-400" />
        </div>
        <p className="text-lg font-semibold text-white">{stats.efficiency}%</p>
        <p className="text-xs text-glass-300">Eficiencia</p>
      </div>
    </div>
  );
};

// Componente de actividad reciente
const RecentActivity: React.FC = () => {
  // Actividades simuladas - en producción vendrían de APIs
  const activities = useMemo(() => [
    {
      id: 1,
      action: 'Completó work order',
      target: 'WO-2024-001',
      time: '10:30 AM',
      icon: Activity,
      color: 'text-green-400'
    },
    {
      id: 2,
      action: 'Revisó asset',
      target: 'PUMP-A-001',
      time: '09:15 AM',
      icon: User,
      color: 'text-blue-400'
    },
    {
      id: 3,
      action: 'Actualizó estado',
      target: 'Mantenimiento preventivo',
      time: '08:45 AM',
      icon: TrendingUp,
      color: 'text-purple-400'
    }
  ], []);

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium text-glass-200 mb-3">Actividad reciente</h4>
      {activities.map((activity) => {
        const IconComponent = activity.icon;
        return (
          <div key={activity.id} className="flex items-center space-x-3 p-2 hover:bg-glass-100 rounded-lg transition-colors duration-200">
            <div className={`flex-shrink-0 ${activity.color}`}>
              <IconComponent className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">
                {activity.action} <span className="text-glass-300">{activity.target}</span>
              </p>
              <p className="text-xs text-glass-400">{activity.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Componente principal WelcomeWidget
export const WelcomeWidget: React.FC<WelcomeWidgetProps> = ({
  id,
  size,
  isLoading = false,
  error = null,
  onRefresh,
  onResize,
  onRemove,
  className = '',
  showLastLogin = true,
  showActivitySummary = true,
  showQuickStats = true
}) => {
  const { user } = useAuthStore();

  // Crear widget state para el container
  const widgetState = {
    id,
    type: WidgetType.WELCOME,
    size,
    position: { x: 0, y: 0, width: 2, height: 2 },
    isEnabled: true,
    isLoading,
    error,
    settings: {}
  };

  if (!user) {
    return (
      <WidgetContainer
        widget={widgetState}
        title="Bienvenida"
        icon={<User className="w-4 h-4" />}
        onRefresh={onRefresh}
        onResize={onResize}
        onRemove={onRemove}
        className={className}
      >
        <div className="flex items-center justify-center h-full text-glass-400">
          <p>No hay usuario autenticado</p>
        </div>
      </WidgetContainer>
    );
  }

  const greeting = getGreeting();
  const currentDay = getCurrentDay();
  const firstName = user.firstName;
  const fullName = `${user.firstName} ${user.lastName}`;

  return (
    <WidgetContainer
      widget={widgetState}
      title="Bienvenida"
      subtitle={`${currentDay}, ${new Date().toLocaleDateString('es-ES')}`}
      icon={<User className="w-4 h-4" />}
      onRefresh={onRefresh}
      onResize={onResize}
      onRemove={onRemove}
      className={className}
    >
      <div className="h-full flex flex-col">
        {/* Saludo principal */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white mb-1">
            {greeting}, {firstName}! 👋
          </h2>
          <p className="text-glass-300 text-sm">
            Bienvenido de vuelta a Quantum Asset IA
          </p>
        </div>

        {/* Información del usuario */}
        <div className="bg-glass-100 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-quantum-blue to-quantum-purple rounded-full flex items-center justify-center text-white font-medium">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            
            {/* Información */}
            <div className="flex-1">
              <p className="text-white font-medium">{fullName}</p>
              <p className="text-glass-300 text-sm capitalize">{user.role}</p>
              {showLastLogin && user.lastLogin && (
                <p className="text-glass-400 text-xs flex items-center mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  Último acceso: {formatLastLogin(new Date(user.lastLogin))}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        {showQuickStats && size !== 'small' && (
          <QuickStats />
        )}

        {/* Actividad reciente */}
        {showActivitySummary && size === 'large' && (
          <div className="flex-1 overflow-hidden">
            <RecentActivity />
          </div>
        )}

        {/* Mensaje motivacional */}
        {size !== 'small' && (
          <div className="mt-auto pt-4">
            <div className="bg-gradient-to-r from-quantum-blue/20 to-quantum-purple/20 rounded-lg p-3 border border-quantum-blue/30">
              <p className="text-center text-sm text-glass-200">
                💡 <strong>Tip del día:</strong> Usa los filtros avanzados para encontrar work orders más rápido
              </p>
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

export default WelcomeWidget;