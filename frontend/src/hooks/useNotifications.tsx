import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from '../stores/authStore';
import {
  Notification,
  NotificationFilters,
  NotificationEvent,
  NotificationSettings,
  NotificationType,
  NotificationStatus,
  NotificationCategory
} from '../types/notifications';

// Claves de query para React Query
const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: (filters?: NotificationFilters) => [...NOTIFICATION_QUERY_KEYS.all, 'list', filters] as const,
  stats: () => [...NOTIFICATION_QUERY_KEYS.all, 'stats'] as const,
  settings: () => [...NOTIFICATION_QUERY_KEYS.all, 'settings'] as const,
  unreadCount: () => [...NOTIFICATION_QUERY_KEYS.all, 'unreadCount'] as const,
};

// Configuración de React Query para notificaciones
const NOTIFICATION_QUERY_CONFIG = {
  staleTime: 30 * 1000, // 30 segundos
  gcTime: 5 * 60 * 1000, // 5 minutos
  refetchInterval: 30 * 1000, // Auto-refresh cada 30 segundos
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  retry: 2,
};

// Hook principal para notificaciones
export const useNotifications = (filters?: NotificationFilters, options?: {
  enabled?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}) => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  
  const {
    enabled = isAuthenticated,
    autoRefresh = true,
    refreshInterval = NOTIFICATION_QUERY_CONFIG.refetchInterval
  } = options || {};

  // Estado local para eventos en tiempo real
  const [realtimeNotifications, setRealtimeNotifications] = useState<Notification[]>([]);
  const [isServiceInitialized, setIsServiceInitialized] = useState(false);

  // Query para obtener notificaciones
  const notificationsQuery = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(filters),
    queryFn: () => notificationService.getNotifications(filters),
    enabled,
    ...NOTIFICATION_QUERY_CONFIG,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Query para estadísticas
  const statsQuery = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.stats(),
    queryFn: () => notificationService.getStats(),
    enabled,
    staleTime: 60 * 1000, // 1 minuto
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: autoRefresh ? 60 * 1000 : false, // Cada minuto
  });

  // Inicializar servicio de notificaciones
  useEffect(() => {
    if (isAuthenticated && !isServiceInitialized) {
      notificationService.initialize()
        .then(() => {
          setIsServiceInitialized(true);
          setRealtimeNotifications(notificationService.getCachedNotifications());
        })
        .catch(error => {
          console.error('Failed to initialize notification service:', error);
        });
    }

    return () => {
      if (!isAuthenticated) {
        notificationService.cleanup();
        setIsServiceInitialized(false);
        setRealtimeNotifications([]);
      }
    };
  }, [isAuthenticated, isServiceInitialized]);

  // Suscribirse a eventos en tiempo real
  useEffect(() => {
    if (!isServiceInitialized) return;

    const handleNotificationEvent = (_event: NotificationEvent) => {
      // Actualizar cache de React Query
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
      
      // Actualizar notificaciones en tiempo real
      setRealtimeNotifications(notificationService.getCachedNotifications());
    };

    // Suscribirse a todos los tipos de eventos
    const eventTypes = ['new', 'updated', 'deleted', 'read', 'bulk_read'];
    eventTypes.forEach(eventType => {
      notificationService.addEventListener(eventType, handleNotificationEvent);
    });

    return () => {
      eventTypes.forEach(eventType => {
        notificationService.removeEventListener(eventType, handleNotificationEvent);
      });
    };
  }, [isServiceInitialized, queryClient]);

  // Combinar notificaciones de query y tiempo real
  const notifications = useMemo(() => {
    const queryNotifications = notificationsQuery.data || [];
    
    // Si tenemos notificaciones en tiempo real, usarlas como fuente principal
    if (realtimeNotifications.length > 0) {
      // Aplicar filtros si existen
      if (!filters) return realtimeNotifications;
      
      return realtimeNotifications.filter(notification => {
        if (filters.types && !filters.types.includes(notification.type)) return false;
        if (filters.priorities && !filters.priorities.includes(notification.priority)) return false;
        if (filters.categories && !filters.categories.includes(notification.category)) return false;
        if (filters.status && !filters.status.includes(notification.status)) return false;
        if (filters.dateFrom && notification.timestamp < filters.dateFrom) return false;
        if (filters.dateTo && notification.timestamp > filters.dateTo) return false;
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          const titleMatch = notification.title.toLowerCase().includes(searchLower);
          const messageMatch = notification.message.toLowerCase().includes(searchLower);
          if (!titleMatch && !messageMatch) return false;
        }
        return true;
      });
    }
    
    return queryNotifications;
  }, [notificationsQuery.data, realtimeNotifications, filters]);

  // Estadísticas derivadas
  const derivedStats = useMemo(() => {
    const stats = statsQuery.data;
    const realtimeCount = notificationService.getUnreadCount();
    
    return {
      ...stats,
      unread: realtimeCount > 0 ? realtimeCount : stats?.unread || 0,
      hasUnread: realtimeCount > 0 || (stats?.unread || 0) > 0
    };
  }, [statsQuery.data]);

  return {
    // Datos
    notifications,
    stats: derivedStats,
    
    // Estados de carga
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError || statsQuery.isError,
    error: notificationsQuery.error || statsQuery.error,
    isFetching: notificationsQuery.isFetching,
    isRefetching: notificationsQuery.isRefetching,
    
    // Estados del servicio
    isServiceInitialized,
    
    // Acciones
    refetch: notificationsQuery.refetch,
    refetchStats: statsQuery.refetch,
    
    // Metadatos
    lastUpdated: notificationsQuery.dataUpdatedAt,
    isEnabled: enabled
  };
};

// Hook para mutaciones de notificaciones
export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  // Marcar como leída
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
    onError: (error: any) => {
      console.error('Failed to mark notification as read:', error);
    }
  });

  // Marcar todas como leídas
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
    onError: (error: any) => {
      console.error('Failed to mark all notifications as read:', error);
    }
  });

  // Eliminar notificación
  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
    onError: (error: any) => {
      console.error('Failed to delete notification:', error);
    }
  });

  return {
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    
    // Estados de carga
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeletingNotification: deleteNotificationMutation.isPending,
    
    // Errores
    markAsReadError: markAsReadMutation.error,
    markAllAsReadError: markAllAsReadMutation.error,
    deleteNotificationError: deleteNotificationMutation.error
  };
};

// Hook para configuración de notificaciones
export const useNotificationSettings = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  // Query para obtener configuración
  const settingsQuery = useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.settings(),
    queryFn: () => notificationService.getSettings(),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 1
  });

  // Mutación para guardar configuración
  const saveSettingsMutation = useMutation({
    mutationFn: (settings: Partial<NotificationSettings>) => 
      notificationService.saveSettings(settings),
    onSuccess: (savedSettings) => {
      queryClient.setQueryData(NOTIFICATION_QUERY_KEYS.settings(), savedSettings);
    },
    onError: (error: any) => {
      console.error('Failed to save notification settings:', error);
    }
  });

  return {
    settings: settingsQuery.data,
    isLoadingSettings: settingsQuery.isLoading,
    settingsError: settingsQuery.error,
    
    saveSettings: saveSettingsMutation.mutate,
    isSavingSettings: saveSettingsMutation.isPending,
    saveSettingsError: saveSettingsMutation.error
  };
};

// Hook para filtros de notificaciones con estado local
export const useNotificationFilters = (initialFilters?: NotificationFilters) => {
  const [filters, setFilters] = useState<NotificationFilters>(initialFilters || {});

  // Actualizar filtro específico
  const updateFilter = useCallback(<K extends keyof NotificationFilters>(
    key: K, 
    value: NotificationFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Limpiar filtro específico
  const clearFilter = useCallback((key: keyof NotificationFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).length > 0;
  }, [filters]);

  // Contar filtros activos
  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(value => 
      value !== undefined && 
      value !== null && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  }, [filters]);

  return {
    filters,
    updateFilter,
    clearFilters,
    clearFilter,
    hasActiveFilters,
    activeFilterCount,
    setFilters
  };
};

// Hook para estadísticas avanzadas de notificaciones
export const useNotificationAnalytics = () => {
  const { notifications, stats } = useNotifications();

  const analytics = useMemo(() => {
    if (!notifications || notifications.length === 0) {
      return {
        totalCount: 0,
        unreadCount: 0,
        readRate: 0,
        averageResponseTime: 0,
        mostCommonType: null,
        mostCommonCategory: null,
        recentActivity: [],
        trends: {
          daily: [],
          weekly: [],
          monthly: []
        }
      };
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calcular estadísticas básicas
    const totalCount = notifications.length;
    const unreadCount = notifications.filter(n => n.status === NotificationStatus.UNREAD).length;
    const readRate = totalCount > 0 ? ((totalCount - unreadCount) / totalCount) * 100 : 0;

    // Encontrar tipos y categorías más comunes
    const typeCounts = notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<NotificationType, number>);

    const categoryCounts = notifications.reduce((acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1;
      return acc;
    }, {} as Record<NotificationCategory, number>);

    const mostCommonType = Object.entries(typeCounts).reduce((a, b) => 
      typeCounts[a[0] as NotificationType] > typeCounts[b[0] as NotificationType] ? a : b
    )?.[0] as NotificationType || null;

    const mostCommonCategory = Object.entries(categoryCounts).reduce((a, b) => 
      categoryCounts[a[0] as NotificationCategory] > categoryCounts[b[0] as NotificationCategory] ? a : b
    )?.[0] as NotificationCategory || null;

    // Actividad reciente (últimas 24 horas)
    const recentActivity = notifications
      .filter(n => n.timestamp >= oneDayAgo)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    // Tendencias por período
    const trends = {
      daily: notifications.filter(n => n.timestamp >= oneDayAgo).length,
      weekly: notifications.filter(n => n.timestamp >= oneWeekAgo).length,
      monthly: notifications.filter(n => n.timestamp >= oneMonthAgo).length
    };

    return {
      totalCount,
      unreadCount,
      readRate: Math.round(readRate * 100) / 100,
      averageResponseTime: 0, // Se calcularía con datos adicionales
      mostCommonType,
      mostCommonCategory,
      recentActivity,
      trends,
      typeCounts,
      categoryCounts
    };
  }, [notifications]);

  return {
    ...analytics,
    stats
  };
};

// Hook para notificaciones no leídas (optimizado para indicadores)
export const useUnreadNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    // Obtener conteo inicial
    const initialCount = notificationService.getUnreadCount();
    setUnreadCount(initialCount);
    setHasUnread(initialCount > 0);

    // Suscribirse a cambios
    const handleUnreadChange = () => {
      const count = notificationService.getUnreadCount();
      setUnreadCount(count);
      setHasUnread(count > 0);
    };

    notificationService.addEventListener('new', handleUnreadChange);
    notificationService.addEventListener('read', handleUnreadChange);
    notificationService.addEventListener('bulk_read', handleUnreadChange);
    notificationService.addEventListener('deleted', handleUnreadChange);

    return () => {
      notificationService.removeEventListener('new', handleUnreadChange);
      notificationService.removeEventListener('read', handleUnreadChange);
      notificationService.removeEventListener('bulk_read', handleUnreadChange);
      notificationService.removeEventListener('deleted', handleUnreadChange);
    };
  }, []);

  return {
    unreadCount,
    hasUnread,
    // Función helper para formatear el conteo
    formatCount: (maxDisplay: number = 99) => {
      if (unreadCount === 0) return '';
      if (unreadCount <= maxDisplay) return unreadCount.toString();
      return `${maxDisplay}+`;
    }
  };
};

// Exportar claves de query para uso externo
export { NOTIFICATION_QUERY_KEYS };