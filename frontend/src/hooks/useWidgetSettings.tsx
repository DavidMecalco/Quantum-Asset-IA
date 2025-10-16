import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '../stores/authStore';
import {
  WidgetConfig,
  WidgetState,
  WidgetSize,
  WidgetType,
  WidgetCustomization,
  GridConfig
} from '../types/widgets';
import { UserRole } from '../types/auth';

// Configuración por defecto de widgets
const DEFAULT_WIDGET_CONFIGS: Record<WidgetType, WidgetConfig> = {
  [WidgetType.WELCOME]: {
    id: 'welcome',
    type: WidgetType.WELCOME,
    name: 'Bienvenida',
    description: 'Saludo personalizado y resumen de actividad',
    component: null as any, // Se asignará en runtime
    defaultSize: WidgetSize.MEDIUM,
    minSize: WidgetSize.SMALL,
    maxSize: WidgetSize.LARGE,
    isOptional: false,
    isResizable: true,
    isDraggable: true,
    category: 'general',
    icon: 'user'
  },
  [WidgetType.SYSTEM_STATUS]: {
    id: 'system-status',
    type: WidgetType.SYSTEM_STATUS,
    name: 'Estado del Sistema',
    description: 'Conectividad y rendimiento de Maximo',
    component: null as any,
    defaultSize: WidgetSize.MEDIUM,
    minSize: WidgetSize.SMALL,
    maxSize: WidgetSize.LARGE,
    isOptional: false,
    isResizable: true,
    isDraggable: true,
    category: 'system',
    icon: 'activity',
    refreshInterval: 30000
  },
  [WidgetType.TASKS]: {
    id: 'tasks',
    type: WidgetType.TASKS,
    name: 'Tareas',
    description: 'Work orders y tareas pendientes',
    component: null as any,
    defaultSize: WidgetSize.LARGE,
    minSize: WidgetSize.MEDIUM,
    maxSize: WidgetSize.LARGE,
    isOptional: false,
    isResizable: true,
    isDraggable: true,
    category: 'work',
    icon: 'clipboard-list',
    refreshInterval: 60000
  },
  [WidgetType.METRICS]: {
    id: 'metrics',
    type: WidgetType.METRICS,
    name: 'Métricas del Sistema',
    description: 'Estadísticas y rendimiento para administradores',
    component: null as any,
    defaultSize: WidgetSize.LARGE,
    minSize: WidgetSize.MEDIUM,
    maxSize: WidgetSize.LARGE,
    requiredRole: [UserRole.ADMIN],
    isOptional: true,
    isResizable: true,
    isDraggable: true,
    category: 'admin',
    icon: 'bar-chart',
    refreshInterval: 60000
  },
  [WidgetType.QUICK_ACTIONS]: {
    id: 'quick-actions',
    type: WidgetType.QUICK_ACTIONS,
    name: 'Acciones Rápidas',
    description: 'Accesos directos a funciones principales',
    component: null as any,
    defaultSize: WidgetSize.MEDIUM,
    minSize: WidgetSize.SMALL,
    maxSize: WidgetSize.LARGE,
    isOptional: true,
    isResizable: true,
    isDraggable: true,
    category: 'navigation',
    icon: 'zap'
  },
  [WidgetType.NOTIFICATIONS]: {
    id: 'notifications',
    type: WidgetType.NOTIFICATIONS,
    name: 'Notificaciones',
    description: 'Centro de notificaciones y alertas',
    component: null as any,
    defaultSize: WidgetSize.MEDIUM,
    minSize: WidgetSize.SMALL,
    maxSize: WidgetSize.LARGE,
    isOptional: false,
    isResizable: true,
    isDraggable: true,
    category: 'communication',
    icon: 'bell',
    refreshInterval: 30000
  },
  [WidgetType.WEATHER]: {
    id: 'weather',
    type: WidgetType.WEATHER,
    name: 'Clima',
    description: 'Información meteorológica local',
    component: null as any,
    defaultSize: WidgetSize.SMALL,
    minSize: WidgetSize.SMALL,
    maxSize: WidgetSize.MEDIUM,
    isOptional: true,
    isResizable: true,
    isDraggable: true,
    category: 'general',
    icon: 'cloud'
  }
};

// Configuración por defecto del grid responsivo
const DEFAULT_GRID_CONFIG: GridConfig = {
  breakpoints: [
    { breakpoint: 'lg', cols: 4, margin: [16, 16], containerPadding: [16, 16] },
    { breakpoint: 'md', cols: 3, margin: [12, 12], containerPadding: [12, 12] },
    { breakpoint: 'sm', cols: 2, margin: [8, 8], containerPadding: [8, 8] },
    { breakpoint: 'xs', cols: 1, margin: [8, 8], containerPadding: [8, 8] }
  ],
  rowHeight: 120,
  maxRows: 10,
  isDraggable: true,
  isResizable: true,
  preventCollision: false,
  compactType: 'vertical'
};

// Configuraciones por defecto según rol
const getDefaultWidgetsByRole = (role: UserRole): WidgetType[] => {
  const baseWidgets = [
    WidgetType.WELCOME,
    WidgetType.SYSTEM_STATUS,
    WidgetType.TASKS,
    WidgetType.NOTIFICATIONS
  ];

  switch (role) {
    case UserRole.ADMIN:
      return [
        ...baseWidgets,
        WidgetType.METRICS,
        WidgetType.QUICK_ACTIONS
      ];
    case UserRole.USER:
      return [
        ...baseWidgets,
        WidgetType.QUICK_ACTIONS
      ];
    case UserRole.VIEWER:
    default:
      return baseWidgets;
  }
};

// Posiciones por defecto para widgets
const getDefaultLayout = (enabledWidgets: WidgetType[]): WidgetState[] => {
  const positions: Record<WidgetType, { x: number; y: number; w: number; h: number }> = {
    [WidgetType.WELCOME]: { x: 0, y: 0, w: 2, h: 2 },
    [WidgetType.SYSTEM_STATUS]: { x: 2, y: 0, w: 2, h: 2 },
    [WidgetType.TASKS]: { x: 0, y: 2, w: 4, h: 3 },
    [WidgetType.NOTIFICATIONS]: { x: 0, y: 5, w: 2, h: 3 },
    [WidgetType.QUICK_ACTIONS]: { x: 2, y: 5, w: 2, h: 2 },
    [WidgetType.METRICS]: { x: 0, y: 8, w: 4, h: 3 },
    [WidgetType.WEATHER]: { x: 3, y: 0, w: 1, h: 2 }
  };

  return enabledWidgets.map((widgetType, index) => {
    const config = DEFAULT_WIDGET_CONFIGS[widgetType];
    const pos = positions[widgetType] || { x: 0, y: index * 2, w: 2, h: 2 };
    
    return {
      id: config.id,
      type: widgetType,
      size: config.defaultSize,
      position: {
        x: pos.x,
        y: pos.y,
        width: pos.w,
        height: pos.h
      },
      isEnabled: true,
      isLoading: false,
      error: null,
      settings: {}
    };
  });
};

// Clave para localStorage
const getStorageKey = (userId: string) => `dashboard_settings_${userId}`;

// Interface para configuración guardada
interface SavedWidgetSettings {
  enabledWidgets: WidgetType[];
  widgetStates: WidgetState[];
  gridConfig: GridConfig;
  customizations: Record<string, WidgetCustomization>;
  version: number;
  lastUpdated: string;
}

export const useWidgetSettings = () => {
  const { user, isAuthenticated } = useAuthStore();
  
  // Estados locales
  const [enabledWidgets, setEnabledWidgets] = useState<WidgetType[]>([]);
  const [widgetStates, setWidgetStates] = useState<WidgetState[]>([]);
  const [gridConfig, setGridConfig] = useState<GridConfig>(DEFAULT_GRID_CONFIG);
  const [customizations, setCustomizations] = useState<Record<string, WidgetCustomization>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Widgets disponibles según rol del usuario
  const availableWidgets = useMemo(() => {
    if (!user) return [];
    
    return Object.values(DEFAULT_WIDGET_CONFIGS).filter(config => {
      if (!config.requiredRole) return true;
      return config.requiredRole.includes(user.role);
    });
  }, [user]);

  // Cargar configuración desde localStorage
  const loadSettings = useCallback(() => {
    if (!user || !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const storageKey = getStorageKey(user.id);
      const savedData = localStorage.getItem(storageKey);
      
      if (savedData) {
        const parsed: SavedWidgetSettings = JSON.parse(savedData);
        
        // Validar que los widgets guardados estén disponibles para el rol actual
        const validWidgets = parsed.enabledWidgets.filter(widgetType => 
          availableWidgets.some(config => config.type === widgetType)
        );
        
        setEnabledWidgets(validWidgets);
        setWidgetStates(parsed.widgetStates || getDefaultLayout(validWidgets));
        setGridConfig({ ...DEFAULT_GRID_CONFIG, ...parsed.gridConfig });
        setCustomizations(parsed.customizations || {});
      } else {
        // Configuración por defecto para nuevo usuario
        const defaultWidgets = getDefaultWidgetsByRole(user.role);
        setEnabledWidgets(defaultWidgets);
        setWidgetStates(getDefaultLayout(defaultWidgets));
        setGridConfig(DEFAULT_GRID_CONFIG);
        setCustomizations({});
      }
    } catch (error) {
      console.error('Error loading widget settings:', error);
      // Fallback a configuración por defecto
      const defaultWidgets = getDefaultWidgetsByRole(user.role);
      setEnabledWidgets(defaultWidgets);
      setWidgetStates(getDefaultLayout(defaultWidgets));
      setGridConfig(DEFAULT_GRID_CONFIG);
      setCustomizations({});
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated, availableWidgets]);

  // Guardar configuración en localStorage
  const saveSettings = useCallback(() => {
    if (!user || !isAuthenticated) return;

    try {
      const storageKey = getStorageKey(user.id);
      const dataToSave: SavedWidgetSettings = {
        enabledWidgets,
        widgetStates,
        gridConfig,
        customizations,
        version: 1,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving widget settings:', error);
    }
  }, [user, isAuthenticated, enabledWidgets, widgetStates, gridConfig, customizations]);

  // Auto-guardar cuando hay cambios
  useEffect(() => {
    if (hasUnsavedChanges && !isLoading) {
      const timeoutId = setTimeout(saveSettings, 1000); // Debounce de 1 segundo
      return () => clearTimeout(timeoutId);
    }
  }, [hasUnsavedChanges, isLoading, saveSettings]);

  // Cargar configuración al montar o cambiar usuario
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Habilitar/deshabilitar widget
  const toggleWidget = useCallback((widgetType: WidgetType, enabled?: boolean) => {
    const isEnabled = enabled !== undefined ? enabled : !enabledWidgets.includes(widgetType);
    
    if (isEnabled) {
      // Habilitar widget
      if (!enabledWidgets.includes(widgetType)) {
        const newEnabledWidgets = [...enabledWidgets, widgetType];
        setEnabledWidgets(newEnabledWidgets);
        
        // Agregar estado del widget
        const config = DEFAULT_WIDGET_CONFIGS[widgetType];
        const newWidgetState: WidgetState = {
          id: config.id,
          type: widgetType,
          size: config.defaultSize,
          position: {
            x: 0,
            y: Math.max(...widgetStates.map(w => w.position.y + w.position.height), 0),
            width: 2,
            height: 2
          },
          isEnabled: true,
          isLoading: false,
          error: null,
          settings: {}
        };
        
        setWidgetStates(prev => [...prev, newWidgetState]);
        setHasUnsavedChanges(true);
      }
    } else {
      // Deshabilitar widget
      setEnabledWidgets(prev => prev.filter(w => w !== widgetType));
      setWidgetStates(prev => prev.filter(w => w.type !== widgetType));
      setHasUnsavedChanges(true);
    }
  }, [enabledWidgets, widgetStates]);

  // Actualizar posición de widget
  const updateWidgetPosition = useCallback((widgetId: string, position: Partial<WidgetState['position']>) => {
    setWidgetStates(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, position: { ...widget.position, ...position } }
        : widget
    ));
    setHasUnsavedChanges(true);
  }, []);

  // Actualizar tamaño de widget
  const updateWidgetSize = useCallback((widgetId: string, size: WidgetSize) => {
    setWidgetStates(prev => prev.map(widget => 
      widget.id === widgetId 
        ? { ...widget, size }
        : widget
    ));
    setHasUnsavedChanges(true);
  }, []);

  // Actualizar configuración personalizada de widget
  const updateWidgetCustomization = useCallback((widgetId: string, settings: Record<string, any>) => {
    if (!user) return;

    const customization: WidgetCustomization = {
      userId: user.id,
      widgetId,
      settings,
      updatedAt: new Date()
    };

    setCustomizations(prev => ({
      ...prev,
      [widgetId]: customization
    }));
    setHasUnsavedChanges(true);
  }, [user]);

  // Resetear a configuración por defecto
  const resetToDefaults = useCallback(() => {
    if (!user) return;

    const defaultWidgets = getDefaultWidgetsByRole(user.role);
    setEnabledWidgets(defaultWidgets);
    setWidgetStates(getDefaultLayout(defaultWidgets));
    setGridConfig(DEFAULT_GRID_CONFIG);
    setCustomizations({});
    setHasUnsavedChanges(true);
  }, [user]);

  // Actualizar layout completo (para drag & drop)
  const updateLayout = useCallback((newLayout: WidgetState[]) => {
    setWidgetStates(newLayout);
    setHasUnsavedChanges(true);
  }, []);

  // Obtener configuración de un widget específico
  const getWidgetConfig = useCallback((widgetType: WidgetType): WidgetConfig | null => {
    return DEFAULT_WIDGET_CONFIGS[widgetType] || null;
  }, []);

  // Obtener estado de un widget específico
  const getWidgetState = useCallback((widgetId: string): WidgetState | null => {
    return widgetStates.find(w => w.id === widgetId) || null;
  }, [widgetStates]);

  // Verificar si un widget está habilitado
  const isWidgetEnabled = useCallback((widgetType: WidgetType): boolean => {
    return enabledWidgets.includes(widgetType);
  }, [enabledWidgets]);

  // Obtener widgets por categoría
  const getWidgetsByCategory = useCallback(() => {
    const categories: Record<string, WidgetConfig[]> = {};
    
    availableWidgets.forEach(config => {
      const category = config.category || 'general';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(config);
    });
    
    return categories;
  }, [availableWidgets]);

  // Estadísticas de widgets
  const stats = useMemo(() => ({
    total: availableWidgets.length,
    enabled: enabledWidgets.length,
    disabled: availableWidgets.length - enabledWidgets.length,
    byCategory: Object.entries(getWidgetsByCategory()).reduce((acc, [category, widgets]) => {
      acc[category] = {
        total: widgets.length,
        enabled: widgets.filter(w => enabledWidgets.includes(w.type)).length
      };
      return acc;
    }, {} as Record<string, { total: number; enabled: number }>)
  }), [availableWidgets, enabledWidgets, getWidgetsByCategory]);

  return {
    // Estados
    enabledWidgets,
    widgetStates,
    gridConfig,
    customizations,
    availableWidgets,
    isLoading,
    hasUnsavedChanges,
    stats,

    // Acciones
    toggleWidget,
    updateWidgetPosition,
    updateWidgetSize,
    updateWidgetCustomization,
    updateLayout,
    resetToDefaults,
    saveSettings,
    loadSettings,

    // Utilidades
    getWidgetConfig,
    getWidgetState,
    isWidgetEnabled,
    getWidgetsByCategory,

    // Configuraciones por defecto
    defaultConfigs: DEFAULT_WIDGET_CONFIGS,
    defaultGridConfig: DEFAULT_GRID_CONFIG
  };
};