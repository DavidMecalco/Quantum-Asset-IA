import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  X,
  HelpCircle,
  Search,
  Book,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Keyboard,
  Monitor,
  Settings,
  Grid,
  MessageCircle,
  Mail,
  Phone,
  Globe
} from 'lucide-react';
import { WidgetType } from '../../types/widgets';
import { UserRole } from '../../types/auth';

// Props del modal
interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWidget?: WidgetType | null;
  userRole?: UserRole;
}

// Tipos para el contenido de ayuda
interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: HelpContent[];
  category: 'widgets' | 'navigation' | 'shortcuts' | 'troubleshooting' | 'contact';
}

interface HelpContent {
  id: string;
  title: string;
  description: string;
  steps?: string[];
  tips?: string[];
  shortcuts?: { key: string; description: string }[];
  relatedLinks?: { label: string; url: string; external?: boolean }[];
  videoUrl?: string;
  imageUrl?: string;
}



// Contenido de ayuda para widgets
const getWidgetHelpContent = (): HelpContent[] => [
  {
    id: 'welcome-widget',
    title: 'Widget de Bienvenida',
    description: 'Muestra un saludo personalizado y resumen de tu actividad reciente.',
    steps: [
      'El widget se actualiza automáticamente según la hora del día',
      'Muestra información de tu último acceso al sistema',
      'Presenta un resumen de tu actividad reciente'
    ],
    tips: [
      'El saludo cambia según la hora: Buenos días, Buenas tardes, Buenas noches',
      'Haz clic en "Ver actividad completa" para acceder al historial detallado'
    ]
  },
  {
    id: 'system-status-widget',
    title: 'Widget de Estado del Sistema',
    description: 'Monitorea el estado de conectividad y rendimiento del sistema Maximo.',
    steps: [
      'Verde: Sistema funcionando correctamente',
      'Amarillo: Advertencias o rendimiento degradado',
      'Rojo: Errores críticos o sistema no disponible'
    ],
    tips: [
      'Se actualiza automáticamente cada 30 segundos',
      'Haz clic en el widget para ver detalles técnicos',
      'Las alertas críticas se muestran con notificaciones emergentes'
    ]
  },
  {
    id: 'tasks-widget',
    title: 'Widget de Tareas',
    description: 'Muestra tus work orders asignadas y tareas pendientes.',
    steps: [
      'Las tareas se ordenan por prioridad y fecha de vencimiento',
      'Los colores indican la urgencia: Rojo (crítico), Naranja (alto), Amarillo (medio), Azul (bajo)',
      'Haz clic en una tarea para ver sus detalles completos'
    ],
    tips: [
      'Usa los filtros para ver solo tareas específicas',
      'Las tareas vencidas aparecen destacadas en rojo',
      'Puedes marcar tareas como completadas directamente desde el widget'
    ],
    shortcuts: [
      { key: 'T', description: 'Abrir lista completa de tareas' },
      { key: 'N', description: 'Crear nueva tarea' }
    ]
  },
  {
    id: 'metrics-widget',
    title: 'Widget de Métricas (Solo Administradores)',
    description: 'Visualiza estadísticas y métricas de rendimiento del sistema.',
    steps: [
      'Muestra gráficos de uso de CPU, memoria y red',
      'Presenta estadísticas de usuarios activos',
      'Indica la tasa de errores del sistema'
    ],
    tips: [
      'Solo visible para usuarios con rol de administrador',
      'Los datos se actualizan cada minuto',
      'Haz clic en los gráficos para ver métricas detalladas'
    ]
  },
  {
    id: 'quick-actions-widget',
    title: 'Widget de Acciones Rápidas',
    description: 'Proporciona acceso directo a las funciones más utilizadas.',
    steps: [
      'Los botones cambian según tu rol de usuario',
      'Acceso directo a módulos principales de Maximo',
      'Enlaces a funciones frecuentemente utilizadas'
    ],
    tips: [
      'Personaliza las acciones desde la configuración',
      'Los administradores ven acciones adicionales',
      'Usa los atajos de teclado para acceso más rápido'
    ]
  },
  {
    id: 'notifications-widget',
    title: 'Widget de Notificaciones',
    description: 'Centro unificado para todas tus notificaciones y alertas.',
    steps: [
      'El número indica notificaciones no leídas',
      'Los colores representan la prioridad de las notificaciones',
      'Haz clic para abrir el centro de notificaciones completo'
    ],
    tips: [
      'Las notificaciones se marcan como leídas automáticamente',
      'Configura qué tipos de notificaciones quieres recibir',
      'Usa filtros para encontrar notificaciones específicas'
    ],
    shortcuts: [
      { key: 'Alt + N', description: 'Abrir centro de notificaciones' },
      { key: 'Alt + M', description: 'Marcar todas como leídas' }
    ]
  }
];

// Contenido de ayuda para navegación
const getNavigationHelpContent = (): HelpContent[] => [
  {
    id: 'dashboard-navigation',
    title: 'Navegación del Dashboard',
    description: 'Aprende a navegar eficientemente por tu dashboard personalizado.',
    steps: [
      'Usa el menú superior para acceder a diferentes secciones',
      'Los widgets se pueden reorganizar arrastrando y soltando',
      'El botón de configuración permite personalizar tu vista'
    ],
    tips: [
      'Mantén presionado un widget para activar el modo de reorganización',
      'Los cambios se guardan automáticamente',
      'Usa el modo de pantalla completa para mejor visualización'
    ]
  },
  {
    id: 'responsive-design',
    title: 'Diseño Responsivo',
    description: 'El dashboard se adapta automáticamente a diferentes dispositivos.',
    steps: [
      'Móvil: Los widgets se apilan en una columna',
      'Tablet: Diseño de dos columnas',
      'Desktop: Hasta 4 columnas según el tamaño de pantalla'
    ],
    tips: [
      'Rota tu dispositivo móvil para mejor experiencia',
      'Usa gestos táctiles para navegar en dispositivos móviles',
      'El contenido se ajusta automáticamente al tamaño de pantalla'
    ]
  }
];

// Contenido de ayuda para atajos de teclado
const getShortcutsHelpContent = (): HelpContent[] => [
  {
    id: 'keyboard-shortcuts',
    title: 'Atajos de Teclado',
    description: 'Acelera tu trabajo con estos atajos de teclado útiles.',
    shortcuts: [
      { key: 'Ctrl + /', description: 'Mostrar/ocultar ayuda' },
      { key: 'Ctrl + ,', description: 'Abrir configuración' },
      { key: 'Ctrl + R', description: 'Actualizar dashboard' },
      { key: 'Esc', description: 'Cerrar modal activo' },
      { key: 'Tab', description: 'Navegar entre elementos' },
      { key: 'Enter', description: 'Activar elemento seleccionado' },
      { key: 'Alt + 1-6', description: 'Saltar a widget específico' },
      { key: 'Ctrl + S', description: 'Guardar configuración' }
    ]
  },
  {
    id: 'mouse-gestures',
    title: 'Gestos del Ratón',
    description: 'Interacciones con el ratón para una navegación eficiente.',
    steps: [
      'Clic derecho en widgets para opciones contextuales',
      'Doble clic para expandir widgets a pantalla completa',
      'Arrastrar y soltar para reorganizar widgets',
      'Scroll para navegar por contenido largo'
    ]
  },
  {
    id: 'touch-gestures',
    title: 'Gestos Táctiles',
    description: 'Gestos para dispositivos táctiles y móviles.',
    steps: [
      'Toque largo para activar modo de reorganización',
      'Deslizar hacia arriba/abajo para hacer scroll',
      'Pellizcar para hacer zoom (en gráficos)',
      'Deslizar hacia los lados para navegar entre notificaciones'
    ]
  }
];

// Contenido de ayuda para solución de problemas
const getTroubleshootingHelpContent = (): HelpContent[] => [
  {
    id: 'common-issues',
    title: 'Problemas Comunes',
    description: 'Soluciones a los problemas más frecuentes.',
    steps: [
      'Si los widgets no cargan: Actualiza la página (Ctrl+R)',
      'Si la configuración no se guarda: Verifica que las cookies estén habilitadas',
      'Si hay problemas de conectividad: Revisa el widget de estado del sistema',
      'Si el dashboard se ve mal: Limpia la caché del navegador'
    ],
    tips: [
      'Mantén tu navegador actualizado para mejor rendimiento',
      'Habilita JavaScript para funcionalidad completa',
      'Usa navegadores modernos (Chrome, Firefox, Safari, Edge)'
    ]
  },
  {
    id: 'performance-tips',
    title: 'Consejos de Rendimiento',
    description: 'Optimiza tu experiencia con estos consejos.',
    steps: [
      'Deshabilita widgets que no uses frecuentemente',
      'Reduce la frecuencia de actualización si tienes conexión lenta',
      'Cierra pestañas innecesarias del navegador',
      'Usa modo de alto contraste si tienes problemas de visibilidad'
    ]
  },
  {
    id: 'browser-compatibility',
    title: 'Compatibilidad del Navegador',
    description: 'Requisitos y compatibilidad con diferentes navegadores.',
    steps: [
      'Chrome 90+ (Recomendado)',
      'Firefox 88+',
      'Safari 14+',
      'Edge 90+',
      'JavaScript habilitado',
      'Cookies habilitadas'
    ]
  }
];

// Contenido de ayuda para contacto y soporte
const getContactHelpContent = (): HelpContent[] => [
  {
    id: 'support-channels',
    title: 'Canales de Soporte',
    description: 'Diferentes formas de obtener ayuda y soporte técnico.',
    relatedLinks: [
      { label: 'Portal de Soporte', url: '/support', external: false },
      { label: 'Base de Conocimientos', url: 'https://docs.maximo.com', external: true },
      { label: 'Foro de la Comunidad', url: 'https://community.maximo.com', external: true },
      { label: 'Documentación API', url: 'https://api.maximo.com/docs', external: true }
    ]
  },
  {
    id: 'contact-info',
    title: 'Información de Contacto',
    description: 'Cómo contactar al equipo de soporte técnico.',
    steps: [
      'Email: soporte@empresa.com',
      'Teléfono: +1 (555) 123-4567',
      'Horario: Lunes a Viernes, 8:00 AM - 6:00 PM',
      'Soporte de emergencia 24/7 disponible'
    ]
  },
  {
    id: 'feedback',
    title: 'Enviar Comentarios',
    description: 'Ayúdanos a mejorar enviando tus comentarios y sugerencias.',
    relatedLinks: [
      { label: 'Formulario de Feedback', url: '/feedback', external: false },
      { label: 'Reportar Bug', url: '/bug-report', external: false },
      { label: 'Solicitar Función', url: '/feature-request', external: false }
    ]
  }
];

// Componente para mostrar contenido de ayuda
const HelpContentDisplay: React.FC<{
  content: HelpContent;
  onLinkClick: (url: string, external?: boolean) => void;
}> = ({ content, onLinkClick }) => {
  return (
    <div className="space-y-4">
      <p className="text-glass-200 leading-relaxed">
        {content.description}
      </p>

      {content.steps && content.steps.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-white mb-2">Pasos:</h5>
          <ol className="list-decimal list-inside space-y-1 text-sm text-glass-300">
            {content.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {content.tips && content.tips.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-white mb-2 flex items-center space-x-2">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <span>Consejos:</span>
          </h5>
          <ul className="list-disc list-inside space-y-1 text-sm text-glass-300">
            {content.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {content.shortcuts && content.shortcuts.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-white mb-2 flex items-center space-x-2">
            <Keyboard className="w-4 h-4 text-blue-400" />
            <span>Atajos de Teclado:</span>
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {content.shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-glass-50 rounded">
                <kbd className="px-2 py-1 text-xs font-mono bg-glass-200 text-white rounded">
                  {shortcut.key}
                </kbd>
                <span className="text-xs text-glass-300 ml-2">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {content.relatedLinks && content.relatedLinks.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-white mb-2">Enlaces Relacionados:</h5>
          <div className="space-y-2">
            {content.relatedLinks.map((link, index) => (
              <button
                key={index}
                onClick={() => onLinkClick(link.url, link.external)}
                className="flex items-center space-x-2 text-sm text-quantum-blue hover:text-quantum-blue/80 transition-colors duration-200"
              >
                <span>{link.label}</span>
                {link.external && <ExternalLink className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente principal del modal
export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  initialWidget = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Generar secciones de ayuda
  const helpSections = useMemo((): HelpSection[] => [
    {
      id: 'widgets',
      title: 'Widgets',
      icon: <Grid className="w-5 h-5" />,
      content: getWidgetHelpContent(),
      category: 'widgets'
    },
    {
      id: 'navigation',
      title: 'Navegación',
      icon: <Monitor className="w-5 h-5" />,
      content: getNavigationHelpContent(),
      category: 'navigation'
    },
    {
      id: 'shortcuts',
      title: 'Atajos y Gestos',
      icon: <Keyboard className="w-5 h-5" />,
      content: getShortcutsHelpContent(),
      category: 'shortcuts'
    },
    {
      id: 'troubleshooting',
      title: 'Solución de Problemas',
      icon: <Settings className="w-5 h-5" />,
      content: getTroubleshootingHelpContent(),
      category: 'troubleshooting'
    },
    {
      id: 'contact',
      title: 'Contacto y Soporte',
      icon: <MessageCircle className="w-5 h-5" />,
      content: getContactHelpContent(),
      category: 'contact'
    }
  ], []);

  // Filtrar contenido basado en búsqueda
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return helpSections;

    return helpSections.map(section => ({
      ...section,
      content: section.content.filter(content =>
        content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        content.steps?.some(step => step.toLowerCase().includes(searchTerm.toLowerCase())) ||
        content.tips?.some(tip => tip.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })).filter(section => section.content.length > 0);
  }, [helpSections, searchTerm]);

  // Inicializar con widget específico si se proporciona
  useEffect(() => {
    if (isOpen && initialWidget) {
      setSelectedSection('widgets');
      const widgetContent = getWidgetHelpContent().find(content => 
        content.id.includes(initialWidget.replace('_', '-'))
      );
      if (widgetContent) {
        setSelectedContent(widgetContent.id);
        setExpandedSections(prev => ({ ...prev, widgets: true }));
      }
    }
  }, [isOpen, initialWidget]);

  // Handlers
  const handleSectionClick = useCallback((sectionId: string) => {
    setSelectedSection(sectionId);
    setSelectedContent(null);
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const handleContentClick = useCallback((contentId: string) => {
    setSelectedContent(selectedContent === contentId ? null : contentId);
  }, [selectedContent]);

  const handleLinkClick = useCallback((url: string, external = false) => {
    if (external) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Para enlaces internos, podrías usar React Router
      window.location.href = url;
    }
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setSelectedSection(null);
    setSelectedContent(null);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '/' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        document.getElementById('help-search')?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-glass-100 backdrop-blur-md rounded-xl border border-glass-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-glass-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <HelpCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Centro de Ayuda
              </h2>
              <p className="text-sm text-glass-300">
                Guías, consejos y soporte para usar el dashboard
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-glass-400 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200"
            title="Cerrar ayuda"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-glass-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-glass-400" />
            <input
              id="help-search"
              type="text"
              placeholder="Buscar en la ayuda... (Ctrl+/ para enfocar)"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-glass-50 border border-glass-200 rounded-lg text-white placeholder-glass-400 focus:outline-none focus:ring-2 focus:ring-quantum-blue focus:border-transparent"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden max-h-[calc(90vh-200px)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-glass-200 overflow-y-auto">
            <div className="p-4 space-y-2">
              {filteredSections.map(section => (
                <div key={section.id}>
                  <button
                    onClick={() => handleSectionClick(section.id)}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200
                      ${selectedSection === section.id 
                        ? 'bg-quantum-blue/20 text-quantum-blue' 
                        : 'text-glass-300 hover:text-white hover:bg-glass-50'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      {section.icon}
                      <span className="font-medium">{section.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-glass-200 text-glass-300 px-2 py-1 rounded-full">
                        {section.content.length}
                      </span>
                      {expandedSections[section.id] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {/* Content items */}
                  {expandedSections[section.id] && (
                    <div className="ml-4 mt-2 space-y-1">
                      {section.content.map(content => (
                        <button
                          key={content.id}
                          onClick={() => handleContentClick(content.id)}
                          className={`
                            w-full text-left p-2 rounded text-sm transition-colors duration-200
                            ${selectedContent === content.id 
                              ? 'bg-glass-100 text-white' 
                              : 'text-glass-400 hover:text-glass-200 hover:bg-glass-50'
                            }
                          `}
                        >
                          {content.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {selectedContent ? (
                // Mostrar contenido específico
                (() => {
                  const content = filteredSections
                    .flatMap(section => section.content)
                    .find(content => content.id === selectedContent);
                  
                  if (!content) return null;

                  return (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-xl font-semibold text-white mb-2">
                          {content.title}
                        </h3>
                      </div>
                      <HelpContentDisplay 
                        content={content} 
                        onLinkClick={handleLinkClick}
                      />
                    </div>
                  );
                })()
              ) : selectedSection ? (
                // Mostrar resumen de sección
                (() => {
                  const section = filteredSections.find(s => s.id === selectedSection);
                  if (!section) return null;

                  return (
                    <div>
                      <div className="mb-6">
                        <div className="flex items-center space-x-3 mb-4">
                          {section.icon}
                          <h3 className="text-xl font-semibold text-white">
                            {section.title}
                          </h3>
                        </div>
                        <p className="text-glass-300">
                          Selecciona un tema específico de la lista lateral para ver información detallada.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.content.map(content => (
                          <button
                            key={content.id}
                            onClick={() => handleContentClick(content.id)}
                            className="p-4 bg-glass-50 rounded-lg border border-glass-200 hover:bg-glass-100 transition-colors duration-200 text-left"
                          >
                            <h4 className="font-medium text-white mb-2">
                              {content.title}
                            </h4>
                            <p className="text-sm text-glass-400 line-clamp-2">
                              {content.description}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                // Vista inicial
                <div className="text-center py-12">
                  <Book className="w-16 h-16 text-glass-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Bienvenido al Centro de Ayuda
                  </h3>
                  <p className="text-glass-300 mb-6 max-w-md mx-auto">
                    Encuentra guías detalladas, consejos útiles y soporte técnico para aprovechar al máximo tu dashboard.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {helpSections.map(section => (
                      <button
                        key={section.id}
                        onClick={() => handleSectionClick(section.id)}
                        className="p-6 bg-glass-50 rounded-lg border border-glass-200 hover:bg-glass-100 transition-colors duration-200"
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="p-3 bg-glass-200 rounded-lg mb-3">
                            {section.icon}
                          </div>
                          <h4 className="font-medium text-white mb-2">
                            {section.title}
                          </h4>
                          <p className="text-xs text-glass-400">
                            {section.content.length} tema{section.content.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Enlaces rápidos */}
                  <div className="mt-8 pt-6 border-t border-glass-200">
                    <h4 className="text-sm font-medium text-white mb-4">Enlaces Rápidos</h4>
                    <div className="flex flex-wrap justify-center gap-4">
                      <button
                        onClick={() => handleLinkClick('https://docs.maximo.com', true)}
                        className="flex items-center space-x-2 px-3 py-2 bg-glass-50 rounded-lg hover:bg-glass-100 transition-colors duration-200"
                      >
                        <Globe className="w-4 h-4 text-glass-400" />
                        <span className="text-sm text-glass-300">Documentación</span>
                        <ExternalLink className="w-3 h-3 text-glass-400" />
                      </button>
                      <button
                        onClick={() => handleLinkClick('/support', false)}
                        className="flex items-center space-x-2 px-3 py-2 bg-glass-50 rounded-lg hover:bg-glass-100 transition-colors duration-200"
                      >
                        <MessageCircle className="w-4 h-4 text-glass-400" />
                        <span className="text-sm text-glass-300">Soporte</span>
                      </button>
                      <button
                        onClick={() => handleLinkClick('/feedback', false)}
                        className="flex items-center space-x-2 px-3 py-2 bg-glass-50 rounded-lg hover:bg-glass-100 transition-colors duration-200"
                      >
                        <Mail className="w-4 h-4 text-glass-400" />
                        <span className="text-sm text-glass-300">Feedback</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-glass-200 bg-glass-50">
          <div className="flex items-center justify-between text-xs text-glass-400">
            <div className="flex items-center space-x-4">
              <span>Presiona Esc para cerrar</span>
              <span>Ctrl+/ para buscar</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-3 h-3" />
              <span>Soporte: +1 (555) 123-4567</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;