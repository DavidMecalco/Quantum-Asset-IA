# Requirements Document

## Introduction

Quantum Asset IA es un portal web de integración con IBM Maximo Application Suite (MAS) potenciado por Watson X AI. Esta fase inicial establece los fundamentos del sistema, incluyendo la estructura del proyecto, autenticación OAuth2 con Maximo, conexión básica con la API REST de Maximo, y un dashboard inicial con métricas básicas. El objetivo es crear una base sólida y escalable para las futuras fases del proyecto.

## Requirements

### Requirement 1

**User Story:** Como desarrollador del sistema, quiero una estructura de proyecto bien organizada para frontend y backend, para que el código sea mantenible y escalable a largo plazo.

#### Acceptance Criteria

1. WHEN se inicializa el proyecto THEN el sistema SHALL crear una estructura de carpetas separada para frontend (React + TypeScript) y backend (Node.js + Express)
2. WHEN se configura el frontend THEN el sistema SHALL incluir Tailwind CSS, shadcn/ui, React Query, y Zustand como dependencias principales
3. WHEN se configura el backend THEN el sistema SHALL incluir Express, JWT, Winston, y las librerías necesarias para OAuth2
4. WHEN se establece la estructura THEN el sistema SHALL incluir configuración de Docker y Docker Compose para desarrollo local
5. WHEN se organiza el código THEN el sistema SHALL seguir patrones de arquitectura limpia con separación de responsabilidades

### Requirement 2

**User Story:** Como usuario del sistema, quiero autenticarme usando mis credenciales de Maximo, para que pueda acceder de forma segura a los datos sin crear cuentas adicionales.

#### Acceptance Criteria

1. WHEN un usuario accede al sistema THEN el sistema SHALL redirigir al flujo OAuth2 de Maximo si no está autenticado
2. WHEN se completa la autenticación OAuth2 THEN el sistema SHALL generar un JWT token válido para sesiones posteriores
3. WHEN se valida un token JWT THEN el sistema SHALL verificar la validez y expiración del token
4. WHEN un token expira THEN el sistema SHALL renovar automáticamente el token o solicitar re-autenticación
5. WHEN un usuario se desconecta THEN el sistema SHALL invalidar el token JWT y limpiar la sesión
6. IF la autenticación falla THEN el sistema SHALL mostrar un mensaje de error claro y permitir reintentar

### Requirement 3

**User Story:** Como administrador del sistema, quiero que todos los servicios necesarios estén configurados correctamente, para que el sistema funcione de manera confiable desde el inicio.

#### Acceptance Criteria

1. WHEN se inicia el entorno de desarrollo THEN el sistema SHALL levantar Redis para cache y sesiones
2. WHEN se configura la base de datos THEN el sistema SHALL inicializar PostgreSQL con las tablas necesarias para logs y configuración
3. WHEN se configura el logging THEN el sistema SHALL usar Winston para registrar todas las operaciones importantes
4. WHEN se configura Docker THEN el sistema SHALL permitir levantar todos los servicios con un solo comando
5. WHEN se configura el reverse proxy THEN el sistema SHALL usar nginx para enrutar requests entre frontend y backend
6. IF algún servicio falla THEN el sistema SHALL mostrar logs claros del error y permitir diagnóstico

### Requirement 4

**User Story:** Como desarrollador, quiero establecer una conexión básica con la API REST de Maximo, para que pueda consultar datos de assets y work orders desde el inicio.

#### Acceptance Criteria

1. WHEN se configura la conexión THEN el sistema SHALL conectarse exitosamente a los endpoints OSLC de Maximo (/maximo/oslc/os/mxasset, /mxwo)
2. WHEN se realiza una consulta THEN el sistema SHALL obtener datos de assets usando filtros básicos
3. WHEN se consultan work orders THEN el sistema SHALL recuperar información de órdenes de trabajo con sus estados
4. WHEN se maneja la autenticación API THEN el sistema SHALL usar el token OAuth2 para autorizar requests a Maximo
5. WHEN ocurre un error de API THEN el sistema SHALL manejar errores de red y timeouts de manera elegante
6. IF la API de Maximo no está disponible THEN el sistema SHALL mostrar un estado de conexión y permitir reintentos

### Requirement 5

**User Story:** Como usuario final, quiero ver un dashboard inicial con métricas básicas de Maximo, para que pueda tener una visión general del estado de los assets y work orders.

#### Acceptance Criteria

1. WHEN accedo al dashboard THEN el sistema SHALL mostrar el número total de assets activos
2. WHEN se cargan las métricas THEN el sistema SHALL mostrar el número de work orders por estado (abierto, en progreso, cerrado)
3. WHEN se visualizan los datos THEN el sistema SHALL usar gráficas básicas con Recharts para mostrar tendencias
4. WHEN se actualiza la información THEN el sistema SHALL refrescar los datos automáticamente cada 5 minutos
5. WHEN se aplica el diseño THEN el sistema SHALL usar el estilo glassmorphism con la paleta de colores especificada (blues, purples, indigos)
6. IF no hay datos disponibles THEN el sistema SHALL mostrar un estado vacío informativo

### Requirement 6

**User Story:** Como desarrollador, quiero que el sistema sea responsive y tenga una buena experiencia de usuario, para que funcione correctamente en diferentes dispositivos y sea intuitivo de usar.

#### Acceptance Criteria

1. WHEN se accede desde dispositivos móviles THEN el sistema SHALL adaptar la interfaz para pantallas pequeñas
2. WHEN se navega por la aplicación THEN el sistema SHALL mostrar transiciones suaves entre secciones
3. WHEN se cargan datos THEN el sistema SHALL mostrar indicadores de carga apropiados
4. WHEN ocurre un error THEN el sistema SHALL mostrar mensajes de error claros y acciones sugeridas
5. WHEN se usa la tipografía THEN el sistema SHALL aplicar la fuente Inter de manera consistente
6. IF la conexión es lenta THEN el sistema SHALL manejar estados de carga prolongada de manera elegante