import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  WidgetConfig, 
  WidgetType, 
  WidgetSize, 
  WidgetState, 
  WidgetLayout,
  WidgetPosition,
  GridConfig
} from '../types/widgets';
import { UserRole } from '../types/auth';
import { dashboardService } from '../services/dashboardService';
import { useDebounce, createDebouncedSetter, useStableCallback } from '../utils/memoization';

// Clave para localStorage
const WIDGET_SETTINGS_KEY = 'dashboard_widget_settings';
const WIDGET_LAYOUT_KEY = 'dashboard_widget_layout';

// Configuración por defecto de widgets según rol
const DEFAULT_WIDGET_CONFIGS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: [
    'welcome',
    'system_status',
    'tasks',
    'metrics',
    'quick_actions',
    'notifications'
  ],
  [UserRole.USER]: [
    'welcome',
    'system_status',
    'tasks',
    'quick_actions',
    'notifications'
  ],
  [UserRole.VIEWER]: [
    'welcome',
    'system_status',
    'notifications'
  ]
};

// Configuración por defecto del grid
const DEFAULT_GRID_CONFIG: GridConfig = {
  breakpoints: [
    { breakpoint: 'lg', cols: 4, margin: [16, 16], containerPadding: [16, 16] },
    { breakpoint: 'md', cols: 3, margin: [12, 12], containerPadding: [12, 12] },
    { breakpoint: 'sm', cols: 2, margin: [8, 8], containerPadding: [8, 8] },
    { breakpoint: 'xs', cols: 1, margin: [4, 4], containerPadding: [4, 4] }
  ],
  rowHeight: 120,
  maxRows: 10,
  isDraggable: true,
  isResizable: true,
  preventCollision: false,
  compactType: 'vertical'
};

// Registro de widgets disponibles
const WIDGET_REGISTRY: Record<string, WidgetConfig> = {
  welcome: {
    id: 'welcome',
    type: WidgetType.WELCOME,
    name: 'Bienvenida',
    description: 'Saludo personalizado y resumen de actividad',
    component: null as any, // Se asignará dinámicamente
    defaultSize: WidgetSize.LARGE,
    minSize: WidgetSize.MEDIUM,
    maxSize: WidgetSize.LARGE,
    isOptional: false,
    isResizable: true,
    isDraggable: true,
    category: 'general',
    icon: 'user'
  },
  system_status: {
    id: 'system_status',
    type: WidgetType.SYSTEM_STATUS,
    name: 'Estado del Sistema',
    description: 'Monitoreo del estado de Maximo',
    component: null as any,
    defaultSize: WidgetSize.MEDIUM,
    minSize: WidgetSize.SMALL,
    maxSize: WidgetSize.LARGE,
    refreshInterval: 15000,
    isOptional: false,
    isResizable: true,
    isDraggable: true,
    category: 'system',
    icon: 'activity'
  },
  tasks: {
    id: 'tasks',
    type: WidgetType.TASKS,
    name: 'Tareas Pendientes',
    description: 'Work orders y tareas asignadas',
    component: null as any,
    defaultSize: WidgetSize.LARGE,
    minSize: WidgetSize.MEDIUM,
    refreshInterval: 30000,
    isOptional: true,
    isResizable: true,
    isDraggable: true,
    category: 'work',
    icon: 'clipboard-list'
  },
  metrics: {
    id: 'metrics',
    type: WidgetType.METRICS,
    name: 'Métricas del Sistema',
    description: 'Estadísticas y rendimiento',
    component: null as any,
    defaultSize: WidgetSize.LARGE,
    minSize: WidgetSize.MEDIUM,
    requiredRole: [UserRole.ADMIN],
    refreshInterval: 60000,
    isOptional: true,
    isResizable: true,
    isDraggable: true,
    category: 'analytics',
    icon: 'bar-chart'
  },
  quick_actions: {
    id: 'quick_actions',
    type: WidgetType.QUICK_ACTIONS,
    name: 'Acciones Rápidas',
    description: 'Accesos directos a funciones principales',
    component: null as any,
    defaultSize: WidgetSize.MEDIUM,
    minSize: WidgetSize.SMALL,
    isOptional: true,
    isResizable: true,
    isDraggable: true,
    category: 'navigation',
    icon: 'zap'
  },
  notifications: {
    id: 'notifications',
    type: WidgetType.NOTIFICATIONS,
    name: 'Notificaciones',
    description: 'Centro de notificaciones y alertas',
    component: null as any,
    defaultSize: WidgetSize.MEDIUM,
    minSize: WidgetSize.SMALL,
    refreshInterval: 30000,
    isOptional: true,
    isResizable: true,
    isDraggable: true,
    category: 'communication',
    icon: 'bell'
  }
};

// Interfaces para el hook
interface WidgetSettings {
  enabledWidgets: string[];
  widgetOrder: string[];
  widgetSizes: Record<string, WidgetSize>;
  widgetPositions: Record<string, WidgetPosition>;
  gridConfig: GridConfig;
  lastUpdated: Date;
}

interface UseWidgetSettingsOptions {
  userRole?: UserRole;
  userId?: string;
  autoSave?: boolean;
  syncWithServer?: boolean;
}

interface UseWidgetSettingsReturn {
  // Estado actual
  settings: WidgetSettings;
  availableWidgets: WidgetConfig[];
  enabledWidgets: WidgetConfig[];
  layout: WidgetLayout;
  
  // Estados de carga
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isSaving: boolean;
  
  // Funciones de configuración
  enableWidget: (widgetId: string) => void;
  disableWidget: (widgetId: string) => void;
  toggleWidget: (widgetId: string) => void;
  reorderWidgets: (newOrder: string[]) => void;
  resizeWidget: (widgetId: string, size: WidgetSize) => void;
  moveWidget: (widgetId: string, position: WidgetPosition) => void;
  resetToDefaults: () => void;
  
  // Funciones de persistencia
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  
  // Utilidades
  isWidgetEnabled: (widgetId: string) => boolean;
  canUserAccessWidget: (widgetId: string, userRole?: UserRole) => boolean;
  getWidgetConfig: (widgetId: string) => WidgetConfig | undefined;
}

/**
 * Hook para gestionar la configuración de widgets del dashboard
 */
export const useWidgetSettings = (options: UseWidgetSettingsOptions = {}): UseWidgetSettingsReturn => {
  const {
    userRole = UserRole.VIEWER,
    userId,
    autoSave = true,
    syncWithServer = true
  } = options;

  const queryClient = useQueryClient();

  // Estado local de configuración
  const [settings, setSettings] = useState<WidgetSettings>(() => {
    const defaultEnabledWidgets = DEFAULT_WIDGET_CONFIGS[userRole] || DEFAULT_WIDGET_CONFIGS[UserRole.VIEWER];
    
    return {
      enabledWidgets: defaultEnabledWidgets,
      widgetOrder: defaultEnabledWidgets,
      widgetSizes: Object.fromEntries(
        defaultEnabledWidgets.map(id => [id, WIDGET_REGISTRY[id]?.defaultSize || WidgetSize.MEDIUM])
      ),
      widgetPositions: {},
      gridConfig: DEFAULT_GRID_CONFIG,
      lastUpdated: new Date()
    };
  });

  // Debounced settings for performance optimization
  const debouncedSettings = useDebounce(settings, 500);
  
  // Ref to track if settings have been initialized
  const isInitialized = useRef(false);
  
  // Debounced setter for settings updates
  const debouncedSetSettings = useMemo(
    () => createDebouncedSetter(setSettings, 300),
    []
  );

  // Query para cargar configuración del servidor
  const { data: serverSettings, isLoading, isError, error } = useQuery({
    queryKey: ['widget-settings', userId],
    queryFn: () => dashboardService.getDashboardConfig(),
    enabled: syncWithServer && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation para guardar configuración en el servidor
  const saveMutation = useMutation({
    mutationFn: (newSettings: Partial<WidgetSettings>) => {
      const configToSave = {
        userId: userId!,
        enabledWidgets: newSettings.enabledWidgets || settings.enabledWidgets,
        widgetOrder: newSettings.widgetOrder || settings.widgetOrder,
        widgetSizes: newSettings.widgetSizes || settings.widgetSizes,
        refreshInterval: 30000,
      };
      return dashboardService.saveDashboardConfig(configToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widget-settings', userId] });
    },
  });

  // Cargar configuración desde localStorage al inicializar
  useEffect(() => {
    const loadLocalSettings = () => {
      try {
        const savedSettings = localStorage.getItem(WIDGET_SETTINGS_KEY);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({
            ...prev,
            ...parsed,
            lastUpdated: new Date(parsed.lastUpdated)
          }));
        }
      } catch (error) {
        console.warn('Error loading widget settings from localStorage:', error);
      }
    };

    loadLocalSettings();
  }, []);

  // Sincronizar con configuración del servidor
  useEffect(() => {
    if (serverSettings && syncWithServer) {
      setSettings(prev => ({
        ...prev,
        enabledWidgets: serverSettings.enabledWidgets || prev.enabledWidgets,
        widgetOrder: serverSettings.widgetOrder || prev.widgetOrder,
        widgetSizes: serverSettings.widgetSizes || prev.widgetSizes,
        lastUpdated: new Date()
      }));
    }
  }, [serverSettings, syncWithServer]);

  // Guardar en localStorage cuando cambie la configuración (debounced)
  useEffect(() => {
    if (autoSave && isInitialized.current) {
      try {
        localStorage.setItem(WIDGET_SETTINGS_KEY, JSON.stringify(debouncedSettings));
      } catch (error) {
        console.warn('Error saving widget settings to localStorage:', error);
      }
    }
  }, [debouncedSettings, autoSave]);

  // Mark as initialized after first load
  useEffect(() => {
    isInitialized.current = true;
  }, []);

  // Widgets disponibles según el rol del usuario
  const availableWidgets = useMemo(() => {
    return Object.values(WIDGET_REGISTRY).filter(widget => 
      canUserAccessWidget(widget.id, userRole)
    );
  }, [userRole]);

  // Widgets habilitados
  const enabledWidgets = useMemo(() => {
    return settings.enabledWidgets
      .map(id => WIDGET_REGISTRY[id])
      .filter(Boolean)
      .filter(widget => canUserAccessWidget(widget.id, userRole));
  }, [settings.enabledWidgets, userRole]);

  // Layout actual
  const layout = useMemo((): WidgetLayout => {
    const widgets: WidgetState[] = enabledWidgets.map((widget, index) => ({
      id: widget.id,
      type: widget.type,
      size: settings.widgetSizes[widget.id] || widget.defaultSize,
      position: settings.widgetPositions[widget.id] || {
        x: (index % 3) * 2,
        y: Math.floor(index / 3) * 2,
        width: 2,
        height: 2
      },
      isEnabled: true,
      isLoading: false,
      error: null
    }));

    return {
      id: `layout-${userId || 'default'}`,
      widgets,
      columns: settings.gridConfig.breakpoints[0].cols,
      rowHeight: settings.gridConfig.rowHeight,
      margin: settings.gridConfig.breakpoints[0].margin,
      containerPadding: settings.gridConfig.breakpoints[0].containerPadding,
      breakpoints: Object.fromEntries(
        settings.gridConfig.breakpoints.map(bp => [bp.breakpoint, bp.cols])
      ),
      cols: Object.fromEntries(
        settings.gridConfig.breakpoints.map(bp => [bp.breakpoint, bp.cols])
      )
    };
  }, [enabledWidgets, settings, userId]);

  // Función para verificar si el usuario puede acceder a un widget
  const canUserAccessWidget = useCallback((widgetId: string, role?: UserRole): boolean => {
    const widget = WIDGET_REGISTRY[widgetId];
    if (!widget) return false;
    
    const currentRole = role || userRole;
    if (!widget.requiredRole) return true;
    
    return widget.requiredRole.includes(currentRole);
  }, [userRole]);

  // Función para verificar si un widget está habilitado
  const isWidgetEnabled = useCallback((widgetId: string): boolean => {
    return settings.enabledWidgets.includes(widgetId);
  }, [settings.enabledWidgets]);

  // Función para obtener configuración de un widget
  const getWidgetConfig = useCallback((widgetId: string): WidgetConfig | undefined => {
    return WIDGET_REGISTRY[widgetId];
  }, []);

  // Función para habilitar un widget (optimized with stable callback)
  const enableWidget = useStableCallback((widgetId: string) => {
    if (!canUserAccessWidget(widgetId) || isWidgetEnabled(widgetId)) return;

    debouncedSetSettings(prev => ({
      ...prev,
      enabledWidgets: [...prev.enabledWidgets, widgetId],
      widgetOrder: [...prev.widgetOrder, widgetId],
      widgetSizes: {
        ...prev.widgetSizes,
        [widgetId]: WIDGET_REGISTRY[widgetId]?.defaultSize || WidgetSize.MEDIUM
      },
      lastUpdated: new Date()
    }));
  }, [canUserAccessWidget, isWidgetEnabled, debouncedSetSettings]);

  // Función para deshabilitar un widget (optimized with stable callback)
  const disableWidget = useStableCallback((widgetId: string) => {
    if (!isWidgetEnabled(widgetId)) return;

    debouncedSetSettings(prev => ({
      ...prev,
      enabledWidgets: prev.enabledWidgets.filter(id => id !== widgetId),
      widgetOrder: prev.widgetOrder.filter(id => id !== widgetId),
      lastUpdated: new Date()
    }));
  }, [isWidgetEnabled, debouncedSetSettings]);

  // Función para alternar un widget
  const toggleWidget = useCallback((widgetId: string) => {
    if (isWidgetEnabled(widgetId)) {
      disableWidget(widgetId);
    } else {
      enableWidget(widgetId);
    }
  }, [isWidgetEnabled, enableWidget, disableWidget]);

  // Función para reordenar widgets (optimized with stable callback)
  const reorderWidgets = useStableCallback((newOrder: string[]) => {
    debouncedSetSettings(prev => ({
      ...prev,
      widgetOrder: newOrder.filter(id => prev.enabledWidgets.includes(id)),
      lastUpdated: new Date()
    }));
  }, [debouncedSetSettings]);

  // Función para redimensionar un widget (optimized with stable callback)
  const resizeWidget = useStableCallback((widgetId: string, size: WidgetSize) => {
    const widget = WIDGET_REGISTRY[widgetId];
    if (!widget || !isWidgetEnabled(widgetId)) return;

    // Verificar que el tamaño esté dentro de los límites
    const sizeOrder = [WidgetSize.SMALL, WidgetSize.MEDIUM, WidgetSize.LARGE];
    const minIndex = sizeOrder.indexOf(widget.minSize);
    const maxIndex = widget.maxSize ? sizeOrder.indexOf(widget.maxSize) : sizeOrder.length - 1;
    const currentIndex = sizeOrder.indexOf(size);

    if (currentIndex < minIndex || currentIndex > maxIndex) return;

    debouncedSetSettings(prev => ({
      ...prev,
      widgetSizes: {
        ...prev.widgetSizes,
        [widgetId]: size
      },
      lastUpdated: new Date()
    }));
  }, [isWidgetEnabled, debouncedSetSettings]);

  // Función para mover un widget (optimized with stable callback)
  const moveWidget = useStableCallback((widgetId: string, position: WidgetPosition) => {
    if (!isWidgetEnabled(widgetId)) return;

    debouncedSetSettings(prev => ({
      ...prev,
      widgetPositions: {
        ...prev.widgetPositions,
        [widgetId]: position
      },
      lastUpdated: new Date()
    }));
  }, [isWidgetEnabled, debouncedSetSettings]);

  // Función para resetear a configuración por defecto
  const resetToDefaults = useCallback(() => {
    const defaultEnabledWidgets = DEFAULT_WIDGET_CONFIGS[userRole] || DEFAULT_WIDGET_CONFIGS[UserRole.VIEWER];
    
    setSettings({
      enabledWidgets: defaultEnabledWidgets,
      widgetOrder: defaultEnabledWidgets,
      widgetSizes: Object.fromEntries(
        defaultEnabledWidgets.map(id => [id, WIDGET_REGISTRY[id]?.defaultSize || WidgetSize.MEDIUM])
      ),
      widgetPositions: {},
      gridConfig: DEFAULT_GRID_CONFIG,
      lastUpdated: new Date()
    });
  }, [userRole]);

  // Función para guardar configuración
  const saveSettings = useCallback(async () => {
    if (syncWithServer && userId) {
      await saveMutation.mutateAsync(settings);
    }
  }, [syncWithServer, userId, settings, saveMutation]);

  // Función para cargar configuración
  const loadSettings = useCallback(async () => {
    if (syncWithServer && userId) {
      queryClient.invalidateQueries({ queryKey: ['widget-settings', userId] });
    }
  }, [syncWithServer, userId, queryClient]);

  return {
    // Estado actual
    settings,
    availableWidgets,
    enabledWidgets,
    layout,
    
    // Estados de carga
    isLoading,
    isError,
    error: error as Error | null,
    isSaving: saveMutation.isPending,
    
    // Funciones de configuración
    enableWidget,
    disableWidget,
    toggleWidget,
    reorderWidgets,
    resizeWidget,
    moveWidget,
    resetToDefaults,
    
    // Funciones de persistencia
    saveSettings,
    loadSettings,
    
    // Utilidades
    isWidgetEnabled,
    canUserAccessWidget,
    getWidgetConfig,
  };
};

// Hook auxiliar para obtener solo la configuración de un widget específico
export const useWidgetConfig = (widgetId: string) => {
  return useMemo(() => WIDGET_REGISTRY[widgetId], [widgetId]);
};

// Hook auxiliar para obtener widgets por categoría
export const useWidgetsByCategory = (userRole: UserRole = UserRole.VIEWER) => {
  return useMemo(() => {
    const widgets = Object.values(WIDGET_REGISTRY).filter(widget => {
      if (!widget.requiredRole) return true;
      return widget.requiredRole.includes(userRole);
    });

    const categories = widgets.reduce((acc, widget) => {
      const category = widget.category || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(widget);
      return acc;
    }, {} as Record<string, WidgetConfig[]>);

    return categories;
  }, [userRole]);
};

// Exportar constantes útiles
export const WIDGET_CONSTANTS = {
  WIDGET_REGISTRY,
  DEFAULT_WIDGET_CONFIGS,
  DEFAULT_GRID_CONFIG,
  WIDGET_SETTINGS_KEY,
  WIDGET_LAYOUT_KEY
};