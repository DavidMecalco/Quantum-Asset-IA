import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ValidationIndicator, PasswordStrength } from './ValidationIndicator';
import { validateEmail, validatePassword, createDebouncedValidator } from '../../utils/validation';

export interface ValidatedInputProps {
  id: string;
  type: 'email' | 'password' | 'text';
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, error?: string) => void;
  disabled?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
  showValidation?: boolean;
  showPasswordStrength?: boolean;
  className?: string;
  autoComplete?: string;
}

/**
 * Input con validación en tiempo real integrada
 */
export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  id,
  type,
  label,
  placeholder,
  value,
  onChange,
  onValidationChange,
  disabled = false,
  required = false,
  icon,
  showValidation = true,
  showPasswordStrength = false,
  className = '',
  autoComplete,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    error?: string;
  }>({ isValid: true });
  const [isTouched, setIsTouched] = useState(false);

  // Validador con debounce
  const debouncedValidator = useCallback(
    createDebouncedValidator((val: string) => {
      setIsValidating(true);
      
      // Simular delay de validación para mejor UX
      setTimeout(() => {
        let result;
        
        if (type === 'email') {
          result = validateEmail(val);
        } else if (type === 'password') {
          result = validatePassword(val);
        } else {
          result = { isValid: val.length > 0 || !required };
        }

        setValidationState(result);
        setIsValidating(false);

        if (onValidationChange) {
          onValidationChange(result.isValid, result.error);
        }
      }, 300);
    }, 500),
    [type, required, onValidationChange]
  );

  // Validar cuando cambie el valor
  useEffect(() => {
    if (isTouched && value) {
      debouncedValidator(value);
    } else if (!value && required && isTouched) {
      const error = `${label} es obligatorio`;
      setValidationState({ isValid: false, error });
      if (onValidationChange) {
        onValidationChange(false, error);
      }
    } else if (!value) {
      setValidationState({ isValid: true });
      if (onValidationChange) {
        onValidationChange(true);
      }
    }
  }, [value, isTouched, debouncedValidator, required, label, onValidationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (!isTouched) {
      setIsTouched(true);
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;
  const hasError = isTouched && !validationState.isValid;
  const hasSuccess = isTouched && validationState.isValid && value.length > 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label htmlFor={id} className="block text-sm font-medium text-white">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-glass-200">
              {icon}
            </div>
          </div>
        )}

        {/* Input */}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`
            block w-full ${icon ? 'pl-10' : 'pl-3'} ${type === 'password' ? 'pr-12' : 'pr-3'} py-3
            bg-glass-50 border rounded-lg
            text-white placeholder-glass-200
            focus:outline-none focus:ring-2 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${hasError 
              ? 'border-red-500/50 focus:ring-red-500' 
              : hasSuccess
                ? 'border-green-500/50 focus:ring-green-500'
                : 'border-glass-100 hover:border-glass-200 focus:ring-quantum-blue'
            }
          `}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${id}-error` : 
            hasSuccess ? `${id}-success` : undefined
          }
        />

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={disabled}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-glass-200 hover:text-white transition-colors duration-200 disabled:opacity-50"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        )}

        {/* Validation Icon */}
        {showValidation && !isValidating && isTouched && value && type !== 'password' && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <ValidationIndicator
              isValid={validationState.isValid}
              isInvalid={!validationState.isValid}
              showIcon={true}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {showValidation && (
        <div className="min-h-[1.25rem]">
          {isValidating && (
            <ValidationIndicator
              isValidating={true}
              size="sm"
            />
          )}
          
          {!isValidating && hasError && (
            <ValidationIndicator
              isInvalid={true}
              message={validationState.error}
              size="sm"
            />
          )}
          
          {!isValidating && hasSuccess && type === 'email' && (
            <ValidationIndicator
              isValid={true}
              message="Email válido"
              size="sm"
            />
          )}
        </div>
      )}

      {/* Password Strength */}
      {type === 'password' && showPasswordStrength && value && (
        <PasswordStrength 
          password={value} 
          showDetails={isTouched}
        />
      )}
    </div>
  );
};

export default ValidatedInput;