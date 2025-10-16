import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Page components
import { HomePage } from './components/pages/HomePage';

// Auth initialization
import { initializeAuth } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente de login simple para pruebas
const SimpleLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simular delay de autenticación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Crear un token mock y guardarlo
      const mockToken = 'mock-jwt-token-' + Date.now();
      localStorage.setItem('accessToken', mockToken);
      
      // Llamar al callback para actualizar el estado
      onLogin();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Quantum Asset IA</h1>
          <p className="text-white/70 text-sm">Portal de Integración con IBM Maximo</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials({...credentials, email: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@quantum.com"
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">Contraseña</label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin123"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
          
          <div className="text-center text-white/60 text-sm">
            <p>Credenciales de prueba:</p>
            <p>admin@quantum.com / admin123</p>
            <p className="mt-2 text-xs">💡 Puedes usar cualquier email/contraseña</p>
          </div>
        </form>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await initializeAuth();
        // Para pruebas, verificar si hay token en localStorage
        const token = localStorage.getItem('accessToken');
        setIsAuthenticated(!!token);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Función para manejar login exitoso
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  // Función para manejar logout
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
          </div>
          <p className="text-white/70 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Login route */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/home" replace /> : <SimpleLogin onLogin={handleLoginSuccess} />
          } />
          
          {/* Protected routes */}
          <Route path="/home" element={
            isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />
          } />
          
          <Route path="/dashboard" element={
            isAuthenticated ? <HomePage /> : <Navigate to="/login" replace />
          } />
          
          {/* Default redirects */}
          <Route path="/" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;