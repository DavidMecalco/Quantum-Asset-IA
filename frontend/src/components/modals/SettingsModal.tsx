import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  X,
  Settings,
  RotateCcw,
  Save,
  Grid,
  Maximize2,
  Minimize2,
  Info,
  Check,
  AlertCircle,
  Zap,
  Activity,
  ClipboardList,
  BarChart,
  Bell,
  User,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { WidgetConfig, WidgetSize, WidgetType } from '../../types/widgets';
import { UserRole } from '../../types/auth';
import { useWidgetSettings, useWidgetsByCategory } from '../../hooks/useWidgetSettings';

// Props del modal
interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: UserRole;
  userId?: string;
}

// Función para obtener el icono de un widget
const getWidgetIcon = (type: WidgetType, className: string = 'w-5 h-5') => {
  switch (type) {
    case WidgetType.WELCOME:
      return <User className={className} />;
    case WidgetType.SYSTEM_STATUS:
      return <Activity className={className} />;
    case WidgetType.TASKS:
      return <ClipboardList className={className} />;
    case WidgetType.METRICS:
      return <BarChart className={className} />;
    case WidgetType.QUICK_ACTIONS:
      return <Zap className={className} />;
    case WidgetType.NOTIFICATIONS:
      return <Bell className={className} />;
    default:
      return <Grid className={className} />;
  }
};

// Función para obtener el color de un tamaño de widget
const getSizeColor = (size: WidgetSize) => {
  switch (size) {
    case WidgetSize.SMALL:
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case WidgetSize.MEDIUM:
      return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case WidgetSize.LARGE:
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    default:
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

// Función para obtener el icono de tamaño
const getSizeIcon = (size: WidgetSize, className: string = 'w-4 h-4') => {
  switch (size) {
    case WidgetSize.SMALL:
      return <Minimize2 className={className} />;
    case WidgetSize.MEDIUM:
      return <Grid className={className} />;
    case WidgetSize.LARGE:
      return <Maximize2 className={className} />;
    default:
      return <Grid className={className} />;
  }
};

// Componente para configurar un widget individual
const WidgetConfigItem: React.FC<{
  widget: WidgetConfig;
  isEnabled: boolean;
  currentSize: WidgetSize;
  onToggle: () => void;
  onSizeChange: (size: WidgetSize) => void;
  canUserAccess: boolean;
}> = ({ widget, isEnabled, currentSize, onToggle, onSizeChange, canUserAccess }) => {
  const [showSizeOptions, setShowSizeOptions] = useState(false);

  // Tamaños disponibles para este widget
  const availableSizes = useMemo(() => {
    const sizes = [WidgetSize.SMALL, WidgetSize.MEDIUM, WidgetSize.LARGE];
    const minIndex = sizes.indexOf(widget.minSize);
    const maxIndex = widget.maxSize ? sizes.indexOf(widget.maxSize) : sizes.length - 1;
    
    return sizes.slice(minIndex, maxIndex + 1);
  }, [widget.minSize, widget.maxSize]);

  if (!canUserAccess) {
    return null;
  }

  return (
    <div className="p-4 bg-glass-50 rounded-lg border border-glass-200">
      <div className="flex items-start justify-between">
        {/* Información del widget */}
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 p-2 bg-glass-100 rounded-lg">
            {getWidgetIcon(widget.type, 'w-5 h-5 text-glass-300')}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-medium text-white truncate">
                {widget.name}
              </h4>
              {widget.requiredRole && (
                <span className="px-2 py-1 text-xs font-medium bg-purple-500/20 text-purple-400 rounded-full">
                  Restringido
                </span>
              )}
              {!widget.isOptional && (
                <span className="px-2 py-1 text-xs font-medium bg-orange-500/20 text-orange-400 rounded-full">
                  Requerido
                </span>
              )}
            </div>
            
            {widget.description && (
              <p className="text-xs text-glass-400 mt-1 line-clamp-2">
                {widget.description}
              </p>
            )}

            {/* Configuración de tamaño */}
            {isEnabled && widget.isResizable && (
              <div className="mt-3">
                <button
                  onClick={() => setShowSizeOptions(!showSizeOptions)}
                  className="flex items-center space-x-2 text-xs text-glass-300 hover:text-white transition-colors duration-200"
                >
                  {getSizeIcon(currentSize, 'w-3 h-3')}
                  <span>Tamaño: {currentSize}</span>
                  {showSizeOptions ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {showSizeOptions && (
                  <div className="mt-2 flex items-center space-x-2">
                    {availableSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => onSizeChange(size)}
                        className={`
                          px-2 py-1 text-xs font-medium rounded border transition-all duration-200
                          ${currentSize === size 
                            ? getSizeColor(size)
                            : 'text-glass-400 bg-glass-100 border-glass-200 hover:text-white hover:bg-glass-200'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-1">
                          {getSizeIcon(size, 'w-3 h-3')}
                          <span className="capitalize">{size}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Toggle switch */}
        <div className="flex-shrink-0 ml-4">
          <button
            onClick={onToggle}
            disabled={!widget.isOptional && isEnabled}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
              ${isEnabled 
                ? 'bg-quantum-blue' 
                : 'bg-glass-200'
              }
              ${!widget.isOptional && isEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
            title={!widget.isOptional && isEnabled ? 'Este widget es requerido' : undefined}
          >
            <span
              className={`
                inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
                ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal del modal
export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userRole = UserRole.USER,
  userId
}) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    general: true,
    system: true,
    work: true,
    analytics: true,
    navigation: true,
    communication: true
  });

  // Hook para configuración de widgets
  const {
    settings,
    isLoading,
    isError,
    error,
    isSaving: hookIsSaving,
    enableWidget,
    disableWidget,
    resizeWidget,
    resetToDefaults,
    saveSettings,
    isWidgetEnabled,
    canUserAccessWidget
  } = useWidgetSettings({
    userRole,
    userId,
    autoSave: false, // Deshabilitamos auto-save para el modal
    syncWithServer: true
  });

  // Hook para widgets por categoría
  const widgetsByCategory = useWidgetsByCategory(userRole);

  // Categorías con nombres amigables
  const categoryNames: Record<string, string> = {
    general: 'General',
    system: 'Sistema',
    work: 'Trabajo',
    analytics: 'Análisis',
    navigation: 'Navegación',
    communication: 'Comunicación',
    other: 'Otros'
  };

  // Detectar cambios no guardados
  useEffect(() => {
    setHasUnsavedChanges(false); // Reset cuando se abre el modal
  }, [isOpen]);

  // Handlers
  const handleToggleWidget = useCallback((widgetId: string) => {
    const isEnabled = isWidgetEnabled(widgetId);
    if (isEnabled) {
      disableWidget(widgetId);
    } else {
      enableWidget(widgetId);
    }
    setHasUnsavedChanges(true);
  }, [isWidgetEnabled, enableWidget, disableWidget]);

  const handleSizeChange = useCallback((widgetId: string, size: WidgetSize) => {
    resizeWidget(widgetId, size);
    setHasUnsavedChanges(true);
  }, [resizeWidget]);

  const handleReset = useCallback(() => {
    if (window.confirm('¿Estás seguro de que quieres restaurar la configuración por defecto? Se perderán todos los cambios personalizados.')) {
      resetToDefaults();
      setHasUnsavedChanges(true);
    }
  }, [resetToDefaults]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      await saveSettings();
      setSaveStatus('success');
      setHasUnsavedChanges(false);
      
      // Auto-cerrar después de guardar exitosamente
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error saving widget settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [saveSettings, onClose]);

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar sin guardar?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [hasUnsavedChanges, onClose]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (hasUnsavedChanges) {
          handleSave();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose, hasUnsavedChanges, handleSave]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-glass-100 backdrop-blur-md rounded-xl border border-glass-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-glass-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-quantum-blue/20 rounded-lg">
              <Settings className="w-6 h-6 text-quantum-blue" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Configuración de Widgets
              </h2>
              <p className="text-sm text-glass-300">
                Personaliza tu dashboard habilitando y configurando widgets
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 text-glass-400 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 border-2 border-quantum-blue border-t-transparent rounded-full animate-spin" />
                <span className="text-glass-300">Cargando configuración...</span>
              </div>
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Error al cargar configuración</h3>
                <p className="text-glass-300 mb-4">
                  {error?.message || 'No se pudo cargar la configuración de widgets'}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-quantum-blue text-white rounded-lg hover:bg-quantum-blue/80 transition-colors duration-200"
                >
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Información del usuario */}
              <div className="mb-6 p-4 bg-glass-50 rounded-lg border border-glass-200">
                <div className="flex items-center space-x-3">
                  <Info className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-white">
                      <span className="font-medium">Rol actual:</span> {userRole}
                    </p>
                    <p className="text-xs text-glass-400">
                      Los widgets disponibles dependen de tu rol de usuario
                    </p>
                  </div>
                </div>
              </div>

              {/* Widgets por categoría */}
              <div className="space-y-6">
                {Object.entries(widgetsByCategory).map(([category, widgets]) => (
                  <div key={category} className="space-y-3">
                    {/* Header de categoría */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex items-center justify-between w-full p-3 bg-glass-50 rounded-lg border border-glass-200 hover:bg-glass-100 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-white">
                          {categoryNames[category] || category}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium bg-glass-200 text-glass-300 rounded-full">
                          {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {expandedCategories[category] ? (
                        <ChevronUp className="w-4 h-4 text-glass-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-glass-400" />
                      )}
                    </button>

                    {/* Widgets de la categoría */}
                    {expandedCategories[category] && (
                      <div className="space-y-3 ml-4">
                        {widgets.map(widget => (
                          <WidgetConfigItem
                            key={widget.id}
                            widget={widget}
                            isEnabled={isWidgetEnabled(widget.id)}
                            currentSize={settings.widgetSizes[widget.id] || widget.defaultSize}
                            onToggle={() => handleToggleWidget(widget.id)}
                            onSizeChange={(size) => handleSizeChange(widget.id, size)}
                            canUserAccess={canUserAccessWidget(widget.id, userRole)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Información adicional */}
              <div className="mt-8 p-4 bg-glass-50 rounded-lg border border-glass-200">
                <h4 className="text-sm font-medium text-white mb-2">Información adicional</h4>
                <ul className="text-xs text-glass-400 space-y-1">
                  <li>• Los widgets marcados como "Requerido" no se pueden deshabilitar</li>
                  <li>• Los widgets "Restringido" solo están disponibles para ciertos roles</li>
                  <li>• Los cambios se guardan automáticamente en tu navegador</li>
                  <li>• Usa Ctrl+S (Cmd+S en Mac) para guardar rápidamente</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-glass-200 bg-glass-50">
          <div className="flex items-center space-x-3">
            {/* Status de guardado */}
            {saveStatus === 'success' && (
              <div className="flex items-center space-x-2 text-green-400">
                <Check className="w-4 h-4" />
                <span className="text-sm">Configuración guardada</span>
              </div>
            )}
            {saveStatus === 'error' && (
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Error al guardar</span>
              </div>
            )}
            {hasUnsavedChanges && saveStatus === 'idle' && (
              <div className="flex items-center space-x-2 text-yellow-400">
                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                <span className="text-sm">Cambios sin guardar</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {/* Botón de reset */}
            <button
              onClick={handleReset}
              disabled={isSaving || hookIsSaving}
              className="px-4 py-2 text-sm font-medium text-glass-300 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restaurar</span>
            </button>

            {/* Botón de cancelar */}
            <button
              onClick={handleClose}
              disabled={isSaving || hookIsSaving}
              className="px-4 py-2 text-sm font-medium text-glass-300 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>

            {/* Botón de guardar */}
            <button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving || hookIsSaving}
              className="px-4 py-2 text-sm font-medium bg-quantum-blue text-white rounded-lg hover:bg-quantum-blue/80 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(isSaving || hookIsSaving) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;