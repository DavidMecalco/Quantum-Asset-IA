import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

export interface ValidationIndicatorProps {
  isValid?: boolean;
  isInvalid?: boolean;
  isValidating?: boolean;
  message?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Componente para mostrar indicadores visuales de validación
 */
export const ValidationIndicator: React.FC<ValidationIndicatorProps> = ({
  isValid = false,
  isInvalid = false,
  isValidating = false,
  message,
  showIcon = true,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  if (isValidating) {
    return (
      <div className={`flex items-center space-x-1 text-blue-400 ${sizeClasses[size]}`}>
        {showIcon && (
          <div className="animate-spin">
            <AlertCircle size={iconSizes[size]} />
          </div>
        )}
        <span>Validando...</span>
      </div>
    );
  }

  if (isValid) {
    return (
      <div className={`flex items-center space-x-1 text-green-400 ${sizeClasses[size]}`}>
        {showIcon && <Check size={iconSizes[size]} />}
        {message && <span>{message}</span>}
      </div>
    );
  }

  if (isInvalid && message) {
    return (
      <div className={`flex items-center space-x-1 text-red-400 ${sizeClasses[size]}`}>
        {showIcon && <X size={iconSizes[size]} />}
        <span>{message}</span>
      </div>
    );
  }

  return null;
};

/**
 * Componente para mostrar fortaleza de contraseña
 */
export interface PasswordStrengthProps {
  password: string;
  showDetails?: boolean;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({
  password,
  showDetails = false,
}) => {
  const getStrength = (pwd: string) => {
    let score = 0;
    const feedback: string[] = [];

    if (pwd.length >= 8) score++;
    else feedback.push('Al menos 8 caracteres');

    if (/[a-z]/.test(pwd)) score++;
    else feedback.push('Letras minúsculas');

    if (/[A-Z]/.test(pwd)) score++;
    else feedback.push('Letras mayúsculas');

    if (/\d/.test(pwd)) score++;
    else feedback.push('Números');

    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;
    else feedback.push('Símbolos especiales');

    return { score, feedback };
  };

  const { score, feedback } = getStrength(password);

  const strengthLabels = ['Muy débil', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const strengthColors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Barra de fortaleza */}
      <div className="flex space-x-1">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
              index < score ? strengthColors[score - 1] : 'bg-glass-100'
            }`}
          />
        ))}
      </div>

      {/* Etiqueta de fortaleza */}
      <div className="flex justify-between items-center">
        <span className="text-xs text-glass-200">
          Fortaleza: <span className="font-medium">{strengthLabels[score - 1] || 'Muy débil'}</span>
        </span>
        {score >= 4 && (
          <Check className="w-3 h-3 text-green-400" />
        )}
      </div>

      {/* Detalles de requisitos */}
      {showDetails && feedback.length > 0 && (
        <div className="text-xs text-glass-200 space-y-1">
          <p>Falta:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            {feedback.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ValidationIndicator;