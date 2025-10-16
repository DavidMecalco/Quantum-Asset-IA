import React, { useMemo, memo } from 'react';
import { Clock, Calendar, Activity, TrendingUp, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { WidgetContainer } from '../layout/WidgetContainer';
import { WidgetProps, WidgetType } from '../../types/widgets';
import { useStableCallback, memoizeFunction } from '../../utils/memoization';

// Props específicas para WelcomeWidget
interface WelcomeWidgetProps extends WidgetProps {
  showLastLogin?: boolean;
  showActivitySummary?: boolean;
  showQuickStats?: boolean;
}

// Memoized function for getting greeting based on hour
const getGreeting = memoizeFunction((): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) return 'Buenos días';
  if (hour >= 12 && hour < 18) return 'Buenas tardes';
  if (hour >= 18 && hour < 22) return 'Buenas noches';
  return 'Buenas madrugadas';
}, () => Math.floor(Date.now() / (1000 * 60 * 60)).toString()); // Cache per hour

// Memoized function for formatting last login date
const formatLastLogin = memoizeFunction((date: Date): string => {
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
}, (date: Date) => `${date.getTime()}-${Math.floor(Date.now() / (1000 * 60 * 60))}`);

// Memoized function for getting current day
const getCurrentDay = memoizeFunction((): string => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[new Date().getDay()];
}, () => new Date().toDateString()); // Cache per day

// Memoized component for quick stats
const QuickStats: React.FC = memo(() => {
  // Expensive calculation memoized with daily cache
  const stats = useMemo(() => ({
    tasksCompleted: Math.floor(Math.random() * 15) + 5,
    hoursWorked: Math.floor(Math.random() * 6) + 2,
    efficiency: Math.floor(Math.random() * 20) + 80
  }), [new Date().toDateString()]); // Recalculate daily

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
});

QuickStats.displayName = 'QuickStats';

// Memoized component for recent activity
const RecentActivity: React.FC = memo(() => {
  // Memoized activities data - in production would come from APIs
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
  ], [new Date().toDateString()]); // Recalculate daily

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
});

RecentActivity.displayName = 'RecentActivity';

// Memoized main WelcomeWidget component
export const WelcomeWidget: React.FC<WelcomeWidgetProps> = memo(({
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

  // Memoized widget state for container
  const widgetState = useMemo(() => ({
    id,
    type: WidgetType.WELCOME,
    size,
    position: { x: 0, y: 0, width: 2, height: 2 },
    isEnabled: true,
    isLoading,
    error,
    settings: {}
  }), [id, size, isLoading, error]);

  // Memoized user data calculations
  const userInfo = useMemo(() => {
    if (!user) return null;
    
    return {
      firstName: user.firstName,
      fullName: `${user.firstName} ${user.lastName}`,
      initials: `${user.firstName[0]}${user.lastName[0]}`,
      role: user.role,
      lastLogin: user.lastLogin
    };
  }, [user?.firstName, user?.lastName, user?.role, user?.lastLogin]);

  // Memoized time-based data
  const timeInfo = useMemo(() => ({
    greeting: getGreeting(),
    currentDay: getCurrentDay(),
    currentDate: new Date().toLocaleDateString('es-ES')
  }), [Math.floor(Date.now() / (1000 * 60 * 60))]); // Update hourly

  // Stable callbacks
  const handleRefresh = useStableCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const handleResize = useStableCallback((newSize: any) => {
    onResize?.(newSize);
  }, [onResize]);

  const handleRemove = useStableCallback(() => {
    onRemove?.();
  }, [onRemove]);

  if (!userInfo) {
    return (
      <WidgetContainer
        widget={widgetState}
        title="Bienvenida"
        icon={<User className="w-4 h-4" />}
        onRefresh={handleRefresh}
        onResize={handleResize}
        onRemove={handleRemove}
        className={className}
      >
        <div className="flex items-center justify-center h-full text-glass-400">
          <p>No hay usuario autenticado</p>
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      widget={widgetState}
      title="Bienvenida"
      subtitle={`${timeInfo.currentDay}, ${timeInfo.currentDate}`}
      icon={<User className="w-4 h-4" />}
      onRefresh={handleRefresh}
      onResize={handleResize}
      onRemove={handleRemove}
      className={className}
    >
      <div className="h-full flex flex-col">
        {/* Saludo principal */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-white mb-1">
            {timeInfo.greeting}, {userInfo.firstName}! 👋
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
              {userInfo.initials}
            </div>
            
            {/* Información */}
            <div className="flex-1">
              <p className="text-white font-medium">{userInfo.fullName}</p>
              <p className="text-glass-300 text-sm capitalize">{userInfo.role}</p>
              {showLastLogin && userInfo.lastLogin && (
                <p className="text-glass-400 text-xs flex items-center mt-1">
                  <Calendar className="w-3 h-3 mr-1" />
                  Último acceso: {formatLastLogin(new Date(userInfo.lastLogin))}
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
});

WelcomeWidget.displayName = 'WelcomeWidget';

export default WelcomeWidget;