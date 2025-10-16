import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo } from 'react';
import { dashboardService } from '../services/dashboardService';
import { notificationService } from '../services/notificationService';
import {
  Task,
  TaskFilters
} from '../types/dashboard';
import { Notification, NotificationFilters } from '../types/notifications';
import { useAuthStore } from '../stores/authStore';

// Claves de query para React Query
export const DASHBOARD_QUERY_KEYS = {
  all: ['dashboard'] as const,
  data: () => [...DASHBOARD_QUERY_KEYS.all, 'data'] as const,
  systemStatus: () => [...DASHBOARD_QUERY_KEYS.all, 'systemStatus'] as const,
  tasks: (filters?: TaskFilters) => [...DASHBOARD_QUERY_KEYS.all, 'tasks', filters] as const,
  metrics: () => [...DASHBOARD_QUERY_KEYS.all, 'metrics'] as const,
  notifications: (filters?: NotificationFilters) => [...DASHBOARD_QUERY_KEYS.all, 'notifications', filters] as const,
  config: () => [...DASHBOARD_QUERY_KEYS.all, 'config'] as const,
};

// Configuración de React Query para dashboard
const DASHBOARD_QUERY_CONFIG = {
  staleTime: 30 * 1000, // 30 segundos
  gcTime: 5 * 60 * 1000, // 5 minutos (antes cacheTime)
  refetchInterval: 30 * 1000, // Auto-refresh cada 30 segundos
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

// Hook principal para datos del dashboard
export const useDashboardData = (options?: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enabled?: boolean;
}) => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    autoRefresh = true,
    refreshInterval = DASHBOARD_QUERY_CONFIG.refetchInterval,
    enabled = isAuthenticated
  } = options || {};

  // Query para obtener todos los datos del dashboard
  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    isRefetching
  } = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.data(),
    queryFn: () => dashboardService.getDashboardData(),
    enabled,
    ...DASHBOARD_QUERY_CONFIG,
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Función para invalidar y refrescar datos
  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.all });
    return refetch();
  }, [queryClient, refetch]);

  // Función para invalidar cache específico
  const invalidateCache = useCallback((key?: string) => {
    if (key) {
      queryClient.invalidateQueries({ queryKey: [key] });
    } else {
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.all });
    }
  }, [queryClient]);

  // Datos derivados del dashboard
  const derivedData = useMemo(() => {
    if (!dashboardData) {
      return {
        systemHealth: 'unknown' as const,
        tasksSummary: { total: 0, pending: 0, overdue: 0, completed: 0 },
        notificationsSummary: { total: 0, unread: 0 },
        isSystemHealthy: false,
        hasOverdueTasks: false,
        hasUnreadNotifications: false
      };
    }

    const now = new Date();
    const tasksSummary = {
      total: dashboardData.userTasks?.length || 0,
      pending: dashboardData.userTasks?.filter((t: Task) => t.status === 'pending').length || 0,
      overdue: dashboardData.userTasks?.filter((t: Task) => 
        t.status !== 'completed' && t.dueDate < now
      ).length || 0,
      completed: dashboardData.userTasks?.filter((t: Task) => t.status === 'completed').length || 0
    };

    const notificationsSummary = {
      total: dashboardData.notifications?.length || 0,
      unread: dashboardData.notifications?.filter((n: Notification) => n.status === 'unread').length || 0
    };

    const systemHealth = dashboardData.systemStatus?.isConnected
      ? dashboardData.systemStatus.performance === 'good' ? 'healthy' as const
        : dashboardData.systemStatus.performance === 'warning' ? 'warning' as const
        : 'critical' as const
      : 'down' as const;

    return {
      systemHealth,
      tasksSummary,
      notificationsSummary,
      isSystemHealthy: systemHealth === 'healthy',
      hasOverdueTasks: tasksSummary.overdue > 0,
      hasUnreadNotifications: notificationsSummary.unread > 0
    };
  }, [dashboardData]);

  return {
    // Datos principales
    data: dashboardData,
    systemStatus: dashboardData?.systemStatus,
    tasks: dashboardData?.userTasks || [],
    notifications: dashboardData?.notifications || [],
    metrics: dashboardData?.metrics,
    
    // Estados de carga
    isLoading,
    isError,
    error,
    isFetching,
    isRefetching,
    
    // Datos derivados
    ...derivedData,
    
    // Acciones
    refresh,
    invalidateCache,
    
    // Metadatos
    lastUpdated: dashboardData?.lastUpdated,
    isEnabled: enabled
  };
};

// Hook específico para estado del sistema
export const useSystemStatus = (options?: { 
  enabled?: boolean;
  refreshInterval?: number;
}) => {
  const { isAuthenticated } = useAuthStore();
  const { enabled = isAuthenticated, refreshInterval = 30000 } = options || {};

  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.systemStatus(),
    queryFn: () => dashboardService.getSystemStatus(),
    enabled,
    staleTime: 15 * 1000, // 15 segundos para datos críticos
    gcTime: 2 * 60 * 1000, // 2 minutos
    refetchInterval: refreshInterval,
    retry: 3,
  });
};

// Hook específico para tareas del usuario
export const useUserTasks = (filters?: TaskFilters, options?: {
  enabled?: boolean;
  refreshInterval?: number;
}) => {
  const { isAuthenticated } = useAuthStore();
  const { enabled = isAuthenticated, refreshInterval = 60000 } = options || {};

  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.tasks(filters),
    queryFn: () => dashboardService.getUserTasks(filters),
    enabled,
    ...DASHBOARD_QUERY_CONFIG,
    refetchInterval: refreshInterval,
  });

  // Datos derivados de las tareas
  const taskStats = useMemo(() => {
    const tasks = query.data || [];
    const now = new Date();
    
    return {
      total: tasks.length,
      byStatus: {
        pending: tasks.filter((t: Task) => t.status === 'pending').length,
        in_progress: tasks.filter((t: Task) => t.status === 'in_progress').length,
        completed: tasks.filter((t: Task) => t.status === 'completed').length
      },
      byPriority: {
        critical: tasks.filter((t: Task) => t.priority === 'critical').length,
        high: tasks.filter((t: Task) => t.priority === 'high').length,
        medium: tasks.filter((t: Task) => t.priority === 'medium').length,
        low: tasks.filter((t: Task) => t.priority === 'low').length
      },
      overdue: tasks.filter((t: Task) => t.status !== 'completed' && t.dueDate < now).length,
      dueToday: tasks.filter((t: Task) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return t.dueDate >= today && t.dueDate < tomorrow;
      }).length
    };
  }, [query.data]);

  return {
    ...query,
    tasks: query.data || [],
    stats: taskStats
  };
};

// Hook específico para métricas del sistema (solo administradores)
export const useSystemMetrics = (options?: {
  enabled?: boolean;
  refreshInterval?: number;
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { enabled = isAuthenticated && isAdmin, refreshInterval = 60000 } = options || {};

  return useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.metrics(),
    queryFn: () => dashboardService.getSystemMetrics(),
    enabled,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: refreshInterval,
    retry: 2,
  });
};

// Hook para notificaciones
export const useNotifications = (filters?: NotificationFilters, options?: {
  enabled?: boolean;
  refreshInterval?: number;
}) => {
  const { isAuthenticated } = useAuthStore();
  const { enabled = isAuthenticated, refreshInterval = 30000 } = options || {};

  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.notifications(filters),
    queryFn: () => notificationService.getNotifications(filters),
    enabled,
    ...DASHBOARD_QUERY_CONFIG,
    refetchInterval: refreshInterval,
  });

  // Estadísticas de notificaciones
  const notificationStats = useMemo(() => {
    const notifications = query.data || [];
    
    return {
      total: notifications.length,
      unread: notifications.filter((n: Notification) => n.status === 'unread').length,
      byType: {
        info: notifications.filter((n: Notification) => n.type === 'info').length,
        warning: notifications.filter((n: Notification) => n.type === 'warning').length,
        error: notifications.filter((n: Notification) => n.type === 'error').length,
        success: notifications.filter((n: Notification) => n.type === 'success').length
      },
      byPriority: {
        low: notifications.filter((n: Notification) => n.priority === 'low').length,
        medium: notifications.filter((n: Notification) => n.priority === 'medium').length,
        high: notifications.filter((n: Notification) => n.priority === 'high').length,
        critical: notifications.filter((n: Notification) => n.priority === 'critical').length
      }
    };
  }, [query.data]);

  return {
    ...query,
    notifications: query.data || [],
    stats: notificationStats
  };
};

// Hook para mutaciones de tareas
export const useTaskMutations = () => {
  const queryClient = useQueryClient();

  const completeTaskMutation = useMutation({
    mutationFn: (taskId: string) => dashboardService.completeTask(taskId),
    onSuccess: (updatedTask) => {
      // Actualizar cache de tareas
      queryClient.setQueryData(
        DASHBOARD_QUERY_KEYS.tasks(),
        (oldTasks: Task[] | undefined) => {
          if (!oldTasks) return [updatedTask];
          return oldTasks.map(task => 
            task.id === updatedTask.id ? updatedTask : task
          );
        }
      );
      
      // Invalidar datos del dashboard
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.data() });
    },
    onError: (error: any) => {
      console.error('Complete task error:', error);
    }
  });

  return {
    completeTask: completeTaskMutation.mutate,
    isCompletingTask: completeTaskMutation.isPending,
    completeTaskError: completeTaskMutation.error
  };
};

// Hook para mutaciones de notificaciones
export const useNotificationMutations = () => {
  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: (_, notificationId) => {
      // Actualizar cache de notificaciones
      queryClient.setQueryData(
        DASHBOARD_QUERY_KEYS.notifications(),
        (oldNotifications: Notification[] | undefined) => {
          if (!oldNotifications) return [];
          return oldNotifications.map(notification => 
            notification.id === notificationId 
              ? { ...notification, status: 'read' as const, isRead: true }
              : notification
          );
        }
      );
      
      // Invalidar datos del dashboard
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.data() });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      // Invalidar todas las queries de notificaciones
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.notifications() });
      queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.data() });
    }
  });

  return {
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending
  };
};

// Hook para configuración del dashboard
export const useDashboardConfig = () => {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const configQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.config(),
    queryFn: () => dashboardService.getDashboardConfig(),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
    retry: 1
  });

  const saveConfigMutation = useMutation({
    mutationFn: (config: any) => dashboardService.saveDashboardConfig(config),
    onSuccess: (savedConfig) => {
      queryClient.setQueryData(DASHBOARD_QUERY_KEYS.config(), savedConfig);
    }
  });

  return {
    config: configQuery.data,
    isLoadingConfig: configQuery.isLoading,
    saveConfig: saveConfigMutation.mutate,
    isSavingConfig: saveConfigMutation.isPending,
    saveConfigError: saveConfigMutation.error
  };
};

// Hook para inicializar servicios de dashboard
export const useInitializeDashboard = () => {
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      // Inicializar servicio de notificaciones
      notificationService.initialize().catch(error => {
        console.error('Failed to initialize notification service:', error);
      });
    }

    return () => {
      // Cleanup al desmontar
      if (!isAuthenticated) {
        notificationService.cleanup();
      }
    };
  }, [isAuthenticated]);
};