import { apiClient } from './authService';
import {
  Notification,
  NotificationEvent,
  NotificationFilters,
  NotificationResponse,
  NotificationStats,
  NotificationServiceConfig,
  NotificationSettings,
  NotificationStatus
} from '../types/notifications';

// Configuración del servicio de notificaciones
const NOTIFICATION_CONFIG: NotificationServiceConfig = {
  pollingInterval: 30000, // 30 segundos
  maxRetries: 3,
  retryDelay: 2000,
  enableWebSocket: true,
  webSocketUrl: (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:3001/ws',
  enablePersistence: true,
  maxCacheSize: 1000,
  cacheTTL: 300000, // 5 minutos
};

// Tipos para eventos de WebSocket
interface WebSocketMessage {
  type: 'notification' | 'ping' | 'error' | 'connected';
  data?: NotificationEvent | any;
  timestamp: string;
}

// Cache local para notificaciones
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class NotificationCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;

  constructor(maxSize: number = NOTIFICATION_CONFIG.maxCacheSize) {
    this.maxSize = maxSize;
  }

  set(key: string, data: any, ttl: number = NOTIFICATION_CONFIG.cacheTTL): void {
    // Limpiar cache si está lleno
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Eliminar entradas expiradas
    entries.forEach(([key, entry]) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    });

    // Si aún está lleno, eliminar las más antiguas
    if (this.cache.size >= this.maxSize) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key))
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = sortedEntries.slice(0, Math.floor(this.maxSize * 0.2));
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instancia del cache
const notificationCache = new NotificationCache();

// Persistencia local usando localStorage
class NotificationPersistence {
  private readonly storageKey = 'quantum_notifications';
  private readonly settingsKey = 'quantum_notification_settings';
  private readonly maxStoredNotifications = 500;

  saveNotifications(notifications: Notification[]): void {
    if (!NOTIFICATION_CONFIG.enablePersistence) return;

    try {
      // Mantener solo las notificaciones más recientes
      const toStore = notifications
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, this.maxStoredNotifications);

      localStorage.setItem(this.storageKey, JSON.stringify({
        notifications: toStore,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.warn('Error saving notifications to localStorage:', error);
    }
  }

  loadNotifications(): Notification[] {
    if (!NOTIFICATION_CONFIG.enablePersistence) return [];

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      const { notifications, timestamp } = JSON.parse(stored);
      
      // Verificar que no sean muy antiguas (máximo 24 horas)
      if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
        this.clearNotifications();
        return [];
      }

      return notifications.map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
    } catch (error) {
      console.warn('Error loading notifications from localStorage:', error);
      return [];
    }
  }

  saveSettings(settings: NotificationSettings): void {
    if (!NOTIFICATION_CONFIG.enablePersistence) return;

    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    } catch (error) {
      console.warn('Error saving notification settings:', error);
    }
  }

  loadSettings(): NotificationSettings | null {
    if (!NOTIFICATION_CONFIG.enablePersistence) return null;

    try {
      const stored = localStorage.getItem(this.settingsKey);
      if (!stored) return null;

      const settings = JSON.parse(stored);
      return {
        ...settings,
        updatedAt: new Date(settings.updatedAt)
      };
    } catch (error) {
      console.warn('Error loading notification settings:', error);
      return null;
    }
  }

  clearNotifications(): void {
    localStorage.removeItem(this.storageKey);
  }

  clearSettings(): void {
    localStorage.removeItem(this.settingsKey);
  }

  clearAll(): void {
    this.clearNotifications();
    this.clearSettings();
  }
}

// Instancia de persistencia
const persistence = new NotificationPersistence();

// Clase para manejo de WebSocket
class NotificationWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventListeners: Map<string, Set<(event: NotificationEvent) => void>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.eventListeners.set('notification', new Set());
    this.eventListeners.set('connected', new Set());
    this.eventListeners.set('disconnected', new Set());
    this.eventListeners.set('error', new Set());
  }

  connect(): Promise<void> {
    if (!NOTIFICATION_CONFIG.enableWebSocket || this.isConnecting) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        const token = localStorage.getItem('accessToken');
        const wsUrl = `${NOTIFICATION_CONFIG.webSocketUrl}?token=${token}`;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected for notifications');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected', null);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.warn('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.stopHeartbeat();
          this.emit('disconnected', null);
          
          // Intentar reconectar si no fue un cierre intencional
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.emit('error', error);
          reject(error);
        };

        // Timeout para la conexión
        setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.stopHeartbeat();
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'notification':
        if (message.data) {
          this.emit('notification', message.data);
        }
        break;
      case 'ping':
        // Responder al ping del servidor
        this.send({ type: 'pong', timestamp: new Date().toISOString() });
        break;
      case 'error':
        console.error('WebSocket server error:', message.data);
        this.emit('error', message.data);
        break;
    }
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping', timestamp: new Date().toISOString() });
    }, 30000); // Ping cada 30 segundos
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('WebSocket reconnect failed:', error);
      });
    }, delay);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  on(event: string, listener: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: string, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Instancia de WebSocket
const notificationWS = new NotificationWebSocket();

// Función para retry con backoff exponencial
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = NOTIFICATION_CONFIG.maxRetries,
  baseDelay: number = NOTIFICATION_CONFIG.retryDelay
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }

      // No reintentar en errores de autenticación
      if (error.response?.status === 401 || error.response?.status === 403) {
        break;
      }

      const jitter = Math.random() * 0.1 * baseDelay;
      const delay = (baseDelay * Math.pow(2, attempt)) + jitter;
      
      console.warn(`Notification request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Función para manejo de errores
const handleNotificationError = (error: any, context: string) => {
  console.error(`Notification Service Error (${context}):`, error);

  if (error.response) {
    const { status } = error.response;
    switch (status) {
      case 401:
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
      case 403:
        throw new Error('No tienes permisos para acceder a las notificaciones.');
      case 404:
        throw new Error('Servicio de notificaciones no encontrado.');
      case 429:
        throw new Error('Demasiadas solicitudes. Intenta nuevamente en unos momentos.');
      case 500:
        throw new Error('Error interno del servidor de notificaciones.');
      case 503:
        throw new Error('Servicio de notificaciones no disponible temporalmente.');
      default:
        throw new Error(`Error de notificaciones: HTTP ${status}`);
    }
  }

  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    throw new Error('No se puede conectar con el servicio de notificaciones.');
  }

  throw new Error('Error de conexión con el servicio de notificaciones.');
};

// Servicio principal de notificaciones
export const notificationService = {
  /**
   * Inicializar el servicio de notificaciones
   */
  async initialize(): Promise<void> {
    try {
      // Conectar WebSocket si está habilitado
      if (NOTIFICATION_CONFIG.enableWebSocket) {
        await notificationWS.connect();
      }

      // Configurar listeners de WebSocket
      notificationWS.on('notification', (event: NotificationEvent) => {
        this.handleRealtimeNotification(event);
      });

      console.log('Notification service initialized');
    } catch (error) {
      console.warn('Failed to initialize WebSocket, falling back to polling:', error);
    }
  },

  /**
   * Obtener notificaciones con filtros
   */
  async getNotifications(
    filters?: NotificationFilters,
    useCache: boolean = true
  ): Promise<NotificationResponse> {
    const cacheKey = `notifications-${JSON.stringify(filters || {})}`;
    
    // Intentar obtener desde cache primero
    if (useCache) {
      const cached = notificationCache.get<NotificationResponse>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const operation = async () => {
        const params: any = {
          limit: 50,
          offset: 0
        };

        // Aplicar filtros
        if (filters?.types?.length) {
          params.types = filters.types.join(',');
        }
        if (filters?.priorities?.length) {
          params.priorities = filters.priorities.join(',');
        }
        if (filters?.categories?.length) {
          params.categories = filters.categories.join(',');
        }
        if (filters?.status?.length) {
          params.status = filters.status.join(',');
        }
        if (filters?.dateFrom) {
          params.dateFrom = filters.dateFrom.toISOString();
        }
        if (filters?.dateTo) {
          params.dateTo = filters.dateTo.toISOString();
        }
        if (filters?.searchTerm) {
          params.search = filters.searchTerm;
        }

        const response = await apiClient.get<NotificationResponse>('/notifications', {
          params,
          timeout: 10000
        });

        return response.data;
      };

      const result = await retryWithBackoff(operation);

      // Procesar notificaciones
      const processedNotifications = result.notifications.map(notification => ({
        ...notification,
        timestamp: new Date(notification.timestamp)
      }));

      const processedResult = {
        ...result,
        notifications: processedNotifications
      };

      // Guardar en cache
      notificationCache.set(cacheKey, processedResult, 60000); // 1 minuto

      // Persistir localmente
      persistence.saveNotifications(processedNotifications);

      return processedResult;

    } catch (error: any) {
      handleNotificationError(error, 'getNotifications');
      
      // Intentar devolver datos persistidos si hay error
      const persistedNotifications = persistence.loadNotifications();
      if (persistedNotifications.length > 0) {
        console.warn('Returning persisted notifications due to error:', error.message);
        return {
          notifications: persistedNotifications,
          totalCount: persistedNotifications.length,
          unreadCount: persistedNotifications.filter(n => n.status === NotificationStatus.UNREAD).length,
          hasMore: false
        };
      }
      
      throw error;
    }
  },

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const operation = async () => {
        await apiClient.patch(`/notifications/${notificationId}/read`, {}, {
          timeout: 5000
        });
      };

      await retryWithBackoff(operation);

      // Limpiar cache relacionado
      this.clearCache();

    } catch (error: any) {
      handleNotificationError(error, 'markAsRead');
      throw error;
    }
  },

  /**
   * Marcar múltiples notificaciones como leídas
   */
  async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    try {
      const operation = async () => {
        await apiClient.patch('/notifications/read-multiple', {
          notificationIds
        }, {
          timeout: 10000
        });
      };

      await retryWithBackoff(operation);

      // Limpiar cache relacionado
      this.clearCache();

    } catch (error: any) {
      handleNotificationError(error, 'markMultipleAsRead');
      throw error;
    }
  },

  /**
   * Archivar notificación
   */
  async archiveNotification(notificationId: string): Promise<void> {
    try {
      const operation = async () => {
        await apiClient.patch(`/notifications/${notificationId}/archive`, {}, {
          timeout: 5000
        });
      };

      await retryWithBackoff(operation);

      // Limpiar cache relacionado
      this.clearCache();

    } catch (error: any) {
      handleNotificationError(error, 'archiveNotification');
      throw error;
    }
  },

  /**
   * Obtener estadísticas de notificaciones
   */
  async getNotificationStats(useCache: boolean = true): Promise<NotificationStats> {
    const cacheKey = 'notification-stats';
    
    if (useCache) {
      const cached = notificationCache.get<NotificationStats>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const operation = async () => {
        const response = await apiClient.get<NotificationStats>('/notifications/stats', {
          timeout: 5000
        });
        return response.data;
      };

      const stats = await retryWithBackoff(operation);

      // Guardar en cache
      notificationCache.set(cacheKey, stats, 30000); // 30 segundos

      return stats;

    } catch (error: any) {
      handleNotificationError(error, 'getNotificationStats');
      throw error;
    }
  },

  /**
   * Obtener configuración de notificaciones del usuario
   */
  async getNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const operation = async () => {
        const response = await apiClient.get<NotificationSettings>('/notifications/settings', {
          timeout: 5000
        });
        return response.data;
      };

      const settings = await retryWithBackoff(operation);
      
      // Persistir configuración
      persistence.saveSettings(settings);

      return {
        ...settings,
        updatedAt: new Date(settings.updatedAt)
      };

    } catch (error: any) {
      // Si hay error, intentar cargar desde persistencia
      const persistedSettings = persistence.loadSettings();
      if (persistedSettings) {
        console.warn('Returning persisted notification settings due to error:', error.message);
        return persistedSettings;
      }

      handleNotificationError(error, 'getNotificationSettings');
      throw error;
    }
  },

  /**
   * Actualizar configuración de notificaciones
   */
  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const operation = async () => {
        const response = await apiClient.put<NotificationSettings>('/notifications/settings', settings, {
          timeout: 10000
        });
        return response.data;
      };

      const updatedSettings = await retryWithBackoff(operation);

      // Persistir nueva configuración
      persistence.saveSettings(updatedSettings);

      return {
        ...updatedSettings,
        updatedAt: new Date(updatedSettings.updatedAt)
      };

    } catch (error: any) {
      handleNotificationError(error, 'updateNotificationSettings');
      throw error;
    }
  },

  /**
   * Manejar notificación en tiempo real
   */
  handleRealtimeNotification(event: NotificationEvent): void {
    console.log('Received realtime notification:', event);

    // Limpiar cache para forzar actualización
    this.clearCache();

    // Emitir evento personalizado para que los componentes puedan escuchar
    const customEvent = new CustomEvent('notificationReceived', {
      detail: event
    });
    window.dispatchEvent(customEvent);

    // Actualizar persistencia local si es una nueva notificación
    if (event.type === 'new') {
      const persistedNotifications = persistence.loadNotifications();
      const updatedNotifications = [event.notification, ...persistedNotifications];
      persistence.saveNotifications(updatedNotifications);
    }
  },

  /**
   * Iniciar polling de notificaciones
   */
  startPolling(): void {
    // Solo hacer polling si WebSocket no está conectado
    if (notificationWS.isConnected()) {
      return;
    }

    const poll = async () => {
      try {
        await this.getNotifications(undefined, false); // Sin cache para obtener datos frescos
      } catch (error) {
        console.warn('Polling error:', error);
      }
    };

    // Polling inicial
    poll();

    // Configurar intervalo de polling
    setInterval(poll, NOTIFICATION_CONFIG.pollingInterval);
  },

  /**
   * Detener el servicio
   */
  stop(): void {
    notificationWS.disconnect();
  },

  /**
   * Limpiar cache
   */
  clearCache(): void {
    notificationCache.clear();
  },

  /**
   * Limpiar persistencia local
   */
  clearPersistence(): void {
    persistence.clearAll();
  },

  /**
   * Obtener estado de salud del servicio
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    services: {
      api: { status: 'up' | 'down'; responseTime?: number; error?: string };
      websocket: { status: 'up' | 'down'; connected: boolean };
      cache: { status: 'up' | 'down'; entries: number };
      persistence: { status: 'up' | 'down'; notifications: number };
    };
    timestamp: Date;
  }> {
    const timestamp = new Date();
    const healthStatus = {
      isHealthy: true,
      services: {
        api: { status: 'up' as 'up' | 'down', responseTime: undefined as number | undefined, error: undefined as string | undefined },
        websocket: { status: notificationWS.isConnected() ? 'up' as 'up' | 'down' : 'down' as 'up' | 'down', connected: notificationWS.isConnected() },
        cache: { status: 'up' as 'up' | 'down', entries: notificationCache.getStats().size },
        persistence: { status: 'up' as 'up' | 'down', notifications: persistence.loadNotifications().length }
      },
      timestamp
    };

    // Verificar API
    try {
      const startTime = Date.now();
      await apiClient.get('/notifications/health', { timeout: 5000 });
      healthStatus.services.api = {
        status: 'up',
        responseTime: Date.now() - startTime,
        error: undefined
      };
    } catch (error: any) {
      healthStatus.services.api = {
        status: 'down',
        responseTime: undefined,
        error: error.message
      };
      healthStatus.isHealthy = false;
    }

    return healthStatus;
  },

  /**
   * Obtener estadísticas del servicio
   */
  getServiceStats(): {
    cache: { size: number; keys: string[] };
    persistence: { notifications: number };
    websocket: { connected: boolean };
    config: NotificationServiceConfig;
  } {
    return {
      cache: notificationCache.getStats(),
      persistence: { notifications: persistence.loadNotifications().length },
      websocket: { connected: notificationWS.isConnected() },
      config: NOTIFICATION_CONFIG
    };
  },

  /**
   * Suscribirse a eventos de notificaciones en tiempo real
   */
  onNotification(callback: (event: NotificationEvent) => void): () => void {
    notificationWS.on('notification', callback);
    
    // Retornar función para desuscribirse
    return () => {
      notificationWS.off('notification', callback);
    };
  },

  /**
   * Suscribirse a eventos de conexión WebSocket
   */
  onConnectionChange(callback: (connected: boolean) => void): () => void {
    const connectedHandler = () => callback(true);
    const disconnectedHandler = () => callback(false);
    
    notificationWS.on('connected', connectedHandler);
    notificationWS.on('disconnected', disconnectedHandler);
    
    return () => {
      notificationWS.off('connected', connectedHandler);
      notificationWS.off('disconnected', disconnectedHandler);
    };
  },

  /**
   * Obtener notificaciones en caché
   */
  getCachedNotifications(): Notification[] {
    return persistence.loadNotifications();
  },

  /**
   * Obtener conteo de notificaciones no leídas
   */
  getUnreadCount(): number {
    const notifications = persistence.loadNotifications();
    return notifications.filter(n => n.status === NotificationStatus.UNREAD).length;
  },

  /**
   * Limpiar recursos del servicio
   */
  cleanup(): void {
    notificationWS.disconnect();
    notificationCache.clear();
  },

  /**
   * Agregar listener de eventos
   */
  addEventListener(event: string, listener: (data: any) => void): void {
    notificationWS.on(event, listener);
  },

  /**
   * Remover listener de eventos
   */
  removeEventListener(event: string, listener: (data: any) => void): void {
    notificationWS.off(event, listener);
  }
};

// Exportar configuración y utilidades
export const NOTIFICATION_UTILS = {
  cache: notificationCache,
  persistence,
  websocket: notificationWS,
  config: NOTIFICATION_CONFIG
};

// Inicializar automáticamente cuando se importa el módulo
if (typeof window !== 'undefined') {
  // Solo en el navegador, no en SSR
  notificationService.initialize().catch(error => {
    console.warn('Failed to auto-initialize notification service:', error);
  });
}