import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { dashboardService } from '../services/dashboardService';
import { 
  DashboardData, 
  SystemStatus, 
  Task, 
  SystemMetrics, 
  TaskFilters 
} from '../types/dashboard';
import { Notification, NotificationFilters } from '../types/notifications';

// Claves de query para React Query
export const DASHBOARD_QUERY_KEYS = {
  dashboard: ['dashboard'] as const,
  dashboardData: () => [...DASHBOARD_QUERY_KEYS.dashboard, 'data'] as const,
  systemStatus: () => [...DASHBOARD_QUERY_KEYS.dashboard, 'system-status'] as const,
  userTasks: (filters?: TaskFilters) => [...DASHBOARD_QUERY_KEYS.dashboard, 'tasks', filters] as const,
  systemMetrics: () => [...DASHBOARD_QUERY_KEYS.dashboard, 'metrics'] as const,
  notifications: (filters?: NotificationFilters) => [...DASHBOARD_QUERY_KEYS.dashboard, 'notifications', filters] as const,
} as const;

// Configuración por defecto para queries
const DEFAULT_QUERY_CONFIG = {
  staleTime: 30 * 1000, // 30 segundos
  refetchInterval: 30 * 1000, // Auto-refresh cada 30 segundos
  refetchIntervalInBackground: false,
  refetchOnWindowFocus: true,
  retry: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
};

/**
 * Hook principal para obtener todos los datos del dashboard
 */
export const useDashboardData = (options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.dashboardData(),
    queryFn: () => dashboardService.getDashboardData(false), // No usar cache del servicio, React Query maneja el cache
    ...DEFAULT_QUERY_CONFIG,
    refetchInterval: options?.refetchInterval ?? DEFAULT_QUERY_CONFIG.refetchInterval,
    enabled: options?.enabled ?? true,
  });

  // Función para invalidar y refrescar datos
  const refresh = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: DASHBOARD_QUERY_KEYS.dashboardData(),
    });
  }, [queryClient]);

  // Función para actualizar datos manualmente
  const updateData = useCallback((updater: (oldData: DashboardData | undefined) => DashboardData) => {
    queryClient.setQueryData(DASHBOARD_QUERY_KEYS.dashboardData(), updater);
  }, [queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    isFetching: query.isFetching,
    refresh,
    updateData,
  };
};

/**
 * Hook para obtener el estado del sistema
 */
export const useSystemStatus = (options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.systemStatus(),
    queryFn: () => dashboardService.getSystemStatus(false),
    ...DEFAULT_QUERY_CONFIG,
    refetchInterval: options?.refetchInterval ?? 15 * 1000, // Más frecuente para estado del sistema
    enabled: options?.enabled ?? true,
  });

  const refresh = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: DASHBOARD_QUERY_KEYS.systemStatus(),
    });
  }, [queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    refresh,
  };
};

/**
 * Hook para obtener tareas del usuario
 */
export const useUserTasks = (
  filters?: TaskFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.userTasks(filters),
    queryFn: () => dashboardService.getUserTasks(filters, false),
    ...DEFAULT_QUERY_CONFIG,
    refetchInterval: options?.refetchInterval ?? DEFAULT_QUERY_CONFIG.refetchInterval,
    enabled: options?.enabled ?? true,
  });

  const refresh = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: DASHBOARD_QUERY_KEYS.userTasks(filters),
    });
  }, [queryClient, filters]);

  // Función para marcar tarea como completada
  const completeTask = useCallback(async (taskId: string) => {
    try {
      const updatedTask = await dashboardService.completeTask(taskId);
      
      // Actualizar cache optimísticamente
      queryClient.setQueryData(
        DASHBOARD_QUERY_KEYS.userTasks(filters),
        (oldTasks: Task[] | undefined) => {
          if (!oldTasks) return oldTasks;
          return oldTasks.map(task => 
            task.id === taskId ? updatedTask : task
          );
        }
      );

      // También invalidar datos completos del dashboard
      queryClient.invalidateQueries({
        queryKey: DASHBOARD_QUERY_KEYS.dashboardData(),
      });

      return updatedTask;
    } catch (error) {
      // En caso de error, invalidar para obtener datos frescos
      refresh();
      throw error;
    }
  }, [queryClient, filters, refresh]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    refresh,
    completeTask,
  };
};

/**
 * Hook para obtener métricas del sistema (solo administradores)
 */
export const useSystemMetrics = (options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.systemMetrics(),
    queryFn: () => dashboardService.getSystemMetrics(false),
    ...DEFAULT_QUERY_CONFIG,
    refetchInterval: options?.refetchInterval ?? 60 * 1000, // Cada minuto para métricas
    enabled: options?.enabled ?? true,
  });

  const refresh = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: DASHBOARD_QUERY_KEYS.systemMetrics(),
    });
  }, [queryClient]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    refresh,
  };
};

/**
 * Hook para obtener notificaciones
 */
export const useDashboardNotifications = (
  filters?: NotificationFilters,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.notifications(filters),
    queryFn: () => dashboardService.getNotifications(filters, false),
    ...DEFAULT_QUERY_CONFIG,
    refetchInterval: options?.refetchInterval ?? DEFAULT_QUERY_CONFIG.refetchInterval,
    enabled: options?.enabled ?? true,
  });

  const refresh = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: DASHBOARD_QUERY_KEYS.notifications(filters),
    });
  }, [queryClient, filters]);

  // Función para marcar notificación como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await dashboardService.markNotificationAsRead(notificationId);
      
      // Actualizar cache optimísticamente
      queryClient.setQueryData(
        DASHBOARD_QUERY_KEYS.notifications(filters),
        (oldNotifications: Notification[] | undefined) => {
          if (!oldNotifications) return oldNotifications;
          return oldNotifications.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          );
        }
      );

      // También invalidar datos completos del dashboard
      queryClient.invalidateQueries({
        queryKey: DASHBOARD_QUERY_KEYS.dashboardData(),
      });
    } catch (error) {
      // En caso de error, invalidar para obtener datos frescos
      refresh();
      throw error;
    }
  }, [queryClient, filters, refresh]);

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
    refresh,
    markAsRead,
  };
};

/**
 * Hook para invalidar todas las queries del dashboard
 */
export const useDashboardInvalidation = () => {
  const queryClient = useQueryClient();

  const invalidateAll = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: DASHBOARD_QUERY_KEYS.dashboard,
    });
  }, [queryClient]);

  const invalidateSystemStatus = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: DASHBOARD_QUERY_KEYS.systemStatus(),
    });
  }, [queryClient]);

  const invalidateTasks = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [...DASHBOARD_QUERY_KEYS.dashboard, 'tasks'],
    });
  }, [queryClient]);

  const invalidateNotifications = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: [...DASHBOARD_QUERY_KEYS.dashboard, 'notifications'],
    });
  }, [queryClient]);

  const invalidateMetrics = useCallback(() => {
    return queryClient.invalidateQueries({
      queryKey: DASHBOARD_QUERY_KEYS.systemMetrics(),
    });
  }, [queryClient]);

  return {
    invalidateAll,
    invalidateSystemStatus,
    invalidateTasks,
    invalidateNotifications,
    invalidateMetrics,
  };
};

/**
 * Hook para obtener el estado de salud del sistema
 */
export const useSystemHealth = (options?: {
  enabled?: boolean;
  refetchInterval?: number;
}) => {
  const query = useQuery({
    queryKey: [...DASHBOARD_QUERY_KEYS.dashboard, 'health'],
    queryFn: () => dashboardService.getSystemHealth(),
    staleTime: 10 * 1000, // 10 segundos
    refetchInterval: options?.refetchInterval ?? 30 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1, // Solo un retry para health check
    enabled: options?.enabled ?? true,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isRefetching: query.isRefetching,
  };
};

/**
 * Hook compuesto que combina múltiples queries para el dashboard completo
 */
export const useCompleteDashboard = (options?: {
  includeMetrics?: boolean;
  refetchInterval?: number;
}) => {
  const dashboardData = useDashboardData({
    refetchInterval: options?.refetchInterval,
  });

  const systemHealth = useSystemHealth({
    refetchInterval: options?.refetchInterval,
  });

  const systemMetrics = useSystemMetrics({
    enabled: options?.includeMetrics ?? false,
    refetchInterval: options?.refetchInterval,
  });

  const isLoading = dashboardData.isLoading || systemHealth.isLoading || 
    (options?.includeMetrics && systemMetrics.isLoading);

  const isError = dashboardData.isError || systemHealth.isError || 
    (options?.includeMetrics && systemMetrics.isError);

  const error = dashboardData.error || systemHealth.error || 
    (options?.includeMetrics ? systemMetrics.error : null);

  const refresh = useCallback(() => {
    const promises = [
      dashboardData.refresh(),
      systemHealth.isRefetching || systemHealth.refresh?.(),
    ];

    if (options?.includeMetrics) {
      promises.push(systemMetrics.refresh());
    }

    return Promise.all(promises.filter(Boolean));
  }, [dashboardData, systemHealth, systemMetrics, options?.includeMetrics]);

  return {
    dashboardData: dashboardData.data,
    systemHealth: systemHealth.data,
    systemMetrics: systemMetrics.data,
    isLoading,
    isError,
    error,
    isRefetching: dashboardData.isRefetching || systemHealth.isRefetching || systemMetrics.isRefetching,
    refresh,
  };
};