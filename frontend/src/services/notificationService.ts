import { apiClient } from './authService';
import {
  Notification,
  NotificationFilters,
  NotificationResponse,
  NotificationStats,
  NotificationEvent,
  NotificationSettings,
  NotificationServiceConfig,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  NotificationCategory
} from '../types/notifications';

// Configuración del servicio de notificaciones
const DEFAULT_CONFIG: NotificationServiceConfig = {
  pollingInterval: 30000, // 30 segundos
  maxRetries: 3,
  retryDelay: 2000,
  enableWebSocket: true,
  webSocketUrl: (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:3001/ws',
  enablePersistence: true,
  maxCacheSize: 1000,
  cacheTTL: 5 * 60 * 1000 // 5 minutos
};

// Cache local para notificaciones
interface NotificationCache {
  notifications: Map<string, Notification>;
  stats: NotificationStats | null;
  lastFetch: Date | null;
  unreadCount: number;
}

class NotificationManager {
  private cache: NotificationCache = {
    notifications: new Map(),
    stats: null,
    lastFetch: null,
    unreadCount: 0
  };

  private config: NotificationServiceConfig;
  private pollingTimer: NodeJS.Timeout | null = null;
  private websocket: WebSocket | null = null;
  private eventListeners: Map<string, ((event: NotificationEvent) => void)[]> = new Map();
  private isPolling = false;

  constructor(config: Partial<NotificationServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeEventListeners();
  }

  private initializeEventListeners(): void {
    // Limpiar al cerrar la ventana
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Reconectar WebSocket cuando se recupere la conexión
    window.addEventListener('online', () => {
      if (this.config.enableWebSocket && !this.websocket) {
        this.connectWebSocket();
      }
    });

    // Pausar polling cuando se pierde la conexión
    window.addEventListener('offline', () => {
      this.stopPolling();
      this.disconnectWebSocket();
    });
  }

  /**
   * Inicializar el servicio de notificaciones
   */
  async initialize(): Promise<void> {
    try {
      // Cargar notificaciones iniciales
      await this.fetchNotifications();

      // Iniciar WebSocket si está habilitado
      if (this.config.enableWebSocket) {
        this.connectWebSocket();
      }

      // Iniciar polling como fallback
      this.startPolling();

      console.log('Notification service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      // Continuar con polling aunque falle la inicialización
      this.startPolling();
    }
  }

  /**
   * Conectar WebSocket para notificaciones en tiempo real
   */
  private connectWebSocket(): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const wsUrl = `${this.config.webSocketUrl}?token=${token}`;
      
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('WebSocket connected for notifications');
        // Reducir frecuencia de polling cuando WebSocket está activo
        if (this.pollingTimer) {
          this.stopPolling();
          this.startPolling(this.config.pollingInterval * 2);
        }
      };

      this.websocket.onmessage = (event) => {
        try {
          const notificationEvent: NotificationEvent = JSON.parse(event.data);
          this.handleNotificationEvent(notificationEvent);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.websocket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.websocket = null;
        
        // Reconectar después de un delay si no fue intencional
        if (event.code !== 1000) {
          setTimeout(() => {
            if (navigator.onLine) {
              this.connectWebSocket();
            }
          }, 5000);
        }

        // Restaurar polling normal
        if (this.pollingTimer) {
          this.stopPolling();
          this.startPolling();
        }
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  /**
   * Desconectar WebSocket
   */
  private disconnectWebSocket(): void {
    if (this.websocket) {
      this.websocket.close(1000, 'Manual disconnect');
      this.websocket = null;
    }
  }

  /**
   * Iniciar polling de notificaciones
   */
  private startPolling(interval: number = this.config.pollingInterval): void {
    if (this.isPolling) {
      return;
    }

    this.isPolling = true;
    this.pollingTimer = setInterval(async () => {
      try {
        await this.fetchNotifications(true);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);
  }

  /**
   * Detener polling
   */
  private stopPolling(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isPolling = false;
  }

  /**
   * Manejar eventos de notificación en tiempo real
   */
  private handleNotificationEvent(event: NotificationEvent): void {
    const { type, notification } = event;

    switch (type) {
      case 'new':
        this.cache.notifications.set(notification.id, notification);
        if (notification.status === NotificationStatus.UNREAD) {
          this.cache.unreadCount++;
        }
        break;

      case 'updated':
        const existing = this.cache.notifications.get(notification.id);
        if (existing && existing.status === NotificationStatus.UNREAD && 
            notification.status === NotificationStatus.READ) {
          this.cache.unreadCount = Math.max(0, this.cache.unreadCount - 1);
        }
        this.cache.notifications.set(notification.id, notification);
        break;

      case 'deleted':
        const deleted = this.cache.notifications.get(notification.id);
        if (deleted?.status === NotificationStatus.UNREAD) {
          this.cache.unreadCount = Math.max(0, this.cache.unreadCount - 1);
        }
        this.cache.notifications.delete(notification.id);
        break;

      case 'read':
        const read = this.cache.notifications.get(notification.id);
        if (read && read.status === NotificationStatus.UNREAD) {
          read.status = NotificationStatus.READ;
          this.cache.unreadCount = Math.max(0, this.cache.unreadCount - 1);
        }
        break;
    }

    // Notificar a los listeners
    this.emitEvent(type, event);

    // Limpiar cache si excede el tamaño máximo
    if (this.cache.notifications.size > this.config.maxCacheSize) {
      this.cleanupCache();
    }
  }

  /**
   * Limpiar cache manteniendo las notificaciones más recientes
   */
  private cleanupCache(): void {
    const notifications = Array.from(this.cache.notifications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, this.config.maxCacheSize * 0.8); // Mantener 80% del límite

    this.cache.notifications.clear();
    notifications.forEach(n => this.cache.notifications.set(n.id, n));
  }

  /**
   * Obtener notificaciones del servidor
   */
  async fetchNotifications(silent: boolean = false): Promise<Notification[]> {
    try {
      const params: any = {
        limit: 100,
        includeRead: true
      };

      // Solo obtener notificaciones nuevas si tenemos cache
      if (this.cache.lastFetch && silent) {
        params.since = this.cache.lastFetch.toISOString();
      }

      const response = await apiClient.get<NotificationResponse>('/notifications', { params });
      const { notifications, unreadCount } = response.data;

      // Convertir strings de fecha a objetos Date
      const processedNotifications = notifications.map(n => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));

      // Actualizar cache
      if (!silent) {
        this.cache.notifications.clear();
      }

      processedNotifications.forEach(n => {
        this.cache.notifications.set(n.id, n);
      });

      this.cache.unreadCount = unreadCount;
      this.cache.lastFetch = new Date();

      return processedNotifications;

    } catch (error: any) {
      console.error('Failed to fetch notifications:', error);
      
      // Devolver cache si hay error de red
      if (error.code === 'NETWORK_ERROR' && this.cache.notifications.size > 0) {
        return Array.from(this.cache.notifications.values());
      }
      
      throw error;
    }
  }

  /**
   * Obtener notificaciones con filtros
   */
  async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    try {
      const params: any = {};

      if (filters) {
        if (filters.types?.length) {
          params.types = filters.types.join(',');
        }
        if (filters.priorities?.length) {
          params.priorities = filters.priorities.join(',');
        }
        if (filters.categories?.length) {
          params.categories = filters.categories.join(',');
        }
        if (filters.status?.length) {
          params.status = filters.status.join(',');
        }
        if (filters.dateFrom) {
          params.dateFrom = filters.dateFrom.toISOString();
        }
        if (filters.dateTo) {
          params.dateTo = filters.dateTo.toISOString();
        }
        if (filters.searchTerm) {
          params.search = filters.searchTerm;
        }
      }

      const response = await apiClient.get<NotificationResponse>('/notifications', { params });
      
      return response.data.notifications.map(n => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));

    } catch (error: any) {
      console.error('Failed to get filtered notifications:', error);
      throw error;
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
      
      // Actualizar cache local
      const notification = this.cache.notifications.get(notificationId);
      if (notification && notification.status === NotificationStatus.UNREAD) {
        notification.status = NotificationStatus.READ;
        this.cache.unreadCount = Math.max(0, this.cache.unreadCount - 1);
        
        // Emitir evento
        this.emitEvent('read', {
          type: 'read',
          notification,
          timestamp: new Date()
        });
      }

    } catch (error: any) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.patch('/notifications/read-all');
      
      // Actualizar cache local
      this.cache.notifications.forEach(notification => {
        if (notification.status === NotificationStatus.UNREAD) {
          notification.status = NotificationStatus.READ;
        }
      });
      
      this.cache.unreadCount = 0;

      // Emitir evento
      this.emitEvent('bulk_read', {
        type: 'updated',
        notification: {} as Notification, // Placeholder
        timestamp: new Date()
      });

    } catch (error: any) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Eliminar notificación
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      
      // Actualizar cache local
      const notification = this.cache.notifications.get(notificationId);
      if (notification) {
        if (notification.status === NotificationStatus.UNREAD) {
          this.cache.unreadCount = Math.max(0, this.cache.unreadCount - 1);
        }
        this.cache.notifications.delete(notificationId);
        
        // Emitir evento
        this.emitEvent('deleted', {
          type: 'deleted',
          notification,
          timestamp: new Date()
        });
      }

    } catch (error: any) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  async getStats(): Promise<NotificationStats> {
    try {
      const response = await apiClient.get<NotificationStats>('/notifications/stats');
      this.cache.stats = response.data;
      return response.data;

    } catch (error: any) {
      console.error('Failed to get notification stats:', error);
      
      // Calcular estadísticas desde cache si hay error
      if (this.cache.notifications.size > 0) {
        const notifications = Array.from(this.cache.notifications.values());
        const stats: NotificationStats = {
          total: notifications.length,
          unread: this.cache.unreadCount,
          byType: {} as Record<NotificationType, number>,
          byPriority: {} as Record<NotificationPriority, number>,
          byCategory: {} as Record<NotificationCategory, number>,
          todayCount: 0,
          weekCount: 0,
          monthCount: 0
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        notifications.forEach(n => {
          // Contar por tipo
          stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
          
          // Contar por prioridad
          stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1;
          
          // Contar por categoría
          stats.byCategory[n.category] = (stats.byCategory[n.category] || 0) + 1;
          
          // Contar por período
          if (n.timestamp >= today) stats.todayCount++;
          if (n.timestamp >= weekAgo) stats.weekCount++;
          if (n.timestamp >= monthAgo) stats.monthCount++;
        });

        return stats;
      }
      
      throw error;
    }
  }

  /**
   * Obtener configuración de notificaciones del usuario
   */
  async getSettings(): Promise<NotificationSettings | null> {
    try {
      const response = await apiClient.get<NotificationSettings>('/notifications/settings');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No hay configuración guardada
      }
      console.error('Failed to get notification settings:', error);
      throw error;
    }
  }

  /**
   * Guardar configuración de notificaciones
   */
  async saveSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const response = await apiClient.post<NotificationSettings>('/notifications/settings', settings);
      return response.data;
    } catch (error: any) {
      console.error('Failed to save notification settings:', error);
      throw error;
    }
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  getUnreadCount(): number {
    return this.cache.unreadCount;
  }

  /**
   * Obtener notificaciones desde cache
   */
  getCachedNotifications(): Notification[] {
    return Array.from(this.cache.notifications.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Suscribirse a eventos de notificaciones
   */
  addEventListener(eventType: string, callback: (event: NotificationEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Desuscribirse de eventos
   */
  removeEventListener(eventType: string, callback: (event: NotificationEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emitir evento a los listeners
   */
  private emitEvent(eventType: string, event: NotificationEvent): void {
    const listeners = this.eventListeners.get(eventType) || [];
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in notification event listener:', error);
      }
    });
  }

  /**
   * Limpiar recursos
   */
  cleanup(): void {
    this.stopPolling();
    this.disconnectWebSocket();
    this.eventListeners.clear();
    this.cache.notifications.clear();
  }
}

// Instancia singleton del servicio
let notificationManager: NotificationManager | null = null;

export const notificationService = {
  /**
   * Inicializar el servicio de notificaciones
   */
  async initialize(config?: Partial<NotificationServiceConfig>): Promise<void> {
    if (!notificationManager) {
      notificationManager = new NotificationManager(config);
    }
    await notificationManager.initialize();
  },

  /**
   * Obtener notificaciones
   */
  async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    if (!notificationManager) {
      throw new Error('Notification service not initialized');
    }
    return notificationManager.getNotifications(filters);
  },

  /**
   * Marcar como leída
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (!notificationManager) {
      throw new Error('Notification service not initialized');
    }
    return notificationManager.markAsRead(notificationId);
  },

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(): Promise<void> {
    if (!notificationManager) {
      throw new Error('Notification service not initialized');
    }
    return notificationManager.markAllAsRead();
  },

  /**
   * Eliminar notificación
   */
  async deleteNotification(notificationId: string): Promise<void> {
    if (!notificationManager) {
      throw new Error('Notification service not initialized');
    }
    return notificationManager.deleteNotification(notificationId);
  },

  /**
   * Obtener estadísticas
   */
  async getStats(): Promise<NotificationStats> {
    if (!notificationManager) {
      throw new Error('Notification service not initialized');
    }
    return notificationManager.getStats();
  },

  /**
   * Obtener configuración
   */
  async getSettings(): Promise<NotificationSettings | null> {
    if (!notificationManager) {
      throw new Error('Notification service not initialized');
    }
    return notificationManager.getSettings();
  },

  /**
   * Guardar configuración
   */
  async saveSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    if (!notificationManager) {
      throw new Error('Notification service not initialized');
    }
    return notificationManager.saveSettings(settings);
  },

  /**
   * Obtener conteo no leídas
   */
  getUnreadCount(): number {
    return notificationManager?.getUnreadCount() || 0;
  },

  /**
   * Obtener notificaciones en cache
   */
  getCachedNotifications(): Notification[] {
    return notificationManager?.getCachedNotifications() || [];
  },

  /**
   * Suscribirse a eventos
   */
  addEventListener(eventType: string, callback: (event: NotificationEvent) => void): void {
    if (!notificationManager) {
      throw new Error('Notification service not initialized');
    }
    notificationManager.addEventListener(eventType, callback);
  },

  /**
   * Desuscribirse de eventos
   */
  removeEventListener(eventType: string, callback: (event: NotificationEvent) => void): void {
    if (!notificationManager) {
      return;
    }
    notificationManager.removeEventListener(eventType, callback);
  },

  /**
   * Limpiar servicio
   */
  cleanup(): void {
    if (notificationManager) {
      notificationManager.cleanup();
      notificationManager = null;
    }
  }
};

// Exportar configuración por defecto
export { DEFAULT_CONFIG as NOTIFICATION_CONFIG };