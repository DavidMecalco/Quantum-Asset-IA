import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Search,
  ChevronDown,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUnreadNotifications } from '../../hooks/useNotifications';
import { useSystemStatus } from '../../hooks/useDashboardData';

// Props para el DashboardHeader
interface DashboardHeaderProps {
  onMenuToggle?: () => void;
  onNotificationsClick?: () => void;
  onSettingsClick?: () => void;
  onSearchSubmit?: (query: string) => void;
  className?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  isMobileMenuOpen?: boolean;
}

// Componente de notificaciones
const NotificationBadge: React.FC<{ 
  count: number; 
  onClick?: () => void;
}> = ({ count, onClick }) => {
  const { formatCount } = useUnreadNotifications();
  
  return (
    <button
      onClick={onClick}
      className="relative p-2 text-glass-200 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200"
      title={`${count} notificaciones no leídas`}
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {formatCount(99)}
        </span>
      )}
    </button>
  );
};

// Componente de estado del sistema
const SystemStatusIndicator: React.FC = () => {
  const { data: systemStatus, isLoading } = useSystemStatus();
  
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-glass-300">
        <Activity className="w-4 h-4 animate-pulse" />
        <span className="text-sm">Verificando...</span>
      </div>
    );
  }

  const isConnected = systemStatus?.isConnected ?? false;
  const performance = systemStatus?.performance ?? 'critical';
  
  const getStatusColor = () => {
    if (!isConnected) return 'text-red-400';
    switch (performance) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = () => {
    if (!isConnected) return 'Desconectado';
    switch (performance) {
      case 'good': return 'Óptimo';
      case 'warning': return 'Advertencia';
      case 'critical': return 'Crítico';
      default: return 'Desconocido';
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
      {isConnected ? (
        <Wifi className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      <span className="text-sm hidden sm:inline">
        Maximo: {getStatusText()}
      </span>
    </div>
  );
};

// Componente de perfil de usuario
const UserProfile: React.FC<{ 
  onLogout: () => void;
  onSettings?: () => void;
}> = ({ onLogout, onSettings }) => {
  const { user } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 p-2 hover:bg-glass-200 rounded-lg transition-colors duration-200"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-gradient-to-br from-quantum-blue to-quantum-purple rounded-full flex items-center justify-center text-white text-sm font-medium">
          {initials}
        </div>
        
        {/* Información del usuario (oculta en móvil) */}
        <div className="hidden md:block text-right">
          <p className="text-white text-sm font-medium">{fullName}</p>
          <p className="text-glass-300 text-xs capitalize">{user.role}</p>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-glass-300 transition-transform duration-200 ${
          isDropdownOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-glass-50 backdrop-blur-md border border-glass-100 rounded-xl shadow-xl z-50">
          {/* Header del dropdown */}
          <div className="p-4 border-b border-glass-100">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-quantum-blue to-quantum-purple rounded-full flex items-center justify-center text-white font-medium">
                {initials}
              </div>
              <div>
                <p className="text-white font-medium">{fullName}</p>
                <p className="text-glass-300 text-sm">{user.email}</p>
                <p className="text-glass-400 text-xs capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Opciones del menú */}
          <div className="p-2">
            <button
              onClick={() => {
                onSettings?.();
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center space-x-3 p-3 text-glass-200 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200"
            >
              <Settings className="w-4 h-4" />
              <span>Configuración</span>
            </button>
            
            <button
              onClick={() => {
                // Aquí iría la lógica para ver perfil
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center space-x-3 p-3 text-glass-200 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200"
            >
              <User className="w-4 h-4" />
              <span>Mi Perfil</span>
            </button>

            <hr className="my-2 border-glass-100" />
            
            <button
              onClick={() => {
                onLogout();
                setIsDropdownOpen(false);
              }}
              className="w-full flex items-center space-x-3 p-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de búsqueda
const SearchBar: React.FC<{
  onSubmit?: (query: string) => void;
  placeholder?: string;
}> = ({ onSubmit, placeholder = "Buscar..." }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && onSubmit) {
      onSubmit(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={`relative transition-all duration-200 ${
        isFocused ? 'scale-105' : ''
      }`}>
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-glass-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 bg-glass-100 border border-glass-200 rounded-lg text-white placeholder-glass-400 focus:outline-none focus:ring-2 focus:ring-quantum-blue focus:border-transparent transition-all duration-200"
        />
      </div>
    </form>
  );
};

// Componente principal DashboardHeader
export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onMenuToggle,
  onNotificationsClick,
  onSettingsClick,
  onSearchSubmit,
  className = '',
  showSearch = true,
  showNotifications = true,
  isMobileMenuOpen = false
}) => {
  const { logout } = useAuthStore();
  const { unreadCount } = useUnreadNotifications();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className={`bg-glass-50 backdrop-blur-md border-b border-glass-100 sticky top-0 z-40 ${className}`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo y navegación móvil */}
          <div className="flex items-center space-x-4">
            {/* Botón de menú móvil */}
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 text-glass-200 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img
                src="/src/assets/QAI_logo.png"
                alt="Quantum Asset IA"
                className="h-8 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white">
                  Quantum Asset IA
                </h1>
                <p className="text-glass-300 text-xs">
                  Portal de Integración con IBM Maximo
                </p>
              </div>
            </div>
          </div>

          {/* Barra de búsqueda (centro) */}
          {showSearch && (
            <div className="hidden md:block flex-1 max-w-md mx-8">
              <SearchBar 
                onSubmit={onSearchSubmit}
                placeholder="Buscar work orders, assets..."
              />
            </div>
          )}

          {/* Controles del lado derecho */}
          <div className="flex items-center space-x-4">
            {/* Estado del sistema */}
            <div className="hidden lg:block">
              <SystemStatusIndicator />
            </div>

            {/* Notificaciones */}
            {showNotifications && (
              <NotificationBadge 
                count={unreadCount}
                onClick={onNotificationsClick}
              />
            )}

            {/* Configuración */}
            <button
              onClick={onSettingsClick}
              className="p-2 text-glass-200 hover:text-white hover:bg-glass-200 rounded-lg transition-colors duration-200"
              title="Configuración del Dashboard"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Perfil de usuario */}
            <UserProfile 
              onLogout={handleLogout}
              onSettings={onSettingsClick}
            />
          </div>
        </div>

        {/* Barra de búsqueda móvil */}
        {showSearch && (
          <div className="md:hidden mt-4">
            <SearchBar 
              onSubmit={onSearchSubmit}
              placeholder="Buscar..."
            />
          </div>
        )}
      </div>
    </header>
  );
};

export default DashboardHeader;