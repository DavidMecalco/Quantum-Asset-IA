import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Archive,
  ExternalLink,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Tag,
  Calendar,
  Link,
  Copy,
  Share2,
  MoreHorizontal
} from 'lucide-react';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationCategory
} from '../../types/notifications';
import { useNotificationMutations } from '../../hooks/useNotifications';

// Props del modal
interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
  notifications?: Notification[];
  onNavigate?: (direction: 'prev' | 'next') => void;
  onNotificationChange?: (notification: Notification) => void;
}

// Función para obtener el icono según el tipo de notificación
const getNotificationIcon = (type: NotificationType, size: string = 'w-5 h-5') => {
  const iconClass = `${size} flex-shrink-0`;
  
  switch (type) {
    case NotificationType.ERROR:
      return <AlertCircle className={`${iconClass} text-red-400`} />;
    case NotificationType.WARNING:
      return <AlertTriangle className={`${iconClass} text-yellow-400`} />;
    case NotificationType.SUCCESS:
      return <CheckCircle className={`${iconClass} text-green-400`} />;
    case NotificationType.INFO:
    default:
      return <Info className={`${iconClass} text-blue-400`} />;
  }
};

// Función para obtener el color de prioridad
const getPriorityColor = (priority: NotificationPriority) => {
  switch (priority) {
    case NotificationPriority.CRITICAL:
      return 'text-red-400 bg-red-500/20 border-red-500/30';
    case NotificationPriority.HIGH:
      return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    case NotificationPriority.MEDIUM:
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case NotificationPriority.LOW:
    default:
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
  }
};

// Función para obtener el color de categoría
const getCategoryColor = (category: NotificationCategory) => {
  switch (category) {
    case NotificationCategory.SYSTEM:
      return 'text-purple-400 bg-purple-500/20';
    case NotificationCategory.SECURITY:
      return 'text-red-400 bg-red-500/20';
    case NotificationCategory.TASK:
      return 'text-blue-400 bg-blue-500/20';
    case NotificationCategory.MAINTENANCE:
      return 'text-yellow-400 bg-yellow-500/20';
    case NotificationCategory.USER:
      return 'text-green-400 bg-green-500/20';
    case NotificationCategory.INTEGRATION:
      return 'text-indigo-400 bg-indigo-500/20';
    default:
      return 'text-gray-400 bg-gray-500/20';
  }
};

// Función para formatear fecha completa
const formatFullDate = (date: Date): string => {
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Función para formatear tiempo relativo
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Hace menos de un minuto';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `Hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `Hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
};

// Componente de acciones contextuales
const NotificationActions: React.FC<{
  notification: Notification;
  onMarkAsRead: () => void;
  onArchive: () => void;
  onCopyLink?: () => void;
  onShare?: () => void;
  isMarkingAsRead?: boolean;
  isArchiving?: boolean;
}> = ({ 
  notification, 
  onMarkAsRead, 
  onArchive, 
  onCopyLink, 
  onShare,
  isMarkingAsRead = false,
  isArchiving = false
}) => {
  const [showMoreActions, setShowMoreActions] = useState(false);
  const isUnread = notification.status === NotificationStatus.UNREAD;

  // Acciones principales basadas en el tipo de notificación
  const getPrimaryActions = () => {
    const actions = [];

    // Marcar como leído (solo si no está leído)
    if (isUnread) {
      actions.push({
        key: 'mark-read',
        label: 'Marcar como leído',
        icon: <Check className="w-4 h-4" />,
        onClick: onMarkAsRead,
        loading: isMarkingAsRead,
        variant: 'primary' as const
      });
    }

    // Acción específica según el tipo
    switch (notification.type) {
      case NotificationType.ERROR:
        if (notification.actionUrl) {
          actions.push({
            key: 'view-details',
            label: 'Ver detalles del error',
            icon: <ExternalLink className="w-4 h-4" />,
            onClick: () => window.open(notification.actionUrl, '_blank'),
            variant: 'secondary' as const
          });
        }
        break;
      
      case NotificationType.WARNING:
        if (notification.actionUrl) {
          actions.push({
            key: 'resolve',
            label: 'Resolver advertencia',
            icon: <ExternalLink className="w-4 h-4" />,
            onClick: () => window.open(notification.actionUrl, '_blank'),
            variant: 'secondary' as const
          });
        }
        break;
      
      case NotificationType.SUCCESS:
        if (notification.actionUrl) {
          actions.push({
            key: 'view-result',
            label: 'Ver resultado',
            icon: <ExternalLink className="w-4 h-4" />,
            onClick: () => window.open(notification.actionUrl, '_blank'),
            variant: 'secondary' as const
          });
        }
        break;
      
      case NotificationType.INFO:
      default:
        if (notification.actionUrl) {
          actions.push({
            key: 'more-info',
            label: notification.actionLabel || 'Más información',
            icon: <ExternalLink className="w-4 h-4" />,
            onClick: () => window.open(notification.actionUrl, '_blank'),
            variant: 'secondary' as const
          });
        }
        break;
    }

    return actions;
  };

  // Acciones secundarias
  const getSecondaryActions = () => {
    const actions = [];

    // Archivar
    actions.push({
      key: 'archive',
      label: 'Archivar',
      icon: <Archive className="w-4 h-4" />,
      onClick: onArchive,
      loading: isArchiving
    });

    // Copiar enlace (si existe)
    if (notification.actionUrl && onCopyLink) {
      actions.push({
        key: 'copy-link',
        label: 'Copiar enlace',
        icon: <Copy className="w-4 h-4" />,
        onClick: onCopyLink
      });
    }

    // Compartir (si está disponible)
    if (onShare) {
      actions.push({
        key: 'share',
        label: 'Compartir',
        icon: <Share2 className="w-4 h-4" />,
        onClick: onShare
      });
    }

    return actions;
  };

  const primaryActions = getPrimaryActions();
  const secondaryActions = getSecondaryActions();

  return (
    <div className="flex items-center justify-between">
      {/* Acciones principales */}
      <div className="flex items-center space-x-2">
        {primaryActions.map(action => (
          <button
            key={action.key}
            onClick={action.onClick}
            disabled={action.loading}
            className={`
              px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed
              ${action.variant === 'primary' 
                ? 'bg-quantum-blue text-white hover:bg-quantum-blue/80' 
                : 'bg-glass-100 text-glass-200 hover:bg-glass-200 hover:text-white'
              }
            `}
          >
            {action.loading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              action.icon
            )}
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Acciones secundarias */}
      {secondaryActions.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowMoreActions(!showMoreActions)}
            className="p-2 text-glass-400 hover:text-white hover:bg-glass-100 rounded-lg transition-colors duration-200"
            title="Más acciones"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMoreActions && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-glass-100 backdrop-blur-md rounded-lg border border-glass-200 shadow-lg z-50">
              <div className="py-1">
                {secondaryActions.map(action => (
                  <button
                    key={action.key}
                    onClick={() => {
                      action.onClick();
                      setShowMoreActions(false);
                    }}
                    disabled={action.loading}
                    className="w-full px-3 py-2 text-left text-sm text-glass-200 hover:text-white hover:bg-glass-200 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {action.loading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      action.icon
                    )}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Componente principal del modal
export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notification,
  notifications = [],
  onNavigate,
  onNotificationChange
}) => {
  const [showFullDate, setShowFullDate] = useState(false);
  const { markAsRead, archiveNotification, isMarkingAsRead, isArchivingNotification } = useNotificationMutations();

  // Encontrar índice actual y calcular navegación
  const currentIndex = useMemo(() => {
    if (!notification || !notifications.length) return -1;
    return notifications.findIndex(n => n.id === notification.id);
  }, [notification, notifications]);

  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < notifications.length - 1;

  // Handlers de navegación
  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!notifications.length) return;

    let newIndex = currentIndex;
    if (direction === 'prev' && canNavigatePrev) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && canNavigateNext) {
      newIndex = currentIndex + 1;
    }

    const newNotification = notifications[newIndex];
    if (newNotification && onNotificationChange) {
      onNotificationChange(newNotification);
    }

    onNavigate?.(direction);
  }, [currentIndex, canNavigatePrev, canNavigateNext, notifications, onNavigate, onNotificationChange]);

  // Handlers de acciones
  const handleMarkAsRead = useCallback(() => {
    if (notification && notification.status === NotificationStatus.UNREAD) {
      markAsRead(notification.id);
    }
  }, [notification, markAsRead]);

  const handleArchive = useCallback(() => {
    if (notification) {
      archiveNotification(notification.id);
      // Cerrar modal después de archivar
      setTimeout(() => onClose(), 500);
    }
  }, [notification, archiveNotification, onClose]);

  const handleCopyLink = useCallback(() => {
    if (notification?.actionUrl) {
      navigator.clipboard.writeText(notification.actionUrl);
      // Aquí podrías mostrar un toast de confirmación
    }
  }, [notification]);

  const handleShare = useCallback(() => {
    if (notification && navigator.share) {
      navigator.share({
        title: notification.title,
        text: notification.message,
        url: notification.actionUrl
      });
    }
  }, [notification]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (canNavigatePrev) {
            e.preventDefault();
            handleNavigate('prev');
          }
          break;
        case 'ArrowRight':
          if (canNavigateNext) {
            e.preventDefault();
            handleNavigate('next');
          }
          break;
        case 'Enter':
          if (notification?.status === NotificationStatus.UNREAD) {
            e.preventDefault();
            handleMarkAsRead();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, canNavigatePrev, canNavigateNext, handleNavigate, onClose, notification, handleMarkAsRead]);

  // Marcar como leído automáticamente después de unos segundos
  useEffect(() => {
    if (!isOpen || !notification || notification.status !== NotificationStatus.UNREAD) return;

    const timer = setTimeout(() => {
      handleMarkAsRead();
    }, 3000); // 3 segundos

    return () => clearTimeout(timer);
  }, [isOpen, notification, handleMarkAsRead]);

  if (!isOpen || !notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-glass-100 backdrop-blur-md rounded-xl border border-glass-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-glass-200">
          <div className="flex items-center space-x-3">
            {getNotificationIcon(notification.type, 'w-6 h-6')}
            <div>
              <h2 className="text-lg font-semibold text-white">
                Detalles de Notificación
              </h2>
              {notifications.length > 1 && (
                <p className="text-sm text-glass-300">
                  {currentIndex + 1} de {notifications.length}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Navegación */}
            {notifications.length > 1 && (
              <>
                <button
                  onClick={() => handleNavigate('prev')}
                  disabled={!canNavigatePrev}
                  className="p-2 text-glass-400 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Notificación anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleNavigate('next')}
                  disabled={!canNavigateNext}
                  className="p-2 text-glass-400 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Siguiente notificación"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="p-2 text-glass-400 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Status badges */}
          <div className="flex items-center space-x-2 mb-4">
            {/* Estado de lectura */}
            {notification.status === NotificationStatus.UNREAD && (
              <span className="px-2 py-1 text-xs font-medium bg-quantum-blue/20 text-quantum-blue rounded-full">
                Sin leer
              </span>
            )}

            {/* Prioridad */}
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(notification.priority)}`}>
              {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
            </span>

            {/* Categoría */}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(notification.category)}`}>
              {notification.category.charAt(0).toUpperCase() + notification.category.slice(1)}
            </span>
          </div>

          {/* Título */}
          <h3 className="text-xl font-semibold text-white mb-3">
            {notification.title}
          </h3>

          {/* Mensaje */}
          <div className="prose prose-invert max-w-none mb-6">
            <p className="text-glass-200 leading-relaxed whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-glass-50 rounded-lg">
            {/* Timestamp */}
            <div className="flex items-center space-x-2 text-sm">
              <Clock className="w-4 h-4 text-glass-400" />
              <div>
                <p className="text-glass-200">
                  {formatRelativeTime(notification.timestamp)}
                </p>
                <button
                  onClick={() => setShowFullDate(!showFullDate)}
                  className="text-xs text-glass-400 hover:text-glass-200 transition-colors duration-200"
                >
                  {showFullDate ? 'Mostrar relativo' : 'Mostrar fecha completa'}
                </button>
                {showFullDate && (
                  <p className="text-xs text-glass-300 mt-1">
                    {formatFullDate(notification.timestamp)}
                  </p>
                )}
              </div>
            </div>

            {/* Source */}
            {notification.source && (
              <div className="flex items-center space-x-2 text-sm">
                <Tag className="w-4 h-4 text-glass-400" />
                <div>
                  <p className="text-glass-300">Origen</p>
                  <p className="text-glass-200">{notification.source}</p>
                </div>
              </div>
            )}

            {/* User ID */}
            {notification.userId && (
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4 text-glass-400" />
                <div>
                  <p className="text-glass-300">Usuario</p>
                  <p className="text-glass-200">{notification.userId}</p>
                </div>
              </div>
            )}

            {/* Expiration */}
            {notification.expiresAt && (
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-glass-400" />
                <div>
                  <p className="text-glass-300">Expira</p>
                  <p className="text-glass-200">
                    {formatRelativeTime(notification.expiresAt)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Metadata adicional */}
          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-glass-300 mb-2">Información adicional</h4>
              <div className="bg-glass-50 rounded-lg p-3">
                <pre className="text-xs text-glass-200 overflow-x-auto">
                  {JSON.stringify(notification.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Related entity */}
          {notification.relatedEntityId && notification.relatedEntityType && (
            <div className="mb-6 p-3 bg-glass-50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <Link className="w-4 h-4 text-glass-400" />
                <div>
                  <p className="text-glass-300">Relacionado con</p>
                  <p className="text-glass-200">
                    {notification.relatedEntityType}: {notification.relatedEntityId}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con acciones */}
        <div className="p-6 border-t border-glass-200 bg-glass-50">
          <NotificationActions
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
            onArchive={handleArchive}
            onCopyLink={handleCopyLink}
            onShare={handleShare}
            isMarkingAsRead={isMarkingAsRead}
            isArchiving={isArchivingNotification}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;