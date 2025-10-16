import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Eye, EyeOff, Lock, Shield, AlertTriangle } from 'lucide-react';
import { PasswordSecurity, useSecurityCleanup, SECURITY_CONFIG } from '../../utils/security';
import { ValidationIndicator } from './ValidationIndicator';

export interface SecurePasswordInputProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  disabled?: boolean;
  required?: boolean;
  showStrengthIndicator?: boolean;
  showToggleVisibility?: boolean;
  autoCleanup?: boolean;
  cleanupTimeout?: number;
  className?: string;
  autoComplete?: string;
}

/**
 * Campo de contraseña con características de seguridad avanzadas
 */
export const SecurePasswordInput: React.FC<SecurePasswordInputProps> = ({
  id,
  label,
  placeholder = '••••••••',
  value,
  onChange,
  onValidationChange,
  disabled = false,
  required = false,
  showStrengthIndicator = false,
  showToggleVisibility = true,
  autoCleanup = true,
  cleanupTimeout = SECURITY_CONFIG.INACTIVITY_TIMEOUT,
  className = '',
  autoComplete = 'current-password',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    setupFieldCleaning,
    clearFieldTimer,
    addActivityCallback,
    removeActivityCallback,
  } = useSecurityCleanup();

  // Validar fortaleza de contraseña
  const passwordSecurity = PasswordSecurity.isPasswordSecure(value);

  // Callback para limpiar campo
  const clearField = useCallback(() => {
    if (inputRef.current) {
      PasswordSecurity.clearPasswordField(inputRef.current);
      onChange('');
    }
  }, [onChange]);

  // Callback para actividad del usuario
  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
    
    if (autoCleanup && value) {
      // Reconfigurar timer de limpieza
      setupFieldCleaning(`password-${id}`, clearField, cleanupTimeout);
    }
  }, [autoCleanup, value, setupFieldCleaning, clearField, cleanupTimeout, id]);

  // Configurar detección de actividad
  useEffect(() => {
    if (autoCleanup) {
      addActivityCallback(handleActivity);
      
      return () => {
        removeActivityCallback(handleActivity);
        clearFieldTimer(`password-${id}`);
      };
    }
  }, [autoCleanup, handleActivity, addActivityCallback, removeActivityCallback, clearFieldTimer, id]);

  // Configurar limpieza automática cuando hay valor
  useEffect(() => {
    if (autoCleanup && value && !disabled) {
      setupFieldCleaning(`password-${id}`, clearField, cleanupTimeout);
    }

    return () => {
      if (autoCleanup) {
        clearFieldTimer(`password-${id}`);
      }
    };
  }, [value, autoCleanup, disabled, setupFieldCleaning, clearField, cleanupTimeout, clearFieldTimer, id]);

  // Notificar cambios de validación
  useEffect(() => {
    if (onValidationChange) {
      if (!value && required) {
        onValidationChange(false, 'La contraseña es obligatoria');
      } else if (value && !passwordSecurity.isSecure) {
        onValidationChange(false, 'La contraseña no cumple los requisitos de seguridad');
      } else {
        onValidationChange(true);
      }
    }
  }, [value, required, passwordSecurity.isSecure, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    handleActivity();
  };

  const handleFocus = () => {
    setIsFocused(true);
    handleActivity();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
    handleActivity();
  };

  const hasError = required && !value;
  const hasWarning = value && !passwordSecurity.isSecure;
  const hasSuccess = value && passwordSecurity.isSecure;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label htmlFor={id} className="block text-sm font-medium text-white">
        <div className="flex items-center space-x-2">
          <span>{label}</span>
          {required && <span className="text-red-400">*</span>}
          {autoCleanup && (
            <div className="flex items-center space-x-1 text-xs text-glass-200">
              <Shield className="w-3 h-3" />
              <span>Auto-limpieza</span>
            </div>
          )}
        </div>
      </label>

      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-glass-200" />
        </div>

        {/* Input */}
        <input
          ref={inputRef}
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`
            block w-full pl-10 pr-12 py-3
            bg-glass-50 border rounded-lg
            text-white placeholder-glass-200
            focus:outline-none focus:ring-2 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${hasError 
              ? 'border-red-500/50 focus:ring-red-500' 
              : hasWarning
                ? 'border-yellow-500/50 focus:ring-yellow-500'
                : hasSuccess
                  ? 'border-green-500/50 focus:ring-green-500'
                  : 'border-glass-100 hover:border-glass-200 focus:ring-quantum-blue'
            }
          `}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${id}-error` : 
            hasWarning ? `${id}-warning` : 
            hasSuccess ? `${id}-success` : undefined
          }
        />

        {/* Toggle Visibility Button */}
        {showToggleVisibility && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            disabled={disabled}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-glass-200 hover:text-white transition-colors duration-200 disabled:opacity-50"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Validation Messages */}
      <div className="min-h-[1.25rem]">
        {hasError && (
          <ValidationIndicator
            isInvalid={true}
            message="La contraseña es obligatoria"
            size="sm"
          />
        )}
        
        {hasWarning && (
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-yellow-400 text-sm">Contraseña débil</p>
              <ul className="text-xs text-glass-200 space-y-0.5">
                {passwordSecurity.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {hasSuccess && (
          <ValidationIndicator
            isValid={true}
            message="Contraseña segura"
            size="sm"
          />
        )}
      </div>

      {/* Password Strength Indicator */}
      {showStrengthIndicator && value && (
        <div className="space-y-2">
          {/* Strength Bar */}
          <div className="flex space-x-1">
            {[...Array(5)].map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                  index < passwordSecurity.score 
                    ? passwordSecurity.score <= 2 
                      ? 'bg-red-500' 
                      : passwordSecurity.score <= 3 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    : 'bg-glass-100'
                }`}
              />
            ))}
          </div>

          {/* Strength Label */}
          <div className="flex justify-between items-center">
            <span className="text-xs text-glass-200">
              Fortaleza: <span className="font-medium">
                {passwordSecurity.score <= 1 ? 'Muy débil' :
                 passwordSecurity.score <= 2 ? 'Débil' :
                 passwordSecurity.score <= 3 ? 'Regular' :
                 passwordSecurity.score <= 4 ? 'Buena' : 'Fuerte'}
              </span>
            </span>
            {passwordSecurity.isSecure && (
              <Shield className="w-3 h-3 text-green-400" />
            )}
          </div>
        </div>
      )}

      {/* Auto-cleanup Warning */}
      {autoCleanup && isFocused && (
        <div className="flex items-center space-x-2 text-xs text-glass-200">
          <Shield className="w-3 h-3" />
          <span>
            Este campo se limpiará automáticamente después de {Math.round(cleanupTimeout / 60000)} minutos de inactividad
          </span>
        </div>
      )}
    </div>
  );
};

export default SecurePasswordInput;