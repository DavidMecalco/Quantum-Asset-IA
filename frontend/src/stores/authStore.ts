import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthStore, User, LoginCredentials } from '../types/auth';
import { authService } from '../services/authService';

// Estado inicial
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Crear el store de autenticación con persistencia
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      ...initialState,

      // Acción para iniciar sesión
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authService.login(credentials);
          
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Opcional: configurar auto-logout cuando expire el token
          if (response.expiresIn) {
            setTimeout(() => {
              get().logout();
            }, response.expiresIn * 1000);
          }

        } catch (error: any) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Error al iniciar sesión',
          });
          throw error; // Re-lanzar para que el componente pueda manejarlo
        }
      },

      // Acción para cerrar sesión
      logout: async () => {
        set({ isLoading: true });

        try {
          await authService.logout();
        } catch (error) {
          // Ignorar errores de logout del servidor
          console.warn('Error during logout:', error);
        } finally {
          // Siempre limpiar el estado local
          set({
            ...initialState,
          });
        }
      },

      // Acción para establecer usuario (útil para refresh o login automático)
      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          error: null,
        });
      },

      // Acción para establecer estado de carga
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Acción para establecer error
      setError: (error: string | null) => {
        set({ error });
      },

      // Acción para limpiar errores
      clearError: () => {
        set({ error: null });
      },

      // Acción para verificar si el usuario está autenticado al cargar la app
      checkAuth: async () => {
        const hasValidToken = authService.hasValidToken();
        
        if (!hasValidToken) {
          // Si no hay token válido, limpiar estado
          set({ ...initialState });
          return;
        }

        // Si hay token válido pero no hay usuario en el store, 
        // podríamos hacer una llamada para obtener los datos del usuario
        const currentState = get();
        if (!currentState.user && hasValidToken) {
          set({ isLoading: true });
          
          try {
            // Aquí podrías hacer una llamada a /auth/me para obtener datos del usuario
            // Por ahora, solo verificamos que el token sea válido
            set({
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            // Si falla, limpiar todo
            authService.clearTokens();
            set({ ...initialState });
          }
        }
      },

      // Acción para actualizar datos del usuario
      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          });
        }
      },

      // Acción para refrescar token
      refreshToken: async () => {
        try {
          await authService.refreshToken();
          // El token se actualiza automáticamente en el servicio
          return true;
        } catch (error) {
          // Si falla el refresh, cerrar sesión
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'auth-storage', // Nombre para localStorage
      storage: createJSONStorage(() => localStorage),
      
      // Configurar qué partes del estado persistir
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // No persistir isLoading ni error
      }),

      // Función para manejar la hidratación del estado
      onRehydrateStorage: () => (state) => {
        // Verificar tokens al hidratar el estado
        if (state) {
          const hasValidToken = authService.hasValidToken();
          if (!hasValidToken && state.isAuthenticated) {
            // Si el estado dice que está autenticado pero no hay token válido,
            // limpiar el estado
            state.user = null;
            state.isAuthenticated = false;
          }
        }
      },
    }
  )
);

// Selectores útiles para componentes
export const authSelectors = {
  // Selector para verificar si está autenticado
  isAuthenticated: (state: AuthStore) => state.isAuthenticated,
  
  // Selector para obtener usuario actual
  user: (state: AuthStore) => state.user,
  
  // Selector para verificar si está cargando
  isLoading: (state: AuthStore) => state.isLoading,
  
  // Selector para obtener error actual
  error: (state: AuthStore) => state.error,
  
  // Selector para verificar si es admin
  isAdmin: (state: AuthStore) => state.user?.role === 'admin',
  
  // Selector para obtener nombre completo
  fullName: (state: AuthStore) => 
    state.user ? `${state.user.firstName} ${state.user.lastName}` : null,
};

// Hook personalizado para usar selectores comunes
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    // Estado
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    
    // Acciones
    login: store.login,
    logout: store.logout,
    setUser: store.setUser,
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
    checkAuth: store.checkAuth,
    updateUser: store.updateUser,
    refreshToken: store.refreshToken,
    
    // Selectores computados
    isAdmin: store.user?.role === 'admin',
    fullName: store.user ? `${store.user.firstName} ${store.user.lastName}` : null,
  };
};

// Función para inicializar el store (llamar al inicio de la app)
export const initializeAuth = async () => {
  const store = useAuthStore.getState();
  await store.checkAuth();
};