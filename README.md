# 🚀 Quantum Asset - Portal de Integración Maximo + Watson X AI

<div align="center">

<img width="5152" height="2620" alt="_C__Users_Dreiv_Downloads_index html (1)" src="https://github.com/user-attachments/assets/aad66b45-5a28-4b12-a78e-d61c600b1d1f" />


**Portal completo para integración de datos, análisis avanzado y asistente de IA conversacional con IBM Maximo**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![React](https://img.shields.io/badge/React-18.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Watson X](https://img.shields.io/badge/Watson%20X-AI-orange.svg)](https://www.ibm.com/watsonx)
[![Maximo](https://img.shields.io/badge/IBM-Maximo-green.svg)](https://www.ibm.com/products/maximo)

</div>

## 📋 Descripción

**Quantum Asset** es una plataforma avanzada de integración que conecta IBM Maximo con Watson X AI, proporcionando una experiencia conversacional moderna para la gestión de activos empresariales. Combina análisis predictivo, visualizaciones interactivas y un asistente de IA conversacional en una interfaz web elegante.

### ✨ Características Principales

- **🤖 Asistente Watson X AI**: Chat conversacional con IA para consultas en lenguaje natural
- **📊 Dashboards Interactivos**: Visualización de KPIs y métricas en tiempo real
- **⚡ Integración Maximo**: Conexión directa con IBM Maximo MAS via REST API
- **📈 Analytics Avanzados**: Análisis predictivo y generación de insights automáticos
- **🎨 UI Moderna**: Interfaz glassmorphic con Tailwind CSS y animaciones fluidas
- **📱 Responsive Design**: Adaptado para desktop, tablet y móvil

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │────│  React Portal   │────│  Watson X AI    │
│   Mobile App    │    │   Dashboards    │    │   Assistant     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway                                │
│               Auth │ Rate Limit │ Routing                      │
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Integration     │    │  Analytics      │    │  Watson X       │
│ Service         │    │  Service        │    │  Service        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Redis Cache    │    │  PostgreSQL     │    │   Vector DB     │
│  Session Store  │    │  Logs & Config  │    │  (Embeddings)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                            │
┌─────────────────────────────────────────────────────────────────┐
│                    Servicios Externos                          │
│          Maximo API │ Watson X │ IBM Cloud                     │
└─────────────────────────────────────────────────────────────────┘
```

## 🛠️ Stack Tecnológico

### Frontend Layer
- **React 18 + TypeScript**: Framework principal con tipado estático
- **Tailwind CSS**: Estilos utilitarios modernos con glassmorphism
- **Chart.js / Apache ECharts**: Gráficas interactivas y visualizaciones
- **Socket.io Client**: Actualizaciones en tiempo real
- **Zustand**: Gestión de estado global ligera

### Backend & API Layer
- **Node.js + Express / FastAPI**: API REST principal
- **Bull / BullMQ**: Sistema de colas para procesamiento asíncrono
- **Redis**: Cache multi-nivel y gestión de sesiones
- **PostgreSQL**: Base de datos para logs y configuración
- **JWT + OAuth2**: Autenticación segura y autorización

### Watson X Integration
- **IBM Watson X.ai**: LLM para procesamiento de lenguaje natural
- **Watson Discovery**: Búsqueda cognitiva en datos empresariales
- **Watson Studio**: Modelos ML personalizados
- **LangChain**: Orquestación de prompts y flujos de IA
- **Vector DB (Milvus)**: Embeddings y memoria semántica

### Maximo Integration
- **Maximo REST API**: Operaciones CRUD en objetos de negocio
- **OSLC Resources**: Acceso estructurado a recursos de Maximo
- **Maximo Webhooks**: Eventos en tiempo real desde Maximo
- **Kafka / RabbitMQ**: Event streaming para sincronización

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Acceso a IBM Maximo MAS
- Credenciales de Watson X AI
- Redis server (opcional para desarrollo)

### Pasos de instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/quantum-asset.git
   cd quantum-asset
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   # o
   yarn install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Crear archivo .env
   cp .env.example .env
   ```
   
   Configurar las siguientes variables:
   ```env
   # Maximo Configuration
   MAXIMO_API_URL=https://tu-instancia.maximo.com/maxrest
   MAXIMO_API_KEY=tu_api_key_de_maximo
   MAXIMO_USERNAME=tu_usuario
   MAXIMO_PASSWORD=tu_password

   # Watson X Configuration
   WATSON_X_API_URL=https://us-south.ml.cloud.ibm.com
   WATSON_X_API_KEY=tu_watson_api_key
   WATSON_X_PROJECT_ID=tu_project_id

   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/quantum_asset
   REDIS_URL=redis://localhost:6379

   # Security
   JWT_SECRET=tu_jwt_secret_muy_seguro
   ENCRYPTION_KEY=tu_clave_de_encriptacion
   ```

4. **Ejecutar en desarrollo**
   ```bash
   npm run dev
   # o
   yarn dev
   ```

La aplicación estará disponible en `http://localhost:3000`

## 📱 Uso del Portal

### 🎯 Dashboard Principal
- **Estado General**: Vista de métricas clave de activos y OTs
- **Gráficos Interactivos**: Distribución de activos por ubicación y estado
- **Alertas en Tiempo Real**: Notificaciones de órdenes críticas

### 🤖 Asistente Watson X AI
**Ejemplos de consultas:**
```
"¿Cuántas órdenes de trabajo tengo pendientes este mes?"
"Muéstrame los activos en estado crítico"
"Genera un reporte de mantenimiento preventivo"
"¿Qué activos requieren atención en los próximos 7 días?"
"Crea una orden de trabajo para PUMP-001"
```

### 📊 Módulos Disponibles

#### 1. **Módulo de Integración** ⚡
- **Carga Masiva**: Excel/CSV → Validación → Maximo
- **Extracción**: Queries personalizadas con filtros avanzados
- **Sincronización**: Actualización bidireccional programada
- **Transformación**: ETL y mapeo de datos automático

#### 2. **Análisis y Dashboards** 📈
- **KPIs en Tiempo Real**: Métricas de rendimiento actualizadas
- **Reportes Personalizados**: Generación automatizada
- **Drill-down**: Navegación interactiva en datos
- **Alertas Predictivas**: Notificaciones basadas en umbrales

#### 3. **Watson X AI Assistant** 🧠
- **Chat Conversacional**: Consultas en lenguaje natural
- **Análisis Predictivo**: ML para mantenimiento preventivo
- **Insights Automáticos**: Recomendaciones inteligentes
- **Asistente de Órdenes**: Creación guiada por IA

## 🔧 Desarrollo

### Estructura del Proyecto
```
quantum-asset/
├── src/
│   ├── components/        # Componentes React reutilizables
│   ├── pages/            # Páginas principales de la aplicación
│   ├── services/         # Servicios para APIs externas
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utilidades y helpers
│   ├── types/            # Definiciones TypeScript
│   └── styles/           # Estilos globales y temas
├── public/               # Assets estáticos
├── docs/                 # Documentación del proyecto
├── tests/                # Tests unitarios e integración
├── index.html            # Página principal HTML
├── maximo_architecture.tsx # Componente de arquitectura
└── README.md            # Este archivo
```

### Scripts Disponibles
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Preview del build
npm run test         # Ejecutar tests
npm run lint         # Linting del código
npm run type-check   # Verificación de TypeScript
```

### Componentes Principales

#### Portal Principal (`index.html`)
- Interface principal con chat de Watson X AI
- Dashboards interactivos con Chart.js
- Sidebar con navegación y métricas rápidas
- Panel de contexto con acciones rápidas

#### Arquitectura (`maximo_architecture.tsx`)
- Documentación interactiva del sistema
- Visualización de módulos y stack tecnológico
- Roadmap de implementación detallado
- Diagramas de flujo de datos

## 🗺️ Roadmap de Implementación

### 📅 Fase 1: Fundamentos (2-3 semanas)
- ✅ Configurar proyecto React + TypeScript
- ✅ Implementar autenticación OAuth2 con Maximo
- ✅ Crear endpoints básicos para Assets y Work Orders  
- ✅ Dashboard inicial con métricas básicas

### 📅 Fase 2: Integración (3-4 semanas)
- 🔄 Módulo de carga masiva (Excel/CSV)
- 🔄 Extractor de datos con filtros avanzados
- 🔄 Sistema de colas para procesamiento asíncrono
- 🔄 Logging y auditoría completa

### 📅 Fase 3: Analytics (2-3 semanas)
- 📋 Dashboards interactivos con drill-down
- 📋 Generador de reportes personalizados
- 📋 Visualizaciones avanzadas (heatmaps, treemaps)
- 📋 Sistema de alertas configurables

### 📅 Fase 4: Watson X AI (3-4 semanas)
- 🤖 Integración con Watson X.ai API
- 🤖 Chat conversacional con contexto de Maximo
- 🤖 Modelos predictivos para mantenimiento
- 🤖 Generación automática de insights

**Tiempo Total Estimado**: 10-14 semanas para MVP completo

## 🔒 Seguridad y Performance

### Seguridad
- **OAuth2 + JWT**: Autenticación robusta con tokens seguros
- **RBAC**: Control de acceso basado en roles
- **HTTPS/TLS**: Encriptación end-to-end
- **Auditoría**: Logging completo de operaciones
- **Rate Limiting**: Protección contra ataques DDoS

### Performance
- **Redis Cache**: Cache multi-nivel para consultas frecuentes
- **Lazy Loading**: Carga bajo demanda de componentes
- **CDN**: Distribución de assets estáticos
- **WebSocket**: Updates en tiempo real eficientes
- **Compresión**: gzip/brotli para reducir payload

## 🐛 Solución de Problemas

### Errores Comunes

**Error de conexión con Maximo:**
```bash
# Verificar conectividad
curl -H "apikey: tu_api_key" https://tu-instancia.maximo.com/maxrest/oslc/os/mxasset

# Revisar configuración
echo $MAXIMO_API_URL
echo $MAXIMO_API_KEY
```

**Watson X no responde:**
- Verificar credenciales en IBM Cloud
- Comprobar límites de uso de API
- Revisar logs del servicio Watson X

**Problemas de rendimiento:**
- Limpiar cache de Redis: `redis-cli FLUSHALL`
- Optimizar queries de base de datos
- Verificar uso de memoria con `htop`

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/amazing-feature`)
3. Commit cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

### Convenciones de Código
- Usar TypeScript para type safety
- Seguir ESLint configuration
- Documentar componentes con JSDoc
- Escribir tests para nuevas funcionalidades

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 📞 Contacto y Soporte

- **Desarrollador**: [David Mecalco](mailto:davidmecalcodeveloper@gmail.com)
- **Proyecto**: [GitHub Repository](https://github.com/tu-usuario/quantum-asset)
- **Documentación**: [Wiki del Proyecto](https://github.com/tu-usuario/quantum-asset/wiki)

---

<div align="center">

**🚀 Quantum Asset - Transformando la gestión de activos con IA**

*Desarrollado con ❤️ para la industria 4.0*

</div>
