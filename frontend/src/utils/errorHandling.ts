/**
 * Utilidades para manejo de errores en el dashboard
 */

// Tipos de errores
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA = 'data',
  WIDGET = 'widget',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Interfaces para errores
export interface AppError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  context?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  retryable?: boolean;
  userMessage?: string;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  additionalData?: Record<string, any>;
}

// Clase para crear errores tipados
export class DashboardError extends Error implements AppError {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly code?: string;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly userId?: string;
  public readonly retryable?: boolean;
  public readonly userMessage?: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    options?: {
      code?: string;
      context?: Record<string, any>;
      userId?: string;
      retryable?: boolean;
      userMessage?: string;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'DashboardError';
    this.type = type;
    this.severity = severity;
    this.code = options?.code;
    this.context = options?.context;
    this.timestamp = new Date();
    this.userId = options?.userId;
    this.retryable = options?.retryable ?? false;
    this.userMessage = options?.userMessage;

    // Mantener stack trace original si hay una causa
    if (options?.cause) {
      this.stack = options.cause.stack;
    }
  }
}

// Funciones de utilidad para crear errores específicos
export const createNetworkError = (
  message: string,
  options?: {
    code?: string;
    retryable?: boolean;
    context?: Record<string, any>;
  }
): DashboardError => {
  return new DashboardError(
    message,
    ErrorType.NETWORK,
    ErrorSeverity.HIGH,
    {
      ...options,
      retryable: options?.retryable ?? true,
      userMessage: 'Error de conexión. Por favor, verifica tu conexión a internet.'
    }
  );
};

export const createValidationError = (
  message: string,
  field?: string,
  context?: Record<string, any>
): DashboardError => {
  return new DashboardError(
    message,
    ErrorType.VALIDATION,
    ErrorSeverity.LOW,
    {
      code: 'VALIDATION_FAILED',
      context: { field, ...context },
      userMessage: 'Los datos ingresados no son válidos. Por favor, revisa la información.'
    }
  );
};

export const createAuthError = (
  message: string,
  code?: string
): DashboardError => {
  return new DashboardError(
    message,
    ErrorType.AUTHENTICATION,
    ErrorSeverity.HIGH,
    {
      code,
      userMessage: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
    }
  );
};

export const createWidgetError = (
  message: string,
  widgetId: string,
  context?: Record<string, any>
): DashboardError => {
  return new DashboardError(
    message,
    ErrorType.WIDGET,
    ErrorSeverity.MEDIUM,
    {
      code: 'WIDGET_ERROR',
      context: { widgetId, ...context },
      retryable: true,
      userMessage: 'Error al cargar el widget. Puedes intentar recargarlo.'
    }
  );
};

export const createDataError = (
  message: string,
  source?: string,
  context?: Record<string, any>
): DashboardError => {
  return new DashboardError(
    message,
    ErrorType.DATA,
    ErrorSeverity.MEDIUM,
    {
      code: 'DATA_ERROR',
      context: { source, ...context },
      retryable: true,
      userMessage: 'Error al cargar los datos. Los datos pueden estar desactualizados.'
    }
  );
};

// Manejador de errores global
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: AppError[] = [];
  private maxQueueSize = 100;
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Manejar error
  handle(error: Error | AppError, context?: ErrorContext): string {
    const appError = this.normalizeError(error, context);
    const errorId = this.generateErrorId();
    
    // Agregar ID al error
    (appError as any).id = errorId;

    // Agregar a la cola
    this.addToQueue(appError);

    // Log del error
    this.logError(appError, context);

    // Notificar a servicios externos si es necesario
    if (appError.severity === ErrorSeverity.CRITICAL) {
      this.notifyExternalServices(appError);
    }

    return errorId;
  }

  // Normalizar error a AppError
  private normalizeError(error: Error | AppError, context?: ErrorContext): AppError {
    if (this.isAppError(error)) {
      return error;
    }

    // Detectar tipo de error basado en el mensaje o propiedades
    let type = ErrorType.UNKNOWN;
    let severity = ErrorSeverity.MEDIUM;

    if (error.message.includes('fetch') || error.message.includes('network')) {
      type = ErrorType.NETWORK;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
      type = ErrorType.AUTHENTICATION;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('403') || error.message.includes('forbidden')) {
      type = ErrorType.AUTHORIZATION;
      severity = ErrorSeverity.HIGH;
    } else if (error.message.includes('validation')) {
      type = ErrorType.VALIDATION;
      severity = ErrorSeverity.LOW;
    }

    return new DashboardError(
      error.message,
      type,
      severity,
      {
        context: context?.additionalData,
        userId: context?.userId,
        cause: error
      }
    );
  }

  // Verificar si es AppError
  private isAppError(error: any): error is AppError {
    return error && typeof error.type === 'string' && typeof error.severity === 'string';
  }

  // Generar ID único para el error
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Agregar error a la cola
  private addToQueue(error: AppError): void {
    this.errorQueue.push(error);
    
    // Mantener tamaño de cola
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  // Log del error
  private logError(error: AppError, context?: ErrorContext): void {
    const logData = {
      id: (error as any).id,
      message: error.message,
      type: error.type,
      severity: error.severity,
      code: error.code,
      timestamp: error.timestamp,
      userId: error.userId || context?.userId,
      component: context?.component,
      action: context?.action,
      url: context?.url || window.location.href,
      userAgent: context?.userAgent || navigator.userAgent,
      stack: error.stack,
      context: { ...error.context, ...context?.additionalData }
    };

    // Log en consola para desarrollo
    if (process.env.NODE_ENV === 'development') {
      const logMethod = error.severity === ErrorSeverity.CRITICAL ? 'error' : 
                       error.severity === ErrorSeverity.HIGH ? 'warn' : 'log';
      console[logMethod](`[${error.type.toUpperCase()}] ${error.message}`, logData);
    }

    // Enviar a servicio de logging en producción
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logData);
    }
  }

  // Enviar a servicio de logging
  private async sendToLoggingService(logData: any): Promise<void> {
    try {
      await fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData)
      });
    } catch (loggingError) {
      console.warn('Failed to send error to logging service:', loggingError);
    }
  }

  // Notificar servicios externos para errores críticos
  private async notifyExternalServices(error: AppError): Promise<void> {
    try {
      // Notificar a Sentry, LogRocket, etc.
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        (window as any).Sentry.captureException(error);
      }
    } catch (notificationError) {
      console.warn('Failed to notify external services:', notificationError);
    }
  }

  // Intentar reintento de operación
  async retry<T>(
    operation: () => Promise<T>,
    errorId: string,
    maxRetries?: number
  ): Promise<T> {
    const retries = maxRetries || this.maxRetries;
    const currentAttempts = this.retryAttempts.get(errorId) || 0;

    if (currentAttempts >= retries) {
      throw new DashboardError(
        'Maximum retry attempts exceeded',
        ErrorType.SYSTEM,
        ErrorSeverity.HIGH,
        {
          code: 'MAX_RETRIES_EXCEEDED',
          context: { errorId, attempts: currentAttempts }
        }
      );
    }

    try {
      const result = await operation();
      this.retryAttempts.delete(errorId); // Limpiar intentos exitosos
      return result;
    } catch (error) {
      this.retryAttempts.set(errorId, currentAttempts + 1);
      
      // Esperar antes del siguiente intento (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, currentAttempts), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.retry(operation, errorId, maxRetries);
    }
  }

  // Obtener errores de la cola
  getErrors(filter?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    userId?: string;
    since?: Date;
  }): AppError[] {
    let errors = [...this.errorQueue];

    if (filter) {
      errors = errors.filter(error => {
        if (filter.type && error.type !== filter.type) return false;
        if (filter.severity && error.severity !== filter.severity) return false;
        if (filter.userId && error.userId !== filter.userId) return false;
        if (filter.since && error.timestamp < filter.since) return false;
        return true;
      });
    }

    return errors;
  }

  // Limpiar errores
  clearErrors(filter?: { type?: ErrorType; userId?: string }): void {
    if (!filter) {
      this.errorQueue = [];
      this.retryAttempts.clear();
      return;
    }

    this.errorQueue = this.errorQueue.filter(error => {
      if (filter.type && error.type === filter.type) return false;
      if (filter.userId && error.userId === filter.userId) return false;
      return true;
    });
  }

  // Obtener estadísticas de errores
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: number; // últimas 24 horas
  } {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const byType = {} as Record<ErrorType, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;
    let recent = 0;

    this.errorQueue.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      
      if (error.timestamp > oneDayAgo) {
        recent++;
      }
    });

    return {
      total: this.errorQueue.length,
      byType,
      bySeverity,
      recent
    };
  }
}

// Hook para usar el manejador de errores
export const useErrorHandler = () => {
  const handler = ErrorHandler.getInstance();

  return {
    handleError: (error: Error | AppError, context?: ErrorContext) => 
      handler.handle(error, context),
    retry: <T>(operation: () => Promise<T>, errorId: string, maxRetries?: number) =>
      handler.retry(operation, errorId, maxRetries),
    getErrors: (filter?: Parameters<typeof handler.getErrors>[0]) =>
      handler.getErrors(filter),
    clearErrors: (filter?: Parameters<typeof handler.clearErrors>[0]) =>
      handler.clearErrors(filter),
    getErrorStats: () => handler.getErrorStats()
  };
};

// Utilidades para manejo de errores específicos del dashboard
export const handleWidgetError = (
  error: Error,
  widgetId: string,
  context?: Record<string, any>
): string => {
  const handler = ErrorHandler.getInstance();
  const widgetError = createWidgetError(error.message, widgetId, context);
  return handler.handle(widgetError, {
    component: 'widget',
    additionalData: { widgetId, ...context }
  });
};

export const handleDataFetchError = (
  error: Error,
  source: string,
  context?: Record<string, any>
): string => {
  const handler = ErrorHandler.getInstance();
  const dataError = createDataError(error.message, source, context);
  return handler.handle(dataError, {
    component: 'data-service',
    action: 'fetch',
    additionalData: { source, ...context }
  });
};

export const handleNetworkError = (
  error: Error,
  endpoint?: string,
  context?: Record<string, any>
): string => {
  const handler = ErrorHandler.getInstance();
  const networkError = createNetworkError(error.message, {
    code: 'NETWORK_REQUEST_FAILED',
    context: { endpoint, ...context }
  });
  return handler.handle(networkError, {
    component: 'network',
    action: 'request',
    additionalData: { endpoint, ...context }
  });
};

// Función para configurar manejo global de errores no capturados
export const setupGlobalErrorHandling = (): void => {
  const handler = ErrorHandler.getInstance();

  // Manejar errores JavaScript no capturados
  window.addEventListener('error', (event) => {
    handler.handle(event.error || new Error(event.message), {
      component: 'global',
      action: 'unhandled-error',
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
  });

  // Manejar promesas rechazadas no capturadas
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error ? 
      event.reason : 
      new Error(String(event.reason));
    
    handler.handle(error, {
      component: 'global',
      action: 'unhandled-rejection'
    });
  });
};

export default ErrorHandler;