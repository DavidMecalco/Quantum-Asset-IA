import { apiClient } from './authService';
import {
  SystemStatus,
  Task,
  SystemMetrics,
  TaskFilters,
  SystemPerformance,
  TaskPriority,
  TaskStatus as TaskStatusEnum
} from '../types/dashboard';

// Configuración específica para Maximo
const MAXIMO_CONFIG = {
  timeout: 15000, // 15 segundos para APIs de Maximo
  retryAttempts: 3,
  retryDelay: 2000,
  healthCheckInterval: 60000, // 1 minuto
  maxConcurrentRequests: 5,
  rateLimitDelay: 100, // ms entre requests para evitar rate limiting
};

// Tipos específicos para respuestas de Maximo
interface MaximoApiResponse<T = any> {
  member?: T[];
  responseInfo?: {
    totalCount?: number;
    pagenum?: number;
    nextPage?: {
      href: string;
    };
  };
  Error?: {
    message: string;
    reasonCode: string;
  };
}

interface MaximoWorkOrder {
  wonum: string;
  description: string;
  status: string;
  priority: number;
  schedstart?: string;
  schedfinish?: string;
  assignedto?: string;
  worktype?: string;
  siteid?: string;
  assetnum?: string;
  location?: string;
  reportedby?: string;
  reportdate?: string;
  actstart?: string;
  actfinish?: string;
  estdur?: number;
  actlabcost?: number;
  actmatcost?: number;
}

interface MaximoSystemInfo {
  version: string;
  build: string;
  uptime: number;
  activeUsers: number;
  systemLoad: number;
  lastBackup?: string;
  dbConnections?: number;
}

// Función para mapear prioridades de Maximo a nuestro sistema
const mapMaximoPriority = (maximoPriority: number): TaskPriority => {
  if (maximoPriority >= 1 && maximoPriority <= 2) return TaskPriority.CRITICAL;
  if (maximoPriority >= 3 && maximoPriority <= 4) return TaskPriority.HIGH;
  if (maximoPriority >= 5 && maximoPriority <= 7) return TaskPriority.MEDIUM;
  return TaskPriority.LOW;
};

// Función para mapear estados de Maximo a nuestro sistema
const mapMaximoStatus = (maximoStatus: string): TaskStatusEnum => {
  const status = maximoStatus.toUpperCase();
  switch (status) {
    case 'WAPPR':
    case 'APPR':
    case 'WSCH':
      return TaskStatusEnum.PENDING;
    case 'INPRG':
    case 'WMATL':
      return TaskStatusEnum.IN_PROGRESS;
    case 'COMP':
    case 'CLOSE':
      return TaskStatusEnum.COMPLETED;
    default:
      return TaskStatusEnum.PENDING;
  }
};

// Función para convertir Work Order de Maximo a nuestro Task
const convertMaximoWorkOrderToTask = (wo: MaximoWorkOrder): Task => {
  return {
    id: wo.wonum,
    title: wo.description || `Work Order ${wo.wonum}`,
    description: `${wo.worktype || 'General'} - ${wo.assetnum || wo.location || 'No asset'}`,
    priority: mapMaximoPriority(wo.priority || 5),
    dueDate: wo.schedfinish ? new Date(wo.schedfinish) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días por defecto
    status: mapMaximoStatus(wo.status || 'WAPPR'),
    assignedTo: wo.assignedto || 'Unassigned',
    workOrderNumber: wo.wonum,
    estimatedHours: wo.estdur || 0,
    completedAt: wo.actfinish ? new Date(wo.actfinish) : undefined,
    createdAt: wo.reportdate ? new Date(wo.reportdate) : new Date(),
    updatedAt: new Date()
  };
};

// Función para manejo de errores específicos de Maximo
const handleMaximoError = (error: any, context: string) => {
  console.error(`Maximo Service Error (${context}):`, error);

  // Errores específicos de Maximo
  if (error.response?.data?.Error) {
    const maximoError = error.response.data.Error;
    throw new Error(`Maximo Error: ${maximoError.message} (${maximoError.reasonCode})`);
  }

  // Errores de conectividad con Maximo
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    throw new Error('No se puede conectar con el sistema Maximo. Verifica la conectividad.');
  }

  // Errores HTTP estándar
  if (error.response) {
    const { status } = error.response;
    switch (status) {
      case 401:
        throw new Error('Credenciales de Maximo inválidas o expiradas');
      case 403:
        throw new Error('No tienes permisos para acceder a este recurso en Maximo');
      case 404:
        throw new Error('Recurso no encontrado en Maximo');
      case 500:
        throw new Error('Error interno del servidor Maximo');
      case 503:
        throw new Error('Servicio Maximo no disponible temporalmente');
      default:
        throw new Error(`Error de Maximo: HTTP ${status}`);
    }
  }

  throw new Error('Error de conexión con Maximo. Intenta nuevamente.');
};

// Control de concurrencia para requests
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

const waitForSlot = (): Promise<void> => {
  return new Promise((resolve) => {
    if (activeRequests < MAXIMO_CONFIG.maxConcurrentRequests) {
      activeRequests++;
      resolve();
    } else {
      requestQueue.push(() => {
        activeRequests++;
        resolve();
      });
    }
  });
};

const releaseSlot = () => {
  activeRequests--;
  if (requestQueue.length > 0) {
    const next = requestQueue.shift();
    if (next) next();
  }
};

// Función para retry con backoff exponencial y control de concurrencia
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = MAXIMO_CONFIG.retryAttempts,
  baseDelay: number = MAXIMO_CONFIG.retryDelay
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Esperar slot disponible para evitar sobrecarga
      await waitForSlot();
      
      try {
        const result = await operation();
        return result;
      } finally {
        releaseSlot();
      }
    } catch (error: any) {
      releaseSlot();
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }

      // No reintentar en errores de autenticación o permisos
      if (error.response?.status === 401 || error.response?.status === 403) {
        break;
      }

      // No reintentar en errores de validación (400)
      if (error.response?.status === 400) {
        break;
      }

      // Calcular delay con jitter para evitar thundering herd
      const jitter = Math.random() * 0.1 * baseDelay;
      const delay = (baseDelay * Math.pow(2, attempt)) + jitter;
      
      console.warn(`Maximo request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Cache para mejorar performance
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MaximoCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 30000; // 30 segundos

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
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

  clear(): void {
    this.cache.clear();
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
}

const maximoCache = new MaximoCache();

export const maximoService = {
  /**
   * Obtener estado del sistema Maximo
   */
  async getSystemStatus(useCache: boolean = true): Promise<SystemStatus> {
    const cacheKey = 'system-status';
    
    // Intentar obtener desde cache primero
    if (useCache) {
      const cached = maximoCache.get<SystemStatus>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const operation = async () => {
        const response = await apiClient.get<MaximoSystemInfo>('/maximo/system/info', {
          timeout: MAXIMO_CONFIG.timeout,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });
        return response.data;
      };

      const systemInfo = await retryWithBackoff(operation);

      // Determinar performance basado en métricas
      let performance: SystemPerformance = SystemPerformance.GOOD;
      if (systemInfo.systemLoad > 80) {
        performance = SystemPerformance.CRITICAL;
      } else if (systemInfo.systemLoad > 60) {
        performance = SystemPerformance.WARNING;
      }

      const status: SystemStatus = {
        isConnected: true,
        lastSync: new Date(),
        performance,
        activeUsers: systemInfo.activeUsers || 0,
        systemLoad: systemInfo.systemLoad || 0,
        version: systemInfo.version,
        uptime: systemInfo.uptime || 0
      };

      // Guardar en cache
      maximoCache.set(cacheKey, status, 15000); // Cache por 15 segundos

      return status;
    } catch (error: any) {
      handleMaximoError(error, 'getSystemStatus');
      
      // Si no podemos conectar, devolver estado desconectado
      console.warn('Maximo connection failed:', error);
      const disconnectedStatus: SystemStatus = {
        isConnected: false,
        lastSync: new Date(),
        performance: SystemPerformance.CRITICAL,
        activeUsers: 0,
        systemLoad: 0
      };

      // Cache el estado desconectado por menos tiempo
      maximoCache.set(cacheKey, disconnectedStatus, 5000); // 5 segundos
      
      return disconnectedStatus;
    }
  },

  /**
   * Obtener work orders del usuario desde Maximo
   */
  async getUserWorkOrders(filters?: TaskFilters, useCache: boolean = true): Promise<Task[]> {
    const cacheKey = `work-orders-${JSON.stringify(filters || {})}`;
    
    // Intentar obtener desde cache primero
    if (useCache) {
      const cached = maximoCache.get<Task[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const operation = async () => {
        // Construir query parameters para Maximo
        const params: any = {
          'oslc.select': 'wonum,description,status,priority,schedstart,schedfinish,assignedto,worktype,siteid,assetnum,location,reportedby,reportdate,actstart,actfinish,estdur',
          'oslc.pageSize': 100
        };

        // Aplicar filtros si existen
        const whereConditions: string[] = [];

        if (filters?.status && filters.status.length > 0) {
          const maximoStatuses = filters.status.map(status => {
            switch (status) {
              case TaskStatusEnum.PENDING: return 'WAPPR,APPR,WSCH';
              case TaskStatusEnum.IN_PROGRESS: return 'INPRG,WMATL';
              case TaskStatusEnum.COMPLETED: return 'COMP,CLOSE';
              default: return 'WAPPR';
            }
          }).join(',');
          whereConditions.push(`status in [${maximoStatuses}]`);
        }

        if (filters?.assignedTo && filters.assignedTo.length > 0) {
          const assignees = filters.assignedTo.map(a => `"${a}"`).join(',');
          whereConditions.push(`assignedto in [${assignees}]`);
        }

        if (filters?.dueDateFrom) {
          whereConditions.push(`schedfinish>="${filters.dueDateFrom.toISOString()}"`);
        }

        if (filters?.dueDateTo) {
          whereConditions.push(`schedfinish<="${filters.dueDateTo.toISOString()}"`);
        }

        if (filters?.searchTerm) {
          whereConditions.push(`(description~"*${filters.searchTerm}*" or wonum~"*${filters.searchTerm}*")`);
        }

        if (whereConditions.length > 0) {
          params['oslc.where'] = whereConditions.join(' and ');
        }

        // Ordenar por prioridad y fecha de vencimiento
        params['oslc.orderBy'] = '+priority,+schedfinish';

        const response = await apiClient.get<MaximoApiResponse<MaximoWorkOrder>>('/maximo/os/mxwo', {
          params,
          timeout: MAXIMO_CONFIG.timeout,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'Cache-Control': 'no-cache'
          }
        });

        return response.data;
      };

      const maximoResponse = await retryWithBackoff(operation);

      if (maximoResponse.Error) {
        throw new Error(maximoResponse.Error.message);
      }

      const workOrders = maximoResponse.member || [];
      const tasks = workOrders.map(convertMaximoWorkOrderToTask);

      // Guardar en cache
      maximoCache.set(cacheKey, tasks, 30000); // Cache por 30 segundos

      return tasks;

    } catch (error: any) {
      handleMaximoError(error, 'getUserWorkOrders');
      
      // Intentar devolver datos en cache si hay error
      const cached = maximoCache.get<Task[]>(cacheKey);
      if (cached) {
        console.warn('Returning cached work orders due to error:', error.message);
        return cached;
      }
      
      throw error;
    }
  },

  /**
   * Obtener métricas del sistema Maximo
   */
  async getSystemMetrics(useCache: boolean = true): Promise<SystemMetrics> {
    const cacheKey = 'system-metrics';
    
    // Intentar obtener desde cache primero
    if (useCache) {
      const cached = maximoCache.get<SystemMetrics>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const operation = async () => {
        const [systemInfo, dbMetrics] = await Promise.all([
          apiClient.get<MaximoSystemInfo>('/maximo/system/info', {
            timeout: MAXIMO_CONFIG.timeout,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }),
          apiClient.get<any>('/maximo/system/metrics', {
            timeout: MAXIMO_CONFIG.timeout,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }).catch(() => ({ data: {} })) // Fallback si no está disponible
        ]);

        return {
          systemInfo: systemInfo.data,
          dbMetrics: dbMetrics.data
        };
      };

      const { systemInfo, dbMetrics } = await retryWithBackoff(operation);

      const metrics: SystemMetrics = {
        cpuUsage: dbMetrics.cpuUsage || systemInfo.systemLoad || 0,
        memoryUsage: dbMetrics.memoryUsage || 0,
        diskUsage: dbMetrics.diskUsage || 0,
        networkLatency: dbMetrics.networkLatency || 0,
        activeConnections: systemInfo.dbConnections || systemInfo.activeUsers || 0,
        errorRate: dbMetrics.errorRate || 0,
        throughput: dbMetrics.throughput || 0,
        responseTime: dbMetrics.responseTime || 0,
        timestamp: new Date()
      };

      // Guardar en cache
      maximoCache.set(cacheKey, metrics, 20000); // Cache por 20 segundos

      return metrics;

    } catch (error: any) {
      handleMaximoError(error, 'getSystemMetrics');
      
      // Intentar devolver datos en cache si hay error
      const cached = maximoCache.get<SystemMetrics>(cacheKey);
      if (cached) {
        console.warn('Returning cached metrics due to error:', error.message);
        return cached;
      }
      
      throw error;
    }
  },

  /**
   * Completar work order en Maximo
   */
  async completeWorkOrder(workOrderNumber: string): Promise<Task> {
    try {
      const operation = async () => {
        // Primero obtener el work order actual
        const getResponse = await apiClient.get<MaximoApiResponse<MaximoWorkOrder>>(
          `/maximo/os/mxwo/${workOrderNumber}`,
          { timeout: MAXIMO_CONFIG.timeout }
        );

        if (getResponse.data.Error || !getResponse.data.member?.[0]) {
          throw new Error(`Work Order ${workOrderNumber} no encontrado`);
        }

        // Actualizar el estado a completado
        const updateData = {
          status: 'COMP',
          actfinish: new Date().toISOString()
        };

        const updateResponse = await apiClient.patch<MaximoApiResponse<MaximoWorkOrder>>(
          `/maximo/os/mxwo/${workOrderNumber}`,
          updateData,
          { timeout: MAXIMO_CONFIG.timeout }
        );

        if (updateResponse.data.Error) {
          throw new Error(updateResponse.data.Error.message);
        }

        return updateResponse.data.member?.[0] || getResponse.data.member[0];
      };

      const updatedWorkOrder = await retryWithBackoff(operation);
      return convertMaximoWorkOrderToTask(updatedWorkOrder);

    } catch (error: any) {
      handleMaximoError(error, 'completeWorkOrder');
      throw error;
    }
  },

  /**
   * Crear nuevo work order en Maximo
   */
  async createWorkOrder(workOrderData: {
    description: string;
    priority?: TaskPriority;
    assignedTo?: string;
    assetNumber?: string;
    location?: string;
    workType?: string;
  }): Promise<Task> {
    try {
      const operation = async () => {
        const maximoData = {
          description: workOrderData.description,
          priority: workOrderData.priority === TaskPriority.CRITICAL ? 1 :
                   workOrderData.priority === TaskPriority.HIGH ? 3 :
                   workOrderData.priority === TaskPriority.MEDIUM ? 5 : 8,
          assignedto: workOrderData.assignedTo,
          assetnum: workOrderData.assetNumber,
          location: workOrderData.location,
          worktype: workOrderData.workType || 'CM',
          status: 'WAPPR',
          reportdate: new Date().toISOString()
        };

        const response = await apiClient.post<MaximoApiResponse<MaximoWorkOrder>>(
          '/maximo/os/mxwo',
          maximoData,
          { timeout: MAXIMO_CONFIG.timeout }
        );

        if (response.data.Error) {
          throw new Error(response.data.Error.message);
        }

        return response.data.member?.[0];
      };

      const newWorkOrder = await retryWithBackoff(operation);
      if (!newWorkOrder) {
        throw new Error('No se pudo crear el work order');
      }

      return convertMaximoWorkOrderToTask(newWorkOrder);

    } catch (error: any) {
      handleMaximoError(error, 'createWorkOrder');
      throw error;
    }
  },

  /**
   * Verificar conectividad con Maximo
   */
  async checkConnectivity(): Promise<{ isConnected: boolean; responseTime: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      await apiClient.get('/maximo/system/ping', {
        timeout: 5000 // Timeout más corto para ping
      });
      
      return {
        isConnected: true,
        responseTime: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        isConnected: false,
        responseTime: Date.now() - startTime,
        error: error.message || 'Connection failed'
      };
    }
  },

  /**
   * Obtener información de assets desde Maximo
   */
  async getAssets(searchTerm?: string, limit: number = 50): Promise<any[]> {
    try {
      const operation = async () => {
        const params: any = {
          'oslc.select': 'assetnum,description,status,location,siteid,assettype',
          'oslc.pageSize': limit
        };

        if (searchTerm) {
          params['oslc.where'] = `(assetnum~"*${searchTerm}*" or description~"*${searchTerm}*")`;
        }

        const response = await apiClient.get<MaximoApiResponse<any>>('/maximo/os/mxasset', {
          params,
          timeout: MAXIMO_CONFIG.timeout
        });

        return response.data;
      };

      const maximoResponse = await retryWithBackoff(operation);

      if (maximoResponse.Error) {
        throw new Error(maximoResponse.Error.message);
      }

      return maximoResponse.member || [];

    } catch (error: any) {
      handleMaximoError(error, 'getAssets');
      throw error;
    }
  },

  /**
   * Obtener estadísticas de work orders
   */
  async getWorkOrderStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
  }> {
    try {
      const operation = async () => {
        const response = await apiClient.get<any>('/maximo/reports/workorder-stats', {
          timeout: MAXIMO_CONFIG.timeout
        });
        return response.data;
      };

      return await retryWithBackoff(operation);

    } catch (error: any) {
      // Si no hay endpoint de estadísticas, calcular manualmente
      try {
        const workOrders = await this.getUserWorkOrders();
        const stats = {
          total: workOrders.length,
          byStatus: {} as Record<string, number>,
          byPriority: {} as Record<string, number>,
          overdue: 0
        };

        workOrders.forEach(wo => {
          // Contar por estado
          stats.byStatus[wo.status] = (stats.byStatus[wo.status] || 0) + 1;
          
          // Contar por prioridad
          stats.byPriority[wo.priority] = (stats.byPriority[wo.priority] || 0) + 1;
          
          // Contar vencidos
          if (wo.dueDate < new Date() && wo.status !== TaskStatusEnum.COMPLETED) {
            stats.overdue++;
          }
        });

        return stats;
      } catch {
        return {
          total: 0,
          byStatus: {},
          byPriority: {},
          overdue: 0
        };
      }
    }
  },

  /**
   * Limpiar cache del servicio
   */
  clearCache(): void {
    maximoCache.clear();
  },

  /**
   * Obtener información de salud del servicio
   */
  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    services: {
      maximo: { status: 'up' | 'down'; responseTime?: number; error?: string };
      cache: { status: 'up' | 'down'; entries: number };
    };
    timestamp: Date;
  }> {
    const timestamp = new Date();
    const healthStatus = {
      isHealthy: true,
      services: {
        maximo: { status: 'up' as 'up' | 'down', responseTime: undefined as number | undefined, error: undefined as string | undefined },
        cache: { status: 'up' as 'up' | 'down', entries: maximoCache['cache'].size }
      },
      timestamp
    };

    try {
      const connectivity = await this.checkConnectivity();
      healthStatus.services.maximo = {
        status: connectivity.isConnected ? 'up' : 'down',
        responseTime: connectivity.responseTime,
        error: connectivity.error
      };
      
      if (!connectivity.isConnected) {
        healthStatus.isHealthy = false;
      }
    } catch (error: any) {
      healthStatus.services.maximo = {
        status: 'down',
        responseTime: undefined,
        error: error.message
      };
      healthStatus.isHealthy = false;
    }

    return healthStatus;
  },

  /**
   * Obtener estadísticas del cache
   */
  getCacheStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: maximoCache['cache'].size,
      keys: Array.from(maximoCache['cache'].keys())
    };
  }
};

// Exportar configuración y utilidades
export const MAXIMO_UTILS = {
  mapMaximoPriority,
  mapMaximoStatus,
  convertMaximoWorkOrderToTask,
  MAXIMO_CONFIG,
  cache: maximoCache
};