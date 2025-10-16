import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Lock, CheckCircle, Shield, Clock } from 'lucide-react';
import { LoginFormProps, LoginFormState, LoginCredentials } from '../../types/auth';
import { useAuth, useAuthError } from '../../hooks/auth/useAuth';
import { ValidatedInput } from '../ui/ValidatedInput';
import { SecurePasswordInput } from '../ui/SecurePasswordInput';
import { ButtonLoading } from '../ui/LoadingSpinner';
import { FeedbackMessage, ShakeContainer } from '../ui/FeedbackMessage';
import { useSecurityCleanup, SECURITY_CONFIG } from '../../utils/security';
import { 
  validateEmail, 
  validatePassword, 
  sanitizeEmail, 
  createDebouncedValidator 
} from '../../utils/validation';

/**
 * Formulario de inicio de sesión con validación en tiempo real
 * Integra con el sistema de autenticación y manejo de errores
 */
export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  onError 
}) => {
  // Estado del formulario
  const [formState, setFormState] = useState<LoginFormState>({
    email: '',
    password: '',
    isLoading: false,
    errors: {},
    showPassword: false,
  });

  const [rememberMe, setRememberMe] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  // Hooks de seguridad
  const {
    isBlocked,
    recordFailedAttempt,
    recordSuccessfulAttempt,
    getAttemptInfo,
    addActivityCallback,
    removeActivityCallback,
  } = useSecurityCleanup();

  // Información de intentos de login
  const attemptInfo = getAttemptInfo('login-form');

  // Hooks de autenticación
  const { login } = useAuth();
  const { error: authError, clearError } = useAuthError();

  // Validadores con debounce
  const debouncedEmailValidator = useCallback(
    createDebouncedValidator(validateEmail, 500),
    []
  );

  // Limpiar errores cuando el usuario empiece a escribir
  const clearFieldError = (field: keyof LoginFormState['errors']) => {
    if (formState.errors[field]) {
      setFormState(prev => ({
        ...prev,
        errors: { ...prev.errors, [field]: undefined }
      }));
    }
    clearError();
  };

  // Manejar cambios en el email con validación en tiempo real
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const sanitizedEmail = sanitizeEmail(rawValue);
    
    setFormState(prev => ({
      ...prev,
      email: sanitizedEmail
    }));

    clearFieldError('email');

    // Validación con debounce
    if (sanitizedEmail) {
      debouncedEmailValidator(sanitizedEmail);
    }
  };

  // Manejar cambios en la contraseña
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    setFormState(prev => ({
      ...prev,
      password: value
    }));

    clearFieldError('password');
  };

  // Validar formulario completo
  const validateForm = (): boolean => {
    const emailValidation = validateEmail(formState.email);
    const passwordValidation = validatePassword(formState.password);

    const errors: LoginFormState['errors'] = {};

    if (!emailValidation.isValid) {
      errors.email = emailValidation.error;
    }

    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.error;
    }

    setFormState(prev => ({ ...prev, errors }));

    return emailValidation.isValid && passwordValidation.isValid;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = Date.now();
    const identifier = 'login-form';

    // Verificar si está bloqueado por intentos fallidos
    if (isBlocked(identifier)) {
      const info = getAttemptInfo(identifier);
      const timeLeft = Math.ceil((info.timeUntilUnblock || 0) / 1000);
      setFormState(prev => ({
        ...prev,
        errors: { general: `Cuenta bloqueada. Intenta en ${timeLeft} segundos.` }
      }));
      return;
    }

    // Verificar throttling (prevenir spam)
    if (now - lastSubmitTime < SECURITY_CONFIG.LOGIN_THROTTLE_DELAY) {
      setFormState(prev => ({
        ...prev,
        errors: { general: 'Por favor espera un momento antes de intentar nuevamente.' }
      }));
      return;
    }

    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setLastSubmitTime(now);

    // Preparar credenciales
    const credentials: LoginCredentials = {
      email: formState.email,
      password: formState.password,
      rememberMe,
    };

    setFormState(prev => ({ ...prev, isLoading: true, errors: {} }));

    try {
      await login(credentials);
      
      // Registrar intento exitoso
      recordSuccessfulAttempt(identifier);
      
      // Mostrar mensaje de éxito
      setShowSuccessMessage(true);
      
      // Callback de éxito
      if (onSuccess) {
        // Note: user data will be available in the auth store
        onSuccess(null as any); // The actual user will be in the store
      }

    } catch (error: any) {
      // Registrar intento fallido
      recordFailedAttempt(identifier);

      // Activar animación de shake
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      // Mostrar error
      const errorMessage = error.message || 'Error al iniciar sesión';
      setFormState(prev => ({
        ...prev,
        errors: { general: errorMessage }
      }));

      // Callback de error
      if (onError) {
        onError(errorMessage);
      }

    } finally {
      setFormState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Limpiar campos después de inactividad (seguridad)
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        setFormState(prev => ({
          ...prev,
          email: '',
          password: '',
          errors: {},
        }));
        setRememberMe(false);
      }, 10 * 60 * 1000); // 10 minutos
    };

    // Reset timer on any activity
    const handleActivity = () => resetTimer();
    
    document.addEventListener('mousedown', handleActivity);
    document.addEventListener('keydown', handleActivity);
    
    resetTimer();

    return () => {
      clearTimeout(inactivityTimer);
      document.removeEventListener('mousedown', handleActivity);
      document.removeEventListener('keydown', handleActivity);
    };
  }, []);

  return (
    <ShakeContainer isShaking={isShaking}>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Mensaje de éxito */}
        {showSuccessMessage && (
          <FeedbackMessage
            type="success"
            title="¡Inicio de sesión exitoso!"
            message="Redirigiendo al dashboard..."
            isVisible={showSuccessMessage}
            onClose={() => setShowSuccessMessage(false)}
            autoClose={true}
            autoCloseDelay={2000}
            className="animate-fadeInDown"
          />
        )}

        {/* Error general */}
        {(formState.errors.general || authError) && (
          <FeedbackMessage
            type="error"
            title="Error de autenticación"
            message={formState.errors.general || authError || ''}
            isVisible={true}
            onClose={() => {
              setFormState(prev => ({ ...prev, errors: { ...prev.errors, general: undefined } }));
              clearError();
            }}
            autoClose={true}
            autoCloseDelay={6000}
            className="animate-fadeInDown"
          />
        )}

      {/* Campos del formulario */}
      <div className="space-y-6">
        {/* Campo Email con validación mejorada */}
        <ValidatedInput
          id="email"
          type="email"
          label="Correo Electrónico"
          placeholder="tu@email.com"
          value={formState.email}
          onChange={(value) => {
            const sanitized = sanitizeEmail(value);
            setFormState(prev => ({ ...prev, email: sanitized }));
            clearFieldError('email');
          }}
          onValidationChange={(isValid, error) => {
            if (!isValid && error) {
              setFormState(prev => ({
                ...prev,
                errors: { ...prev.errors, email: error }
              }));
            } else {
              clearFieldError('email');
            }
          }}
          disabled={formState.isLoading}
          required={true}
          icon={<Mail className="h-5 w-5" />}
          showValidation={true}
          autoComplete="email"
        />

        {/* Campo Contraseña con validación mejorada */}
        <ValidatedInput
          id="password"
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          value={formState.password}
          onChange={(value) => {
            setFormState(prev => ({ ...prev, password: value }));
            clearFieldError('password');
          }}
          onValidationChange={(isValid, error) => {
            if (!isValid && error) {
              setFormState(prev => ({
                ...prev,
                errors: { ...prev.errors, password: error }
              }));
            } else {
              clearFieldError('password');
            }
          }}
          disabled={formState.isLoading}
          required={true}
          icon={<Lock className="h-5 w-5" />}
          showValidation={true}
          showPasswordStrength={false} // No mostrar fortaleza en login, solo en registro
          autoComplete="current-password"
        />
      </div>

      {/* Recordarme */}
      <div className="flex items-center">
        <input
          id="remember-me"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={formState.isLoading}
          className="h-4 w-4 text-quantum-blue bg-glass-50 border-glass-100 rounded focus:ring-quantum-blue focus:ring-2 disabled:opacity-50"
        />
        <label htmlFor="remember-me" className="ml-2 text-sm text-glass-200">
          Recordarme
        </label>
      </div>

      {/* Botón de envío */}
      <button
        type="submit"
        disabled={formState.isLoading || attemptInfo.isBlocked}
        className={`
          w-full flex justify-center items-center px-4 py-3 
          bg-gradient-to-r from-quantum-blue to-quantum-purple
          hover:from-quantum-blue/90 hover:to-quantum-purple/90
          text-white font-medium rounded-lg
          focus:outline-none focus:ring-2 focus:ring-quantum-blue focus:ring-offset-2 focus:ring-offset-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
          ${formState.isLoading ? 'cursor-wait animate-quantumPulse' : ''}
          ${attemptInfo.isBlocked ? 'bg-gray-500 cursor-not-allowed' : ''}
        `}
      >
        <ButtonLoading
          isLoading={formState.isLoading}
          text="Iniciar Sesión"
          loadingText="Iniciando sesión..."
          size="md"
        />
      </button>

        {/* Información de rate limiting */}
        {(attemptInfo.count > 0 || attemptInfo.isBlocked) && (
          <div className="space-y-2">
            <FeedbackMessage
              type={attemptInfo.isBlocked ? "error" : attemptInfo.count >= 3 ? "error" : "warning"}
              title={attemptInfo.isBlocked ? "Acceso Bloqueado" : "Advertencia de Seguridad"}
              message={
                attemptInfo.isBlocked 
                  ? `Cuenta bloqueada por seguridad. Tiempo restante: ${Math.ceil((attemptInfo.timeUntilUnblock || 0) / 1000)} segundos.`
                  : `Intentos fallidos: ${attemptInfo.count}/${SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS}. ${attemptInfo.remainingAttempts} intentos restantes.`
              }
              isVisible={true}
              autoClose={false}
              className="animate-fadeInUp"
            />
            
            {/* Barra de progreso de intentos */}
            {!attemptInfo.isBlocked && attemptInfo.count > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-glass-200">
                  <span>Nivel de seguridad</span>
                  <span>{attemptInfo.count}/{SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS}</span>
                </div>
                
                <div className="w-full bg-glass-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      attemptInfo.count >= 4 
                        ? 'bg-red-500' 
                        : attemptInfo.count >= 3 
                          ? 'bg-yellow-500' 
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${(attemptInfo.count / SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje de éxito de validación */}
        {!formState.isLoading && 
         !formState.errors.email && 
         !formState.errors.password && 
         formState.email && 
         formState.password && (
          <div className="flex items-center justify-center space-x-2 text-green-400 animate-fadeInUp">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Formulario válido - Listo para enviar</span>
          </div>
        )}
      </form>
    </ShakeContainer>
  );
};

export default LoginForm;