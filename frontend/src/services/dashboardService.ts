import { apiClient } from './authService';
import {
  DashboardData,
  DashboardApiResponse,
  SystemStatus,
  Task,
  SystemMetrics,
  DashboardConfig,
  TaskFilters
} from '../types/dashboard';
import { Notification, NotificationFilters } from '../types/notifications';

// Configuración del servicio
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos en millisegundos
const DEFAULT_REFRESH_INTERVAL = 30000; // 30 segundos

// Cache simple en memoria
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// Instancia del cache
const cache = new SimpleCache();

// Función para manejar errores de API
const handleApiError = (error: any, context: string) => {
  console.error(`Dashboard Service Error (${context}):`, error);
  
  if (error.response) {
    const { status, data } = error.response;
    switch (status) {
      case 403:
        throw new Error('No tienes permisos para acceder a esta información');
      case 404:
        throw new Error('Recurso no encontrado');
      case 429:
        throw new Error('Demasiadas solicitudes. Intenta en unos minutos');
      case 500:
        throw new Error('Error del servidor. Intenta nuevamente');
      default:
        throw new Error(data.message || 'Error desconocido del servidor');
    }
  } else if (error.request) {
    throw new Error('Error de conexión. Verifica tu internet');
  } else {
    throw new Error('Error inesperado. Intenta nuevamente');
  }
};

// Función para generar clave de cache
const getCacheKey = (endpoint: string, params?: any): string => {
  const paramString = params ? JSON.stringify(params) : '';
  return `${endpoint}_${paramString}`;
};

export const dashboardService = {
  /**
   * Obtener todos los datos del dashboard
   */
  async getDashboardData(useCache: boolean = true): Promise<DashboardData> {
    const cacheKey = getCacheKey('dashboard_data');
    
    if (useCache) {
      const cachedData = cache.get<DashboardData>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const response = await apiClient.get<DashboardApiResponse<DashboardData>>('/dashboard');
      const dashboardData = response.data.data;
      
      // Convertir strings de fecha a objetos Date
      dashboardData.systemStatus.lastSync = new Date(dashboardData.systemStatus.lastSync);
      dashboardData.userTasks = dashboardData.userTasks.map(task => ({
        ...task,
        dueDate: new Date(task.dueDate),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined
      }));
      if (dashboardData.notifications) {
        dashboardData.notifications = dashboardData.notifications.map(notification => ({
          ...notification,
          timestamp: new Date(notification.timestamp)
        }));
      }
      dashboardData.lastUpdated = new Date(response.data.timestamp);

      // Guardar en cache
      cache.set(cacheKey, dashboardData);
      
      return dashboardData;
    } catch (error) {
      handleApiError(error, 'getDashboardData');
      throw error;
    }
  },

  /**
   * Obtener estado del sistema
   */
  async getSystemStatus(useCache: boolean = true): Promise<SystemStatus> {
    const cacheKey = getCacheKey('system_status');
    
    if (useCache) {
      const cachedData = cache.get<SystemStatus>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const response = await apiClient.get<DashboardApiResponse<SystemStatus>>('/dashboard/system-status');
      const systemStatus = {
        ...response.data.data,
        lastSync: new Date(response.data.data.lastSync)
      };
      
      // Cache con TTL más corto para datos críticos
      cache.set(cacheKey, systemStatus, 30000); // 30 segundos
      
      return systemStatus;
    } catch (error) {
      handleApiError(error, 'getSystemStatus');
      throw error;
    }
  },

  /**
   * Obtener tareas del usuario
   */
  async getUserTasks(filters?: TaskFilters, useCache: boolean = true): Promise<Task[]> {
    const cacheKey = getCacheKey('user_tasks', filters);
    
    if (useCache) {
      const cachedData = cache.get<Task[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const params = filters ? { ...filters } : {};
      const response = await apiClient.get<DashboardApiResponse<Task[]>>('/dashboard/tasks', { params });
      
      const tasks = response.data.data.map(task => ({
        ...task,
        dueDate: new Date(task.dueDate),
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        completedAt: task.completedAt ? new Date(task.completedAt) : undefined
      }));
      
      cache.set(cacheKey, tasks);
      
      return tasks;
    } catch (error) {
      handleApiError(error, 'getUserTasks');
      throw error;
    }
  },

  /**
   * Obtener métricas del sistema (solo para administradores)
   */
  async getSystemMetrics(useCache: boolean = true): Promise<SystemMetrics> {
    const cacheKey = getCacheKey('system_metrics');
    
    if (useCache) {
      const cachedData = cache.get<SystemMetrics>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const response = await apiClient.get<DashboardApiResponse<SystemMetrics>>('/dashboard/metrics');
      const metrics = {
        ...response.data.data,
        timestamp: new Date(response.data.data.timestamp)
      };
      
      // Cache con TTL más corto para métricas
      cache.set(cacheKey, metrics, 60000); // 1 minuto
      
      return metrics;
    } catch (error) {
      handleApiError(error, 'getSystemMetrics');
      throw error;
    }
  },

  /**
   * Obtener notificaciones del usuario
   */
  async getNotifications(filters?: NotificationFilters, useCache: boolean = true): Promise<Notification[]> {
    const cacheKey = getCacheKey('notifications', filters);
    
    if (useCache) {
      const cachedData = cache.get<Notification[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }
    }

    try {
      const params = filters ? { ...filters } : {};
      const response = await apiClient.get<DashboardApiResponse<Notification[]>>('/dashboard/notifications', { params });
      
      const notifications = response.data.data.map(notification => ({
        ...notification,
        timestamp: new Date(notification.timestamp)
      }));
      
      cache.set(cacheKey, notifications);
      
      return notifications;
    } catch (error) {
      handleApiError(error, 'getNotifications');
      throw error;
    }
  },

  /**
   * Obtener configuración del dashboard del usuario
   */
  async getDashboardConfig(): Promise<DashboardConfig | null> {
    const cacheKey = getCacheKey('dashboard_config');
    
    const cachedData = cache.get<DashboardConfig>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    try {
      const response = await apiClient.get<DashboardApiResponse<DashboardConfig>>('/dashboard/config');
      const config = response.data.data;
      
      cache.set(cacheKey, config, CACHE_TTL * 2); // Cache más largo para configuración
      
      return config;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No hay configuración guardada, devolver null
        return null;
      }
      handleApiError(error, 'getDashboardConfig');
      throw error;
    }
  },

  /**
   * Guardar configuración del dashboard
   */
  async saveDashboardConfig(config: Partial<DashboardConfig>): Promise<DashboardConfig> {
    try {
      const response = await apiClient.post<DashboardApiResponse<DashboardConfig>>('/dashboard/config', config);
      const savedConfig = response.data.data;
      
      // Actualizar cache
      cache.set(getCacheKey('dashboard_config'), savedConfig, CACHE_TTL * 2);
      
      return savedConfig;
    } catch (error) {
      handleApiError(error, 'saveDashboardConfig');
      throw error;
    }
  },

  /**
   * Marcar tarea como completada
   */
  async completeTask(taskId: string): Promise<Task> {
    try {
      const response = await apiClient.patch<DashboardApiResponse<Task>>(`/dashboard/tasks/${taskId}/complete`);
      const updatedTask = {
        ...response.data.data,
        dueDate: new Date(response.data.data.dueDate),
        createdAt: new Date(response.data.data.createdAt),
        updatedAt: new Date(response.data.data.updatedAt),
        completedAt: response.data.data.completedAt ? new Date(response.data.data.completedAt) : undefined
      };
      
      // Invalidar cache de tareas
      this.invalidateTasksCache();
      
      return updatedTask;
    } catch (error) {
      handleApiError(error, 'completeTask');
      throw error;
    }
  },

  /**
   * Marcar notificación como leída
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.patch(`/dashboard/notifications/${notificationId}/read`);
      
      // Invalidar cache de notificaciones
      this.invalidateNotificationsCache();
    } catch (error) {
      handleApiError(error, 'markNotificationAsRead');
      throw error;
    }
  },

  /**
   * Obtener datos de salud del sistema
   */
  async getSystemHealth(): Promise<{ status: 'healthy' | 'degraded' | 'down'; details: any }> {
    try {
      const response = await apiClient.get('/dashboard/health');
      return response.data;
    } catch (error: any) {
      // Si el endpoint de salud falla, asumir que el sistema está caído
      return {
        status: 'down' as const,
        details: { error: 'Unable to reach health endpoint' }
      };
    }
  },

  /**
   * Invalidar cache específico
   */
  invalidateCache(key?: string): void {
    if (key) {
      cache.delete(key);
    } else {
      cache.clear();
    }
  },

  /**
   * Invalidar cache de tareas
   */
  invalidateTasksCache(): void {
    // Buscar y eliminar todas las claves relacionadas con tareas
    const keysToDelete: string[] = [];
    cache['cache'].forEach((_, key) => {
      if (key.includes('user_tasks') || key.includes('dashboard_data')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => cache.delete(key));
  },

  /**
   * Invalidar cache de notificaciones
   */
  invalidateNotificationsCache(): void {
    // Buscar y eliminar todas las claves relacionadas con notificaciones
    const keysToDelete: string[] = [];
    cache['cache'].forEach((_, key) => {
      if (key.includes('notifications') || key.includes('dashboard_data')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => cache.delete(key));
  },

  /**
   * Obtener estadísticas del cache (para debugging)
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: cache['cache'].size,
      keys: Array.from(cache['cache'].keys())
    };
  }
};

// Exportar constantes útiles
export const DASHBOARD_CONSTANTS = {
  CACHE_TTL,
  DEFAULT_REFRESH_INTERVAL,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
};