import React, { useState } from 'react';
import { Brain, Database, Upload, Download, BarChart3, MessageSquare, Zap, Shield, Code, Cloud, FileSpreadsheet, TrendingUp, Bot, Users, Settings, ChevronRight, Sparkles } from 'lucide-react';

export default function MaximoIntegrationPortal() {
  const [activeTab, setActiveTab] = useState('architecture');
  const [selectedModule, setSelectedModule] = useState(null);

  const modules = {
    integration: {
      name: "Módulo de Integración",
      icon: <Zap className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500",
      features: [
        { name: "Carga Masiva", desc: "Excel/CSV → Validación → Maximo", icon: <Upload className="w-4 h-4" /> },
        { name: "Extracción de Datos", desc: "Queries personalizadas con filtros", icon: <Download className="w-4 h-4" /> },
        { name: "Sincronización", desc: "Actualización bidireccional programada", icon: <Zap className="w-4 h-4" /> },
        { name: "Transformación", desc: "ETL y mapeo de datos", icon: <Settings className="w-4 h-4" /> }
      ]
    },
    analytics: {
      name: "Análisis y Dashboards",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500",
      features: [
        { name: "Dashboards Interactivos", desc: "KPIs en tiempo real", icon: <TrendingUp className="w-4 h-4" /> },
        { name: "Reportes Personalizados", desc: "Generación automatizada", icon: <FileSpreadsheet className="w-4 h-4" /> },
        { name: "Visualizaciones", desc: "Gráficas dinámicas y drill-down", icon: <BarChart3 className="w-4 h-4" /> },
        { name: "Alertas Predictivas", desc: "Notificaciones basadas en umbrales", icon: <Sparkles className="w-4 h-4" /> }
      ]
    },
    watsonx: {
      name: "Watson X AI Assistant",
      icon: <Brain className="w-6 h-6" />,
      color: "from-orange-500 to-red-500",
      features: [
        { name: "Chat Conversacional", desc: "Consultas en lenguaje natural", icon: <MessageSquare className="w-4 h-4" /> },
        { name: "Análisis Predictivo", desc: "ML para mantenimiento preventivo", icon: <Brain className="w-4 h-4" /> },
        { name: "Generación de Insights", desc: "Recomendaciones automáticas", icon: <Sparkles className="w-4 h-4" /> },
        { name: "Asistente de Órdenes", desc: "Creación guiada por IA", icon: <Bot className="w-4 h-4" /> }
      ]
    }
  };

  const techStack = {
    frontend: {
      title: "Frontend Layer",
      color: "bg-blue-600",
      icon: <Code className="w-5 h-5" />,
      technologies: [
        { name: "React 18 + TypeScript", purpose: "Framework principal" },
        { name: "Tailwind CSS + shadcn/ui", purpose: "UI moderna y componentes" },
        { name: "Recharts / Apache ECharts", purpose: "Gráficas interactivas" },
        { name: "React Query", purpose: "Gestión de estado y cache" },
        { name: "Socket.io Client", purpose: "Actualizaciones en tiempo real" },
        { name: "Zustand", purpose: "State management global" }
      ]
    },
    backend: {
      title: "Backend & API Layer",
      color: "bg-purple-600",
      icon: <Database className="w-5 h-5" />,
      technologies: [
        { name: "Node.js + Express / FastAPI", purpose: "API REST principal" },
        { name: "Bull / BullMQ", purpose: "Procesamiento de colas" },
        { name: "Redis", purpose: "Cache y sesiones" },
        { name: "PostgreSQL", purpose: "Base de datos logs y config" },
        { name: "JWT + OAuth2", purpose: "Autenticación y seguridad" },
        { name: "Winston", purpose: "Logging estructurado" }
      ]
    },
    ai: {
      title: "Watson X Integration",
      color: "bg-orange-600",
      icon: <Brain className="w-5 h-5" />,
      technologies: [
        { name: "IBM Watson X.ai", purpose: "LLM para NLP y análisis" },
        { name: "Watson Discovery", purpose: "Búsqueda cognitiva en datos" },
        { name: "Watson Studio", purpose: "Modelos ML personalizados" },
        { name: "LangChain", purpose: "Orquestación de prompts" },
        { name: "Vector DB (Milvus)", purpose: "Embeddings y memoria semántica" }
      ]
    },
    maximo: {
      title: "Maximo Integration",
      color: "bg-green-600",
      icon: <Cloud className="w-5 h-5" />,
      technologies: [
        { name: "Maximo REST API", purpose: "CRUD operations" },
        { name: "OSLC Resources", purpose: "Object structures access" },
        { name: "Maximo Webhooks", purpose: "Eventos en tiempo real" },
        { name: "Kafka / RabbitMQ", purpose: "Event streaming" }
      ]
    }
  };

  const implementation = [
    {
      phase: "Fase 1: Fundamentos",
      duration: "2-3 semanas",
      tasks: [
        "Configurar proyecto React + Node.js",
        "Implementar autenticación OAuth2 con Maximo",
        "Crear endpoints básicos para Assets y Work Orders",
        "Dashboard inicial con métricas básicas"
      ]
    },
    {
      phase: "Fase 2: Integración",
      duration: "3-4 semanas",
      tasks: [
        "Módulo de carga masiva (Excel/CSV)",
        "Extractor de datos con filtros avanzados",
        "Sistema de colas para procesamiento asíncrono",
        "Logging y auditoría completa"
      ]
    },
    {
      phase: "Fase 3: Analytics",
      duration: "2-3 semanas",
      tasks: [
        "Dashboards interactivos con drill-down",
        "Generador de reportes personalizados",
        "Visualizaciones avanzadas (heatmaps, treemaps)",
        "Sistema de alertas configurables"
      ]
    },
    {
      phase: "Fase 4: Watson X AI",
      duration: "3-4 semanas",
      tasks: [
        "Integración con Watson X.ai API",
        "Chat conversacional con contexto de Maximo",
        "Modelos predictivos para mantenimiento",
        "Generación automática de insights"
      ]
    }
  ];

  const architectureDiagram = {
    layers: [
      { name: "Usuarios", items: ["Web Browser", "Mobile App"], color: "bg-blue-500" },
      { name: "Presentación", items: ["React UI", "Dashboards", "Chat IA"], color: "bg-purple-500" },
      { name: "API Gateway", items: ["Auth", "Rate Limit", "Routing"], color: "bg-pink-500" },
      { name: "Servicios", items: ["Integration Service", "Analytics Service", "Watson X Service"], color: "bg-orange-500" },
      { name: "Datos", items: ["Redis Cache", "PostgreSQL", "Vector DB"], color: "bg-yellow-500" },
      { name: "Externo", items: ["Maximo API", "Watson X", "IBM Cloud"], color: "bg-green-500" }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <Brain className="w-10 h-10" />
                </div>
                <h1 className="text-4xl font-bold">Portal de Integración Maximo + Watson X</h1>
              </div>
              <p className="text-lg opacity-90 max-w-3xl">
                Plataforma completa para integración de datos, análisis avanzado y asistente de IA conversacional
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-2 flex space-x-2">
          {['architecture', 'modules', 'tech', 'roadmap'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab === 'architecture' && 'Arquitectura'}
              {tab === 'modules' && 'Módulos'}
              {tab === 'tech' && 'Stack Técnico'}
              {tab === 'roadmap' && 'Roadmap'}
            </button>
          ))}
        </div>

        {/* Architecture View */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Arquitectura del Sistema</h2>
              <div className="space-y-3">
                {architectureDiagram.layers.map((layer, idx) => (
                  <div key={idx} className="flex items-center space-x-4">
                    <div className="w-40 text-right">
                      <span className="font-semibold text-slate-700">{layer.name}</span>
                    </div>
                    <ChevronRight className="text-slate-400" />
                    <div className="flex-1 flex space-x-2">
                      {layer.items.map((item, i) => (
                        <div key={i} className={`${layer.color} text-white px-4 py-3 rounded-lg shadow-md flex-1 text-center text-sm font-medium`}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                  <Zap className="w-6 h-6 mr-2 text-blue-600" />
                  Flujo de Datos
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                    <p className="text-slate-700"><strong>Usuario interactúa</strong> con el portal (carga archivo, hace pregunta IA, visualiza dashboard)</p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                    <p className="text-slate-700"><strong>API Gateway valida</strong> autenticación, permisos y enruta solicitud</p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                    <div className="bg-orange-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                    <p className="text-slate-700"><strong>Servicio procesa</strong> (Integration/Analytics/Watson X según el caso)</p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                    <p className="text-slate-700"><strong>Maximo API ejecuta</strong> operación y devuelve datos</p>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-pink-50 rounded-lg">
                    <div className="bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">5</div>
                    <p className="text-slate-700"><strong>Respuesta formateada</strong> y presentada al usuario</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                  <Shield className="w-6 h-6 mr-2 text-green-600" />
                  Seguridad & Performance
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2 flex items-center text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Seguridad
                    </h4>
                    <ul className="text-sm text-slate-600 space-y-1 ml-4">
                      <li>• OAuth2 + JWT para autenticación</li>
                      <li>• RBAC (Role-Based Access Control)</li>
                      <li>• HTTPS/TLS end-to-end</li>
                      <li>• Auditoría completa de operaciones</li>
                      <li>• Rate limiting por usuario/IP</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 mb-2 flex items-center text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Performance
                    </h4>
                    <ul className="text-sm text-slate-600 space-y-1 ml-4">
                      <li>• Redis cache multi-nivel</li>
                      <li>• Lazy loading y paginación</li>
                      <li>• CDN para assets estáticos</li>
                      <li>• WebSocket para updates real-time</li>
                      <li>• Compresión gzip/brotli</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modules View */}
        {activeTab === 'modules' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.entries(modules).map(([key, module]) => (
              <div
                key={key}
                onClick={() => setSelectedModule(key)}
                className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 ${
                  selectedModule === key ? 'ring-4 ring-blue-400' : ''
                }`}
              >
                <div className={`bg-gradient-to-r ${module.color} w-14 h-14 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg`}>
                  {module.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">{module.name}</h3>
                <div className="space-y-3">
                  {module.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className="text-blue-600 mt-0.5">
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">{feature.name}</h4>
                        <p className="text-xs text-slate-600">{feature.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tech Stack View */}
        {activeTab === 'tech' && (
          <div className="space-y-6">
            {Object.entries(techStack).map(([key, stack]) => (
              <div key={key} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`${stack.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    {stack.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">{stack.title}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stack.technologies.map((tech, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-4 hover:border-blue-400 transition-colors">
                      <h4 className="font-semibold text-slate-800 mb-1">{tech.name}</h4>
                      <p className="text-sm text-slate-600">{tech.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Roadmap View */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Plan de Implementación</h2>
              <div className="space-y-6">
                {implementation.map((phase, idx) => (
                  <div key={idx} className="relative pl-8 pb-6 border-l-4 border-blue-500 last:border-l-0">
                    <div className="absolute -left-3 top-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      {idx + 1}
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-slate-800">{phase.phase}</h3>
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          {phase.duration}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {phase.tasks.map((task, i) => (
                          <li key={i} className="flex items-start space-x-2 text-slate-700">
                            <ChevronRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-3">Tiempo Total Estimado</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold">10-14 semanas</p>
                  <p className="opacity-90">Para MVP completo funcional</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">Entregables por fase</p>
                  <p className="text-sm opacity-90">Demos funcionales + Documentación</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}