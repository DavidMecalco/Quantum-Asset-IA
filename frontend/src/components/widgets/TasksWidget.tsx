import React, { useState, useMemo, useCallback } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Calendar,
  User,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  X
} from 'lucide-react';
import { WidgetContainer } from '../layout/WidgetContainer';
import { useUserTasks } from '../../hooks/useDashboardData';
import { useWidgetSettings } from '../../hooks/useWidgetSettings';
import { 
  Task, 
  TaskPriority, 
  TaskStatus
} from '../../types/dashboard';
import type { TaskFilters } from '../../types/dashboard';
import { WidgetProps, WidgetType } from '../../types/widgets';

// Props específicas para TasksWidget
interface TasksWidgetProps extends WidgetProps {
  maxTasks?: number;
  showFilters?: boolean;
  compactMode?: boolean;
}

// Componente para mostrar prioridad de tarea
const TaskPriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const getPriorityConfig = () => {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return {
          color: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: '🔴',
          label: 'Crítica'
        };
      case TaskPriority.HIGH:
        return {
          color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          icon: '🟠',
          label: 'Alta'
        };
      case TaskPriority.MEDIUM:
        return {
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          icon: '🟡',
          label: 'Media'
        };
      case TaskPriority.LOW:
        return {
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: '🟢',
          label: 'Baja'
        };
      default:
        return {
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          icon: '⚪',
          label: 'Sin prioridad'
        };
    }
  };

  const config = getPriorityConfig();

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

// Componente para mostrar estado de tarea
const TaskStatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case TaskStatus.PENDING:
        return {
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          icon: <Clock className="w-3 h-3" />,
          label: 'Pendiente'
        };
      case TaskStatus.IN_PROGRESS:
        return {
          color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          icon: <AlertTriangle className="w-3 h-3" />,
          label: 'En Progreso'
        };
      case TaskStatus.COMPLETED:
        return {
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: <CheckCircle2 className="w-3 h-3" />,
          label: 'Completada'
        };
      default:
        return {
          color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
          icon: <Clock className="w-3 h-3" />,
          label: 'Desconocido'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </span>
  );
};

// Componente para item individual de tarea
const TaskItem: React.FC<{
  task: Task;
  compactMode?: boolean;
  onTaskClick?: (task: Task) => void;
}> = ({ task, compactMode = false, onTaskClick }) => {
  const isOverdue = task.dueDate < new Date() && task.status !== TaskStatus.COMPLETED;
  const daysUntilDue = Math.ceil((task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const formatDueDate = () => {
    if (isOverdue) {
      return `Vencida hace ${Math.abs(daysUntilDue)} días`;
    } else if (daysUntilDue === 0) {
      return 'Vence hoy';
    } else if (daysUntilDue === 1) {
      return 'Vence mañana';
    } else if (daysUntilDue <= 7) {
      return `Vence en ${daysUntilDue} días`;
    } else {
      return task.dueDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  };

  const handleClick = () => {
    if (onTaskClick) {
      onTaskClick(task);
    }
  };

  if (compactMode) {
    return (
      <div 
        className="flex items-center justify-between p-2 hover:bg-glass-100/50 rounded-lg transition-colors duration-200 cursor-pointer group"
        onClick={handleClick}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <TaskPriorityBadge priority={task.priority} />
            <span className="text-white text-sm truncate">{task.title}</span>
          </div>
          {task.workOrderNumber && (
            <p className="text-glass-300 text-xs mt-1">WO: {task.workOrderNumber}</p>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-2">
          <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-glass-300'}`}>
            {formatDueDate()}
          </span>
          <ExternalLink className="w-3 h-3 text-glass-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="p-3 bg-glass-50/50 hover:bg-glass-100/50 rounded-lg transition-colors duration-200 cursor-pointer group border border-glass-100/50"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium text-sm truncate mb-1">{task.title}</h4>
          {task.description && (
            <p className="text-glass-300 text-xs line-clamp-2">{task.description}</p>
          )}
        </div>
        <ExternalLink className="w-4 h-4 text-glass-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2 flex-shrink-0" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TaskPriorityBadge priority={task.priority} />
          <TaskStatusBadge status={task.status} />
        </div>
        <div className="text-right">
          <div className={`text-xs ${isOverdue ? 'text-red-400 font-medium' : 'text-glass-300'}`}>
            <Calendar className="w-3 h-3 inline mr-1" />
            {formatDueDate()}
          </div>
          {task.assignedTo && (
            <div className="text-xs text-glass-400 mt-1">
              <User className="w-3 h-3 inline mr-1" />
              {task.assignedTo}
            </div>
          )}
        </div>
      </div>

      {task.workOrderNumber && (
        <div className="mt-2 pt-2 border-t border-glass-100/30">
          <span className="text-xs text-glass-400">Work Order: {task.workOrderNumber}</span>
        </div>
      )}
    </div>
  );
};

// Componente de filtros
const TaskFilters: React.FC<{
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  onClear: () => void;
}> = ({ filters, onFiltersChange, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = Object.values(filters).some(value => 
    Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ''
  );

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-glass-300 hover:text-white transition-colors duration-200"
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm">Filtros</span>
          {hasActiveFilters && (
            <span className="bg-quantum-blue/20 text-quantum-blue text-xs px-2 py-0.5 rounded-full">
              Activos
            </span>
          )}
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="text-xs text-glass-400 hover:text-red-400 transition-colors duration-200"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3 p-3 bg-glass-50/30 rounded-lg border border-glass-100/30">
          {/* Búsqueda por texto */}
          <div>
            <label className="block text-xs text-glass-300 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-glass-400" />
              <input
                type="text"
                value={filters.searchTerm || ''}
                onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
                placeholder="Buscar tareas..."
                className="w-full pl-7 pr-8 py-1.5 bg-glass-100/50 border border-glass-200/50 rounded-lg text-white text-xs placeholder-glass-400 focus:outline-none focus:border-quantum-blue/50"
              />
              {filters.searchTerm && (
                <button
                  onClick={() => onFiltersChange({ ...filters, searchTerm: '' })}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-glass-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-xs text-glass-300 mb-1">Estado</label>
            <div className="flex flex-wrap gap-1">
              {Object.values(TaskStatus).map((status) => {
                const isSelected = filters.status?.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => {
                      const currentStatuses = filters.status || [];
                      const newStatuses = isSelected
                        ? currentStatuses.filter(s => s !== status)
                        : [...currentStatuses, status];
                      onFiltersChange({ ...filters, status: newStatuses });
                    }}
                    className={`px-2 py-1 rounded text-xs transition-colors duration-200 ${
                      isSelected
                        ? 'bg-quantum-blue/20 text-quantum-blue border border-quantum-blue/30'
                        : 'bg-glass-100/50 text-glass-300 border border-glass-200/50 hover:bg-glass-200/50'
                    }`}
                  >
                    {status === TaskStatus.PENDING ? 'Pendiente' :
                     status === TaskStatus.IN_PROGRESS ? 'En Progreso' :
                     status === TaskStatus.COMPLETED ? 'Completada' : status}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro por prioridad */}
          <div>
            <label className="block text-xs text-glass-300 mb-1">Prioridad</label>
            <div className="flex flex-wrap gap-1">
              {Object.values(TaskPriority).map((priority) => {
                const isSelected = filters.priority?.includes(priority);
                return (
                  <button
                    key={priority}
                    onClick={() => {
                      const currentPriorities = filters.priority || [];
                      const newPriorities = isSelected
                        ? currentPriorities.filter(p => p !== priority)
                        : [...currentPriorities, priority];
                      onFiltersChange({ ...filters, priority: newPriorities });
                    }}
                    className={`px-2 py-1 rounded text-xs transition-colors duration-200 ${
                      isSelected
                        ? 'bg-quantum-blue/20 text-quantum-blue border border-quantum-blue/30'
                        : 'bg-glass-100/50 text-glass-300 border border-glass-200/50 hover:bg-glass-200/50'
                    }`}
                  >
                    {priority === TaskPriority.CRITICAL ? 'Crítica' :
                     priority === TaskPriority.HIGH ? 'Alta' :
                     priority === TaskPriority.MEDIUM ? 'Media' :
                     priority === TaskPriority.LOW ? 'Baja' : priority}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal TasksWidget
export const TasksWidget: React.FC<TasksWidgetProps> = ({
  id,
  size,
  isLoading: externalLoading = false,
  error: externalError = null,
  onRefresh,
  onResize,
  onRemove,
  className = '',
  maxTasks = 10,
  showFilters = true,
  compactMode = false
}) => {
  // Estados locales
  const [filters, setFilters] = useState<TaskFilters>({});
  const [showCompleted, setShowCompleted] = useState(false);

  // Hooks
  const { getWidgetConfig } = useWidgetSettings();
  const widgetConfig = getWidgetConfig(id);

  // Configurar filtros iniciales basados en configuración
  const initialFilters = useMemo(() => {
    const baseFilters: TaskFilters = { ...filters };
    
    // Si no se muestran completadas, filtrarlas
    if (!showCompleted) {
      baseFilters.status = [TaskStatus.PENDING, TaskStatus.IN_PROGRESS];
    }

    return baseFilters;
  }, [filters, showCompleted]);

  // Obtener datos de tareas
  const {
    data: tasks = [],
    isLoading,
    error,
    refresh
  } = useUserTasks(initialFilters, {
    refetchInterval: widgetConfig?.refreshInterval || 30000,
  });

  // Estado del widget
  const widgetState = {
    id,
    type: WidgetType.TASKS,
    size,
    position: { x: 0, y: 0, width: 1, height: 1 },
    isEnabled: true,
    isLoading: isLoading || externalLoading,
    error: error?.message || externalError,
    lastUpdated: new Date(),
    data: tasks
  };

  // Procesar y filtrar tareas
  const processedTasks = useMemo(() => {
    let filteredTasks = [...tasks];

    // Ordenar por prioridad y fecha de vencimiento
    filteredTasks.sort((a, b) => {
      // Primero por prioridad (crítica = 0, baja = 3)
      const priorityOrder = {
        [TaskPriority.CRITICAL]: 0,
        [TaskPriority.HIGH]: 1,
        [TaskPriority.MEDIUM]: 2,
        [TaskPriority.LOW]: 3
      };
      
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Luego por fecha de vencimiento
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

    // Limitar número de tareas mostradas
    return filteredTasks.slice(0, maxTasks);
  }, [tasks, maxTasks]);

  // Estadísticas de tareas
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === TaskStatus.PENDING).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const overdue = tasks.filter(t => 
      t.dueDate < new Date() && t.status !== TaskStatus.COMPLETED
    ).length;

    return { total, pending, inProgress, completed, overdue };
  }, [tasks]);

  // Manejadores de eventos
  const handleRefresh = useCallback(() => {
    refresh();
    if (onRefresh) onRefresh();
  }, [refresh, onRefresh]);

  const handleFiltersChange = useCallback((newFilters: TaskFilters) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleTaskClick = useCallback((task: Task) => {
    // Aquí se podría abrir un modal con detalles de la tarea
    // o navegar a la página de detalles
    console.log('Task clicked:', task);
    
    // Por ahora, si tiene workOrderNumber, simular navegación
    if (task.workOrderNumber) {
      // En una implementación real, esto navegaría a Maximo
      window.open(`/maximo/workorder/${task.workOrderNumber}`, '_blank');
    }
  }, []);

  const handleToggleCompleted = useCallback(() => {
    setShowCompleted(!showCompleted);
  }, [showCompleted]);

  // Renderizar contenido del widget
  const renderContent = () => {
    if (processedTasks.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-center">
          <div className="text-glass-300">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">No hay tareas pendientes</p>
            <p className="text-xs mt-1">¡Buen trabajo!</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-glass-50/30 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-white">{taskStats.pending + taskStats.inProgress}</div>
            <div className="text-xs text-glass-300">Activas</div>
          </div>
          <div className="bg-glass-50/30 rounded-lg p-2 text-center">
            <div className={`text-lg font-bold ${taskStats.overdue > 0 ? 'text-red-400' : 'text-white'}`}>
              {taskStats.overdue}
            </div>
            <div className="text-xs text-glass-300">Vencidas</div>
          </div>
        </div>

        {/* Filtros */}
        {showFilters && (
          <TaskFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClear={handleClearFilters}
          />
        )}

        {/* Toggle para mostrar completadas */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-glass-300">
            Mostrando {processedTasks.length} de {tasks.length} tareas
          </span>
          <button
            onClick={handleToggleCompleted}
            className={`text-xs px-2 py-1 rounded transition-colors duration-200 ${
              showCompleted
                ? 'bg-quantum-blue/20 text-quantum-blue'
                : 'text-glass-400 hover:text-white'
            }`}
          >
            {showCompleted ? 'Ocultar completadas' : 'Mostrar completadas'}
          </button>
        </div>

        {/* Lista de tareas */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {processedTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              compactMode={compactMode}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <WidgetContainer
      widget={widgetState}
      onRefresh={handleRefresh}
      onResize={onResize}
      onRemove={onRemove}
      className={className}
      title="Mis Tareas"
      subtitle={`${taskStats.pending + taskStats.inProgress} activas, ${taskStats.overdue} vencidas`}
      icon={<CheckCircle2 className="w-5 h-5" />}
      refreshInterval={widgetConfig?.refreshInterval || 30000}
    >
      {renderContent()}
    </WidgetContainer>
  );
};

export default TasksWidget;