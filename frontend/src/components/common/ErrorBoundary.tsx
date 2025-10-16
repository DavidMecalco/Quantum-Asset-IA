import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

// Tipos para el error boundary
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolateError?: boolean;
  level?: 'widget' | 'section' | 'page';
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetErrorBoundary: () => void;
  errorId: string;
  level?: 'widget' | 'section' | 'page';
}

// Servicio de logging de errores
class ErrorLogger {
  private static instance: ErrorLogger;
  private errors: Array<{
    id: string;
    error: Error;
    errorInfo: ErrorInfo;
    timestamp: Date;
    level: string;
    userId?: string;
    url: string;
    userAgent: string;
  }> = [];

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  log(
    error: Error, 
    errorInfo: ErrorInfo, 
    level: string = 'unknown',
    userId?: string
  ): string {
    const errorId = this.generateErrorId();
    const errorEntry = {
      id: errorId,
      error,
      errorInfo,
      timestamp: new Date(),
      level,
      userId,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.errors.push(errorEntry);

    // Log en consola para desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary [${level}] - ${errorId}`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }

    // En producción, enviar a servicio de logging
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(errorEntry);
    }

    return errorId;
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendToLoggingService(errorEntry: any): Promise<void> {
    try {
      // TODO: Implementar envío a servicio de logging real
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...errorEntry,
          error: {
            message: errorEntry.error.message,
            stack: errorEntry.error.stack,
            name: errorEntry.error.name
          }
        })
      });
    } catch (loggingError) {
      console.warn('Failed to send error to logging service:', loggingError);
    }
  }

  getErrors(): typeof this.errors {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }
}

// Componente de fallback por defecto para widgets
const WidgetErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  errorId,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center min-h-[200px]">
      <div className="text-red-400 mb-4">
        <AlertTriangle className="w-12 h-12 mx-auto" />
      </div>
      <h3 className="text-white font-medium mb-2">Error en Widget</h3>
      <p className="text-glass-300 text-sm mb-4 max-w-xs">
        {error.message || 'Ha ocurrido un error inesperado en este widget'}
      </p>
      <div className="space-y-2">
        <button
          onClick={resetErrorBoundary}
          className="flex items-center space-x-2 px-4 py-2 bg-quantum-blue hover:bg-quantum-blue/80 text-white rounded-lg text-sm transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reintentar</span>
        </button>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left">
            <summary className="text-glass-400 cursor-pointer text-xs">
              Error ID: {errorId}
            </summary>
            <pre className="mt-2 p-2 bg-black/50 rounded text-xs text-red-300 overflow-auto max-h-32">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

// Componente de fallback para secciones
const SectionErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  errorId,
}) => {
  return (
    <div className="bg-glass-50 backdrop-blur-md border border-red-500/20 rounded-xl p-6 text-center">
      <div className="text-red-400 mb-4">
        <AlertTriangle className="w-16 h-16 mx-auto" />
      </div>
      <h3 className="text-xl font-medium text-white mb-2">Error en Sección</h3>
      <p className="text-glass-300 mb-6">
        Ha ocurrido un error en esta sección del dashboard. 
        Puedes intentar recargarla o continuar usando otras partes de la aplicación.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={resetErrorBoundary}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-quantum-blue hover:bg-quantum-blue/80 text-white rounded-lg transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reintentar</span>
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center justify-center space-x-2 px-6 py-3 bg-glass-200 hover:bg-glass-300 text-white rounded-lg transition-colors duration-200"
        >
          <Home className="w-4 h-4" />
          <span>Recargar Página</span>
        </button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-left">
          <summary className="text-glass-400 cursor-pointer">
            Detalles del error (ID: {errorId})
          </summary>
          <pre className="mt-2 p-3 bg-black/50 rounded text-xs text-red-300 overflow-auto">
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
};

// Componente de fallback para páginas completas
const PageErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  errorId,
}) => {
  const handleReportError = () => {
    const subject = encodeURIComponent(`Error Report - ${errorId}`);
    const body = encodeURIComponent(`
Error ID: ${errorId}
Error Message: ${error.message}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Please describe what you were doing when this error occurred:
[Your description here]
    `);
    
    window.open(`mailto:support@quantumasset.com?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-quantum-dark via-quantum-purple/20 to-quantum-indigo/20 flex items-center justify-center p-4">
      <div className="bg-glass-50 backdrop-blur-md border border-glass-100 rounded-2xl p-8 max-w-lg w-full text-center">
        <div className="text-red-400 mb-6">
          <AlertTriangle className="w-20 h-20 mx-auto" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">¡Oops! Algo salió mal</h1>
        <p className="text-glass-300 mb-6">
          Ha ocurrido un error inesperado en la aplicación. 
          Nuestro equipo ha sido notificado automáticamente.
        </p>
        
        <div className="bg-glass-100 rounded-lg p-4 mb-6">
          <p className="text-glass-300 text-sm">
            <strong>ID del Error:</strong> {errorId}
          </p>
          <p className="text-glass-300 text-sm mt-1">
            Guarda este ID para referencia futura
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={resetErrorBoundary}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-quantum-blue hover:bg-quantum-blue/80 text-white rounded-lg transition-colors duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Intentar de Nuevo</span>
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-glass-200 hover:bg-glass-300 text-white rounded-lg transition-colors duration-200"
          >
            <Home className="w-5 h-5" />
            <span>Recargar Página</span>
          </button>
          
          <button
            onClick={handleReportError}
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-glass-100 hover:bg-glass-200 text-white rounded-lg transition-colors duration-200"
          >
            <Bug className="w-5 h-5" />
            <span>Reportar Error</span>
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-glass-400 cursor-pointer">
              Información técnica del error
            </summary>
            <div className="mt-3 p-3 bg-black/50 rounded text-xs">
              <div className="text-red-300 mb-2">
                <strong>Error:</strong> {error.message}
              </div>
              <pre className="text-red-300 overflow-auto max-h-40">
                {error.stack}
              </pre>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

// Componente Error Boundary principal
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;
  private logger = ErrorLogger.getInstance();

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.logger.log(
      error, 
      errorInfo, 
      this.props.level || 'unknown'
    );

    this.setState({
      errorInfo,
      errorId
    });

    // Llamar callback personalizado si existe
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      });
    }, 100);
  };

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback: CustomFallback, level = 'widget' } = this.props;

    if (hasError && error) {
      // Usar fallback personalizado si se proporciona
      if (CustomFallback) {
        return (
          <CustomFallback
            error={error}
            errorInfo={errorInfo}
            resetErrorBoundary={this.resetErrorBoundary}
            errorId={errorId}
            level={level}
          />
        );
      }

      // Usar fallback por defecto según el nivel
      switch (level) {
        case 'page':
          return (
            <PageErrorFallback
              error={error}
              errorInfo={errorInfo}
              resetErrorBoundary={this.resetErrorBoundary}
              errorId={errorId}
              level={level}
            />
          );
        case 'section':
          return (
            <SectionErrorFallback
              error={error}
              errorInfo={errorInfo}
              resetErrorBoundary={this.resetErrorBoundary}
              errorId={errorId}
              level={level}
            />
          );
        case 'widget':
        default:
          return (
            <WidgetErrorFallback
              error={error}
              errorInfo={errorInfo}
              resetErrorBoundary={this.resetErrorBoundary}
              errorId={errorId}
              level={level}
            />
          );
      }
    }

    return children;
  }
}

// Hook para usar el error logger
export const useErrorLogger = () => {
  const logger = ErrorLogger.getInstance();
  
  return {
    logError: (error: Error, context?: string) => {
      return logger.log(error, { componentStack: context || '' }, 'manual');
    },
    getErrors: () => logger.getErrors(),
    clearErrors: () => logger.clearErrors()
  };
};

// Componentes de conveniencia
export const WidgetErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}> = ({ children, onError, resetKeys }) => (
  <ErrorBoundary
    level="widget"
    onError={onError}
    resetKeys={resetKeys}
    isolateError={true}
  >
    {children}
  </ErrorBoundary>
);

export const SectionErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}> = ({ children, onError, resetKeys }) => (
  <ErrorBoundary
    level="section"
    onError={onError}
    resetKeys={resetKeys}
  >
    {children}
  </ErrorBoundary>
);

export const PageErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}> = ({ children, onError }) => (
  <ErrorBoundary
    level="page"
    onError={onError}
    resetOnPropsChange={true}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;