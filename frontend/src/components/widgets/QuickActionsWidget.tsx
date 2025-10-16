import React, { useMemo, useCallback } from 'react';
import { 
  Plus,
  Search,
  FileText,
  Settings,
  BarChart3,
  Users,
  Wrench,
  Package,
  Calendar,
  Bell,
  ExternalLink,
  ArrowRight,
  Zap,
  Database,
  Shield,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { WidgetContainer } from '../layout/WidgetContainer';
import { useAuthStore } from '../../stores/authStore';
import { WidgetProps, WidgetType } from '../../types/widgets';
import { UserRole } from '../../types/auth';

// Props específicas para QuickActionsWidget
interface QuickActionsWidgetProps extends WidgetProps {
  maxActions?: number;
  showCategories?: boolean;
  compactMode?: boolean;
}

// Definición de una acción rápida
interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  url?: string;
  onClick?: () => void;
  isExternal?: boolean;
  requiredRole?: UserRole[];
  category: 'create' | 'search' | 'reports' | 'admin' | 'tools';
  priority: number; // 1 = alta prioridad, 5 = baja prioridad
  color?: string;
}

// Configuración de acciones disponibles
const AVAILABLE_ACTIONS: QuickAction[] = [
  // Acciones de creación
  {
    id: 'create-work-order',
    label: 'Nueva Work Order',
    description: 'Crear nueva orden de trabajo',
    icon: Plus,
    url: '/maximo/workorder/create',
    isExternal: true,
    category: 'create',
    priority: 1,
    color: 'text-green-400'
  },
  {
    id: 'create-asset',
    label: 'Nuevo Asset',
    description: 'Registrar nuevo activo',
    icon: Package,
    url: '/maximo/asset/create',
    isExternal: true,
    requiredRole: [UserRole.ADMIN, UserRole.USER],
    category: 'create',
    priority: 2,
    color: 'text-blue-400'
  },
  {
    id: 'schedule-maintenance',
    label: 'Programar Mantenimiento',
    description: 'Agendar mantenimiento preventivo',
    icon: Calendar,
    url: '/maximo/preventive/schedule',
    isExternal: true,
    category: 'create',
    priority: 3,
    color: 'text-purple-400'
  },

  // Acciones de búsqueda
  {
    id: 'search-work-orders',
    label: 'Buscar Work Orders',
    description: 'Buscar órdenes de trabajo',
    icon: Search,
    url: '/maximo/workorder/search',
    isExternal: true,
    category: 'search',
    priority: 1,
    color: 'text-cyan-400'
  },
  {
    id: 'search-assets',
    label: 'Buscar Assets',
    description: 'Buscar activos del sistema',
    icon: Database,
    url: '/maximo/asset/search',
    isExternal: true,
    category: 'search',
    priority: 2,
    color: 'text-indigo-400'
  },
  {
    id: 'inventory-lookup',
    label: 'Consultar Inventario',
    description: 'Verificar stock y ubicaciones',
    icon: Package,
    url: '/maximo/inventory/lookup',
    isExternal: true,
    category: 'search',
    priority: 3,
    color: 'text-orange-400'
  },

  // Reportes
  {
    id: 'work-order-reports',
    label: 'Reportes WO',
    description: 'Reportes de órdenes de trabajo',
    icon: BarChart3,
    url: '/maximo/reports/workorders',
    isExternal: true,
    category: 'reports',
    priority: 1,
    color: 'text-emerald-400'
  },
  {
    id: 'asset-reports',
    label: 'Reportes Assets',
    description: 'Reportes de activos y rendimiento',
    icon: FileText,
    url: '/maximo/reports/assets',
    isExternal: true,
    category: 'reports',
    priority: 2,
    color: 'text-teal-400'
  },
  {
    id: 'maintenance-reports',
    label: 'Reportes Mantenimiento',
    description: 'Análisis de mantenimiento',
    icon: Wrench,
    url: '/maximo/reports/maintenance',
    isExternal: true,
    category: 'reports',
    priority: 3,
    color: 'text-yellow-400'
  },

  // Herramientas
  {
    id: 'mobile-app',
    label: 'App Móvil',
    description: 'Descargar aplicación móvil',
    icon: Download,
    url: '/downloads/mobile-app',
    isExternal: true,
    category: 'tools',
    priority: 1,
    color: 'text-pink-400'
  },
  {
    id: 'notifications',
    label: 'Centro de Notificaciones',
    description: 'Ver todas las notificaciones',
    icon: Bell,
    onClick: () => {
      // Abrir modal de notificaciones
      console.log('Opening notifications center');
    },
    category: 'tools',
    priority: 2,
    color: 'text-red-400'
  },
  {
    id: 'quick-tools',
    label: 'Herramientas Rápidas',
    description: 'Calculadoras y utilidades',
    icon: Zap,
    url: '/tools',
    category: 'tools',
    priority: 3,
    color: 'text-violet-400'
  },

  // Administración (solo para admins)
  {
    id: 'user-management',
    label: 'Gestión de Usuarios',
    description: 'Administrar usuarios del sistema',
    icon: Users,
    url: '/admin/users',
    requiredRole: [UserRole.ADMIN],
    category: 'admin',
    priority: 1,
    color: 'text-rose-400'
  },
  {
    id: 'system-settings',
    label: 'Configuración Sistema',
    description: 'Configurar parámetros del sistema',
    icon: Settings,
    url: '/admin/settings',
    requiredRole: [UserRole.ADMIN],
    category: 'admin',
    priority: 2,
    color: 'text-amber-400'
  },
  {
    id: 'security-audit',
    label: 'Auditoría de Seguridad',
    description: 'Revisar logs y accesos',
    icon: Shield,
    url: '/admin/security',
    requiredRole: [UserRole.ADMIN],
    category: 'admin',
    priority: 3,
    color: 'text-red-500'
  }
];

// Configuración de categorías
const CATEGORY_CONFIG = {
  create: {
    label: 'Crear',
    icon: Plus,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10'
  },
  search: {
    label: 'Buscar',
    icon: Search,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10'
  },
  reports: {
    label: 'Reportes',
    icon: BarChart3,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10'
  },
  tools: {
    label: 'Herramientas',
    icon: Zap,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10'
  },
  admin: {
    label: 'Administración',
    icon: Settings,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10'
  }
};

// Componente para una acción individual
const ActionButton: React.FC<{
  action: QuickAction;
  compactMode?: boolean;
  onClick: (action: QuickAction) => void;
}> = ({ action, compactMode = false, onClick }) => {
  const IconComponent = action.icon;

  const handleClick = () => {
    onClick(action);
  };

  if (compactMode) {
    return (
      <button
        onClick={handleClick}
        className="flex items-center space-x-2 w-full p-2 hover:bg-glass-100/50 rounded-lg transition-colors duration-200 group"
        title={action.description}
      >
        <div className={`flex-shrink-0 ${action.color || 'text-glass-300'}`}>
          <IconComponent className="w-4 h-4" />
        </div>
        <span className="text-white text-sm truncate flex-1 text-left">{action.label}</span>
        {action.isExternal && (
          <ExternalLink className="w-3 h-3 text-glass-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        )}
        {!action.isExternal && (
          <ArrowRight className="w-3 h-3 text-glass-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center p-3 bg-glass-50/30 hover:bg-glass-100/50 rounded-lg transition-all duration-200 group border border-glass-100/30 hover:border-glass-200/50"
    >
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg mb-2 ${
        CATEGORY_CONFIG[action.category]?.bgColor || 'bg-glass-100/50'
      }`}>
        <IconComponent className={`w-5 h-5 ${action.color || 'text-glass-300'}`} />
      </div>
      <span className="text-white text-xs font-medium text-center leading-tight mb-1">
        {action.label}
      </span>
      {action.description && (
        <span className="text-glass-400 text-xs text-center line-clamp-2">
          {action.description}
        </span>
      )}
      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {action.isExternal ? (
          <ExternalLink className="w-3 h-3 text-glass-400" />
        ) : (
          <ArrowRight className="w-3 h-3 text-glass-400" />
        )}
      </div>
    </button>
  );
};

// Componente para mostrar acciones por categoría
const CategorySection: React.FC<{
  category: keyof typeof CATEGORY_CONFIG;
  actions: QuickAction[];
  compactMode?: boolean;
  onActionClick: (action: QuickAction) => void;
}> = ({ category, actions, compactMode = false, onActionClick }) => {
  const config = CATEGORY_CONFIG[category];
  const IconComponent = config.icon;

  if (actions.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center space-x-2 mb-3">
        <div className={`flex items-center justify-center w-6 h-6 rounded ${config.bgColor}`}>
          <IconComponent className={`w-4 h-4 ${config.color}`} />
        </div>
        <h4 className="text-sm font-medium text-glass-200">{config.label}</h4>
        <span className="text-xs text-glass-400">({actions.length})</span>
      </div>
      
      {compactMode ? (
        <div className="space-y-1">
          {actions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              compactMode={compactMode}
              onClick={onActionClick}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <ActionButton
              key={action.id}
              action={action}
              compactMode={compactMode}
              onClick={onActionClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente principal QuickActionsWidget
export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
  id,
  size,
  isLoading = false,
  error = null,
  onRefresh,
  onResize,
  onRemove,
  className = '',
  maxActions = 12,
  showCategories = true,
  compactMode = false
}) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Crear widget state para el container
  const widgetState = {
    id,
    type: WidgetType.QUICK_ACTIONS,
    size,
    position: { x: 0, y: 0, width: 2, height: 2 },
    isEnabled: true,
    isLoading,
    error,
    settings: {}
  };

  // Filtrar acciones según el rol del usuario
  const availableActions = useMemo(() => {
    if (!user) return [];

    return AVAILABLE_ACTIONS
      .filter(action => {
        // Si la acción requiere roles específicos, verificar que el usuario tenga uno de ellos
        if (action.requiredRole && action.requiredRole.length > 0) {
          return action.requiredRole.includes(user.role);
        }
        return true;
      })
      .sort((a, b) => {
        // Ordenar por prioridad (menor número = mayor prioridad)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // Si tienen la misma prioridad, ordenar alfabéticamente
        return a.label.localeCompare(b.label);
      })
      .slice(0, maxActions);
  }, [user, maxActions]);

  // Agrupar acciones por categoría
  const actionsByCategory = useMemo(() => {
    const grouped: Record<string, QuickAction[]> = {};
    
    availableActions.forEach(action => {
      if (!grouped[action.category]) {
        grouped[action.category] = [];
      }
      grouped[action.category].push(action);
    });

    return grouped;
  }, [availableActions]);

  // Determinar si usar modo compacto basado en el tamaño
  const useCompactMode = compactMode || size === 'small';

  // Manejador de clic en acción
  const handleActionClick = useCallback((action: QuickAction) => {
    if (action.onClick) {
      // Ejecutar función personalizada
      action.onClick();
    } else if (action.url) {
      if (action.isExternal) {
        // Abrir en nueva ventana/pestaña
        window.open(action.url, '_blank', 'noopener,noreferrer');
      } else {
        // Navegar internamente
        navigate(action.url);
      }
    }
  }, [navigate]);

  // Renderizar contenido del widget
  const renderContent = () => {
    if (availableActions.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-glass-300">
            <Zap className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No hay acciones disponibles</p>
            <p className="text-xs mt-1">Contacta al administrador</p>
          </div>
        </div>
      );
    }

    if (showCategories && !useCompactMode) {
      // Mostrar acciones agrupadas por categoría
      return (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Object.entries(actionsByCategory).map(([category, actions]) => (
            <CategorySection
              key={category}
              category={category as keyof typeof CATEGORY_CONFIG}
              actions={actions}
              compactMode={useCompactMode}
              onActionClick={handleActionClick}
            />
          ))}
        </div>
      );
    } else {
      // Mostrar todas las acciones en una lista/grid simple
      if (useCompactMode) {
        return (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {availableActions.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                compactMode={useCompactMode}
                onClick={handleActionClick}
              />
            ))}
          </div>
        );
      } else {
        return (
          <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {availableActions.map((action) => (
              <ActionButton
                key={action.id}
                action={action}
                compactMode={useCompactMode}
                onClick={handleActionClick}
              />
            ))}
          </div>
        );
      }
    }
  };

  return (
    <WidgetContainer
      widget={widgetState}
      title="Acciones Rápidas"
      subtitle={`${availableActions.length} acciones disponibles`}
      icon={<Zap className="w-4 h-4" />}
      onRefresh={onRefresh}
      onResize={onResize}
      onRemove={onRemove}
      className={className}
    >
      <div className="h-full flex flex-col">
        {/* Información del usuario (solo en modo no compacto) */}
        {!useCompactMode && user && (
          <div className="mb-4 p-2 bg-glass-50/30 rounded-lg border border-glass-100/30">
            <p className="text-xs text-glass-300">
              Acciones para <span className="text-white font-medium capitalize">{user.role}</span>
            </p>
          </div>
        )}

        {/* Contenido principal */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>

        {/* Pie del widget con información adicional */}
        {!useCompactMode && (
          <div className="mt-4 pt-3 border-t border-glass-100/30">
            <div className="flex items-center justify-between text-xs text-glass-400">
              <span>💡 Tip: Usa Ctrl+K para acceso rápido</span>
              <span>{availableActions.length}/{AVAILABLE_ACTIONS.length}</span>
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

export default QuickActionsWidget;