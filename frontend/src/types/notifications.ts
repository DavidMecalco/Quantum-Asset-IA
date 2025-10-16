/**
 * Tipos para el sistema de notificaciones
 */

// Enums para notificaciones
export enum NotificationType {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
  DISMISSED = 'dismissed'
}

export enum NotificationCategory {
  SYSTEM = 'system',
  TASK = 'task',
  SECURITY = 'security',
  MAINTENANCE = 'maintenance',
  USER = 'user',
  INTEGRATION = 'integration'
}

// Interface principal de notificación
export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;
  title: string;
  message: string;
  timestamp: Date;
  status: NotificationStatus;
  userId?: string;
  actionUrl?: string;
  actionLabel?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  source?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

// Configuración de notificaciones del usuario
export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  categories: {
    [key in NotificationCategory]: {
      enabled: boolean;
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
  quietHours?: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;   // HH:mm format
    timezone: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  updatedAt: Date;
}

// Filtros para notificaciones
export interface NotificationFilters {
  types?: NotificationType[];
  priorities?: NotificationPriority[];
  categories?: NotificationCategory[];
  status?: NotificationStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  searchTerm?: string;
  userId?: string;
  source?: string;
}

// Respuesta de API para notificaciones
export interface NotificationResponse {
  notifications: Notification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
  nextCursor?: string;
}

// Estadísticas de notificaciones
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
  byCategory: Record<NotificationCategory, number>;
  todayCount: number;
  weekCount: number;
  monthCount: number;
}

// Evento de notificación en tiempo real
export interface NotificationEvent {
  type: 'new' | 'updated' | 'deleted' | 'read' | 'archived';
  notification: Notification;
  timestamp: Date;
  userId?: string;
}

// Configuración del servicio de notificaciones
export interface NotificationServiceConfig {
  pollingInterval: number;
  maxRetries: number;
  retryDelay: number;
  enableWebSocket: boolean;
  webSocketUrl?: string;
  enablePersistence: boolean;
  maxCacheSize: number;
  cacheTTL: number;
}

// Template para notificaciones
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  category: NotificationCategory;
  titleTemplate: string;
  messageTemplate: string;
  actionUrlTemplate?: string;
  actionLabelTemplate?: string;
  defaultPriority: NotificationPriority;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Contexto para renderizado de templates
export interface NotificationContext {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  system?: {
    name: string;
    version: string;
    environment: string;
  };
  entity?: {
    id: string;
    type: string;
    name: string;
    [key: string]: any;
  };
  timestamp: Date;
  [key: string]: any;
}

// Acción de notificación
export interface NotificationAction {
  id: string;
  label: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: Record<string, any>;
  confirmationRequired?: boolean;
  confirmationMessage?: string;
  style?: 'primary' | 'secondary' | 'danger' | 'success';
  icon?: string;
}

// Notificación enriquecida con acciones
export interface EnhancedNotification extends Notification {
  actions?: NotificationAction[];
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size?: number;
  }[];
  relatedNotifications?: string[];
  tags?: string[];
}

// Estado del centro de notificaciones
export interface NotificationCenterState {
  notifications: Notification[];
  filters: NotificationFilters;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  selectedNotification?: Notification;
  isModalOpen: boolean;
  lastFetch?: Date;
  stats: NotificationStats;
}