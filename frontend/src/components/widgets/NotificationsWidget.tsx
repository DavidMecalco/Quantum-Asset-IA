import React, { useState, useMemo, useCallback } from 'react';
import { 
  Bell, 
  BellRing, 
  Filter, 
  Check, 
  CheckCheck, 
  AlertCircle, 
  Info, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Archive,
  ExternalLink
} from 'lucide-react';
import { NotificationModal } from '../modals/NotificationModal';
import { WidgetContainer } from '../layout/WidgetContainer';
import { WidgetProps, WidgetType } from '../../types/widgets';
import { useNotifications, useNotificationMutations } from '../../hooks/useNotifications';
import { 
  Notification, 
  NotificationType, 
  NotificationPriority, 
  NotificationStatus
} from '../../types/notifications';

// Props específicas para NotificationsWidget
interface NotificationsWidgetProps extends WidgetProps {
  maxNotifications?: number;
  showFilters?: boolean;
  showActions?: boolean;
}

// Función para obtener el icono según el tipo de notificación
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.ERROR:
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    case NotificationType.WARNING:
      return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    case NotificationType.SUCCESS:
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case NotificationType.INFO:
    default:
      return <Info className="w-4 h-4 text-blue-400" />;
  }
};

// Función para obtener el color de prioridad
const getPriorityColor = (priority: NotificationPriority) => {
  switch (priority) {
    case NotificationPriority.CRITICAL:
      return 'border-l-red-500 bg-red-500/10';
    case NotificationPriority.HIGH:
      return 'border-l-orange-500 bg-orange-500/10';
    case NotificationPriority.MEDIUM:
      return 'border-l-yellow-500 bg-yellow-500/10';
    case NotificationPriority.LOW:
    default:
      return 'border-l-blue-500 bg-blue-500/10';
  }
};

// Función para formatear tiempo relativo
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ahora';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d`;
  
  return date.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'short' 
  });
};

// Componente de filtros
const NotificationFilters: React.FC<{
  activeFilters: {
    status: NotificationStatus[];
    types: NotificationType[];
    priorities: NotificationPriority[];
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
}> = ({ activeFilters, onFilterChange, onClearFilters }) => {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = useMemo(() => {
    return activeFilters.status.length > 0 || 
           activeFilters.types.length > 0 || 
           activeFilters.priorities.length > 0;
  }, [activeFilters]);

  const toggleFilter = (category: string, value: string) => {
    const currentValues = activeFilters[category as keyof typeof activeFilters] || [];
    const newValues = currentValues.includes(value as never)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value as never];
    
    onFilterChange({
      ...activeFilters,
      [category]: newValues
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`p-2 rounded-lg transition-colors duration-200 ${
          hasActiveFilters 
            ? 'bg-quantum-blue/20 text-quantum-blue' 
            : 'text-glass-400 hover:text-white hover:bg-glass-200'
        }`}
        title="Filtros"
      >
        <Filter className="w-4 h-4" />
        {hasActiveFilters && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-quantum-blue rounded-full" />
        )}
      </button>

      {showFilters && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-glass-100 backdrop-blur-md rounded-lg border border-glass-200 shadow-lg z-50">
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white">Filtros</h4>
              {hasActiveFilters && (
                <button
                  onClick={onClearFilters}
                  className="text-xs text-glass-400 hover:text-white"
                >
                  Limpiar
                </button>
              )}
            </div>

            {/* Estado */}
            <div className="mb-3">
              <p className="text-xs text-glass-300 mb-2">Estado</p>
              <div className="space-y-1">
                {Object.values(NotificationStatus).map(status => (
                  <label key={status} className="flex items-center space-x-2 text-xs">
                    <input
                      type="checkbox"
                      checked={activeFilters.status.includes(status)}
                      onChange={() => toggleFilter('status', status)}
                      className="rounded border-glass-300"
                    />
                    <span className="text-glass-200 capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tipo */}
            <div className="mb-3">
              <p className="text-xs text-glass-300 mb-2">Tipo</p>
              <div className="space-y-1">
                {Object.values(NotificationType).map(type => (
                  <label key={type} className="flex items-center space-x-2 text-xs">
                    <input
                      type="checkbox"
                      checked={activeFilters.types.includes(type)}
                      onChange={() => toggleFilter('types', type)}
                      className="rounded border-glass-300"
                    />
                    <span className="text-glass-200 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Prioridad */}
            <div>
              <p className="text-xs text-glass-300 mb-2">Prioridad</p>
              <div className="space-y-1">
                {Object.values(NotificationPriority).map(priority => (
                  <label key={priority} className="flex items-center space-x-2 text-xs">
                    <input
                      type="checkbox"
                      checked={activeFilters.priorities.includes(priority)}
                      onChange={() => toggleFilter('priorities', priority)}
                      className="rounded border-glass-300"
                    />
                    <span className="text-glass-200 capitalize">{priority}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de notificación individual
const NotificationItem: React.FC<{
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onNotificationClick: (notification: Notification) => void;
  showActions: boolean;
  compact?: boolean;
}> = ({ notification, onMarkAsRead, onArchive, onNotificationClick, showActions: showActionsProp, compact = false }) => {
  const [showActionsState, setShowActionsState] = useState(false);

  const handleAction = useCallback((action: () => void) => {
    action();
    setShowActionsState(false);
  }, []);

  const isUnread = notification.status === NotificationStatus.UNREAD;

  return (
    <div
      className={`
        relative border-l-4 rounded-lg p-3 transition-all duration-200
        hover:bg-glass-100 group cursor-pointer
        ${getPriorityColor(notification.priority)}
        ${isUnread ? 'bg-glass-50' : 'bg-glass-25'}
      `}
      onMouseEnter={() => setShowActionsState(true)}
      onMouseLeave={() => setShowActionsState(false)}
      onClick={() => onNotificationClick(notification)}
    >
      <div className="flex items-start space-x-3">
        {/* Icono de tipo */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-medium truncate ${
                isUnread ? 'text-white' : 'text-glass-200'
              }`}>
                {notification.title}
              </h4>
              {!compact && (
                <p className={`text-xs mt-1 line-clamp-2 ${
                  isUnread ? 'text-glass-200' : 'text-glass-300'
                }`}>
                  {notification.message}
                </p>
              )}
            </div>

            {/* Indicador de no leído */}
            {isUnread && (
              <div className="flex-shrink-0 w-2 h-2 bg-quantum-blue rounded-full ml-2 mt-1" />
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2 text-xs text-glass-400">
              <Clock className="w-3 h-3" />
              <span>{formatRelativeTime(notification.timestamp)}</span>
              {notification.category && (
                <>
                  <span>•</span>
                  <span className="capitalize">{notification.category}</span>
                </>
              )}
            </div>

            {/* Acciones */}
            {showActionsProp && showActionsState && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {isUnread && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAction(() => onMarkAsRead(notification.id));
                    }}
                    className="p-1 text-glass-400 hover:text-green-400 hover:bg-green-500/20 rounded transition-colors duration-200"
                    title="Marcar como leído"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction(() => onArchive(notification.id));
                  }}
                  className="p-1 text-glass-400 hover:text-blue-400 hover:bg-blue-500/20 rounded transition-colors duration-200"
                  title="Archivar"
                >
                  <Archive className="w-3 h-3" />
                </button>

                {notification.actionUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(notification.actionUrl, '_blank');
                    }}
                    className="p-1 text-glass-400 hover:text-purple-400 hover:bg-purple-500/20 rounded transition-colors duration-200"
                    title="Abrir enlace"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente principal NotificationsWidget
export const NotificationsWidget: React.FC<NotificationsWidgetProps> = ({
  id,
  size,
  isLoading = false,
  error = null,
  onRefresh,
  onResize,
  onRemove,
  className = '',
  maxNotifications = 10,
  showFilters = true,
  showActions = true
}) => {
  // Estados locales
  const [filters, setFilters] = useState({
    status: [] as NotificationStatus[],
    types: [] as NotificationType[],
    priorities: [] as NotificationPriority[]
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Hooks de notificaciones
  const { 
    notifications, 
    stats, 
    isLoading: notificationsLoading, 
    error: notificationsError,
    refetch 
  } = useNotifications({
    status: filters.status.length > 0 ? filters.status : undefined,
    types: filters.types.length > 0 ? filters.types : undefined,
    priorities: filters.priorities.length > 0 ? filters.priorities : undefined
  });

  const { markAsRead, archiveNotification } = useNotificationMutations();

  // Crear widget state para el container
  const widgetState = {
    id,
    type: WidgetType.NOTIFICATIONS,
    size,
    position: { x: 0, y: 0, width: 2, height: 2 },
    isEnabled: true,
    isLoading: isLoading || notificationsLoading,
    error: error || notificationsError?.message || null,
    settings: {}
  };

  // Procesar notificaciones
  const processedNotifications = useMemo(() => {
    if (!notifications || !Array.isArray(notifications)) return [];
    
    return notifications
      .slice(0, maxNotifications)
      .sort((a, b) => {
        // Priorizar no leídas
        if (a.status === NotificationStatus.UNREAD && b.status !== NotificationStatus.UNREAD) return -1;
        if (b.status === NotificationStatus.UNREAD && a.status !== NotificationStatus.UNREAD) return 1;
        
        // Luego por timestamp
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  }, [notifications, maxNotifications]);

  // Estadísticas derivadas
  const notificationStats = useMemo(() => {
    const unreadCount = stats?.unread || 0;
    const totalCount = stats?.total || processedNotifications.length;
    
    return {
      unreadCount,
      totalCount,
      hasUnread: unreadCount > 0
    };
  }, [stats, processedNotifications]);

  // Handlers
  const handleRefresh = useCallback(() => {
    refetch();
    onRefresh?.();
  }, [refetch, onRefresh]);

  const handleMarkAsRead = useCallback((notificationId: string) => {
    markAsRead(notificationId);
  }, [markAsRead]);

  const handleArchive = useCallback((notificationId: string) => {
    archiveNotification(notificationId);
  }, [archiveNotification]);

  const handleMarkAllAsRead = useCallback(() => {
    const unreadNotifications = processedNotifications.filter(
      n => n.status === NotificationStatus.UNREAD
    );
    
    unreadNotifications.forEach(notification => {
      markAsRead(notification.id);
    });
  }, [processedNotifications, markAsRead]);

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      status: [],
      types: [],
      priorities: []
    });
  }, []);

  const handleNotificationClick = useCallback((notification: Notification) => {
    setSelectedNotification(notification);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedNotification(null);
  }, []);

  const handleNotificationChange = useCallback((notification: Notification) => {
    setSelectedNotification(notification);
  }, []);

  const handleModalNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedNotification || !processedNotifications.length) return;

    const currentIndex = processedNotifications.findIndex(n => n.id === selectedNotification.id);
    let newIndex = currentIndex;

    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < processedNotifications.length - 1) {
      newIndex = currentIndex + 1;
    }

    const newNotification = processedNotifications[newIndex];
    if (newNotification) {
      setSelectedNotification(newNotification);
    }
  }, [selectedNotification, processedNotifications]);

  // Determinar si mostrar modo compacto
  const isCompact = size === 'small';

  return (
    <WidgetContainer
      widget={widgetState}
      title="Notificaciones"
      subtitle={notificationStats.hasUnread ? `${notificationStats.unreadCount} sin leer` : 'Todo al día'}
      icon={notificationStats.hasUnread ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
      onRefresh={handleRefresh}
      onResize={onResize}
      onRemove={onRemove}
      className={className}
      refreshInterval={30000} // Auto-refresh cada 30 segundos
    >
      <div className="h-full flex flex-col">
        {/* Header con estadísticas y controles */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {/* Estadísticas */}
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${
                  notificationStats.hasUnread ? 'bg-quantum-blue' : 'bg-green-500'
                }`} />
                <span className="text-glass-200">
                  {notificationStats.totalCount} total
                </span>
              </div>
              
              {notificationStats.hasUnread && (
                <div className="flex items-center space-x-1">
                  <BellRing className="w-3 h-3 text-quantum-blue" />
                  <span className="text-quantum-blue font-medium">
                    {notificationStats.unreadCount} sin leer
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center space-x-2">
            {/* Marcar todas como leídas */}
            {notificationStats.hasUnread && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-2 text-glass-400 hover:text-green-400 hover:bg-green-500/20 rounded-lg transition-colors duration-200"
                title="Marcar todas como leídas"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}

            {/* Filtros */}
            {showFilters && !isCompact && (
              <NotificationFilters
                activeFilters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            )}
          </div>
        </div>

        {/* Lista de notificaciones */}
        <div className="flex-1 overflow-hidden">
          {processedNotifications.length === 0 ? (
            <div className="flex items-center justify-center h-full text-glass-400">
              <div className="text-center">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay notificaciones</p>
                <p className="text-xs mt-1">¡Todo está al día!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto h-full pr-2 scrollbar-thin scrollbar-thumb-glass-300 scrollbar-track-transparent">
              {processedNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onArchive={handleArchive}
                  onNotificationClick={handleNotificationClick}
                  showActions={showActions}
                  compact={isCompact}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer con acciones adicionales */}
        {!isCompact && processedNotifications.length > 0 && (
          <div className="mt-4 pt-3 border-t border-glass-200">
            <div className="flex items-center justify-between text-xs text-glass-400">
              <span>
                Mostrando {processedNotifications.length} de {notificationStats.totalCount}
              </span>
              
              <button
                onClick={() => {
                  if (processedNotifications.length > 0) {
                    handleNotificationClick(processedNotifications[0]);
                  }
                }}
                className="text-quantum-blue hover:text-quantum-purple transition-colors duration-200"
              >
                Ver todas →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de notificaciones */}
      <NotificationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        notification={selectedNotification}
        notifications={processedNotifications}
        onNavigate={handleModalNavigate}
        onNotificationChange={handleNotificationChange}
      />
    </WidgetContainer>
  );
};

export default NotificationsWidget;