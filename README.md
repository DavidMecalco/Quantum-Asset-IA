# Quantum Asset IA Foundation

Portal web de integración con IBM Maximo Application Suite potenciado por Watson X AI.

## Estructura del Proyecto

```
quantum-asset-ia-foundation/
├── frontend/                 # React 18 + TypeScript + Vite
├── backend/                  # Node.js + Express + TypeScript
├── nginx/                    # Reverse proxy configuration
├── docker-compose.yml        # Local development environment
└── README.md
```

## Requisitos Previos

- Node.js 18+ y npm 9+
- Docker y Docker Compose
- Git

## Configuración Inicial

### 1. Clonar e instalar dependencias

```bash
# Instalar dependencias del proyecto raíz
npm install

# Instalar dependencias de todos los workspaces
npm run install:all
```

### 2. Configurar variables de entorno

```bash
# Copiar archivos de ejemplo
cp .env.example .env
cp frontend/.env.example frontend/.env

# Editar los archivos .env con tus configuraciones
```

### 3. Iniciar el entorno de desarrollo

#### Opción A: Con Docker (Recomendado)

```bash
# Construir e iniciar todos los servicios
npm run docker:build
npm run docker:up

# La aplicación estará disponible en:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:5000
# - Nginx (proxy): http://localhost:80
```

#### Opción B: Desarrollo local

```bash
# Terminal 1: Iniciar backend
cd backend
npm run dev

# Terminal 2: Iniciar frontend
cd frontend
npm run dev
```

## Scripts Disponibles

### Proyecto raíz
- `npm run dev` - Inicia frontend y backend en paralelo
- `npm run build` - Construye frontend y backend
- `npm run test` - Ejecuta tests de frontend y backend
- `npm run lint` - Ejecuta linting en ambos proyectos
- `npm run docker:up` - Inicia servicios con Docker Compose
- `npm run docker:down` - Detiene servicios Docker
- `npm run docker:build` - Construye imágenes Docker

### Frontend
- `npm run dev` - Servidor de desarrollo Vite
- `npm run build` - Construir para producción
- `npm run preview` - Vista previa de build de producción
- `npm run test` - Ejecutar tests con Vitest
- `npm run lint` - Linting con ESLint

### Backend
- `npm run dev` - Servidor de desarrollo con nodemon
- `npm run build` - Compilar TypeScript
- `npm run start` - Iniciar servidor de producción
- `npm run test` - Ejecutar tests con Jest
- `npm run lint` - Linting con ESLint

## Tecnologías Utilizadas

### Frontend
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework de CSS
- **shadcn/ui** - Componentes de UI
- **React Query** - Gestión de estado del servidor
- **Zustand** - Gestión de estado global
- **React Router** - Enrutamiento
- **Recharts** - Gráficas y visualizaciones

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **TypeScript** - Tipado estático
- **Winston** - Logging
- **JWT** - Autenticación
- **Redis** - Cache y sesiones
- **PostgreSQL** - Base de datos

### Infraestructura
- **Docker** - Containerización
- **Docker Compose** - Orquestación local
- **Nginx** - Reverse proxy
- **Redis** - Cache y almacén de sesiones
- **PostgreSQL** - Base de datos relacional

## Arquitectura

El proyecto sigue una arquitectura de microservicios con:

- **Frontend**: SPA React con diseño glassmorphism
- **Backend**: API REST con autenticación OAuth2
- **Base de datos**: PostgreSQL para persistencia
- **Cache**: Redis para sesiones y cache
- **Proxy**: Nginx para enrutamiento

## Configuración de Maximo

Para conectar con IBM Maximo:

1. Configurar OAuth2 en Maximo Application Suite
2. Obtener Client ID y Client Secret
3. Configurar las variables de entorno en `.env`
4. Ajustar las URLs de endpoints según tu instancia

## Desarrollo

### Estructura de carpetas

```
frontend/src/
├── components/          # Componentes reutilizables
├── pages/              # Páginas de la aplicación
├── hooks/              # Custom hooks
├── services/           # Servicios API
├── stores/             # Stores de Zustand
├── types/              # Definiciones TypeScript
├── utils/              # Utilidades
└── test/               # Configuración de tests

backend/src/
├── controllers/        # Controladores de API
├── middleware/         # Middleware de Express
├── services/           # Lógica de negocio
├── models/             # Modelos de datos
├── routes/             # Definición de rutas
├── utils/              # Utilidades
└── types/              # Definiciones TypeScript
```

### Convenciones de código

- Usar TypeScript estricto
- Seguir las reglas de ESLint configuradas
- Escribir tests para funcionalidad crítica
- Usar commits convencionales
- Documentar APIs con JSDoc

## Próximos pasos

1. Implementar autenticación OAuth2 con Maximo
2. Crear servicios de integración con API de Maximo
3. Desarrollar dashboard con métricas básicas
4. Implementar sistema de logging y monitoreo
5. Agregar tests comprehensivos

## Soporte

Para problemas o preguntas sobre el desarrollo, consultar la documentación del proyecto o contactar al equipo de desarrollo.