import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { ValidatedInput } from '../ui/ValidatedInput';
import { ButtonLoading } from '../ui/LoadingSpinner';
import { FeedbackMessage } from '../ui/FeedbackMessage';
import { authService } from '../../services/authService';

/**
 * Página de recuperación de contraseña
 */
export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmailValid, setIsEmailValid] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isEmailValid || !email) {
      setError('Por favor ingresa un email válido');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.forgotPassword(email);
      setIsSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Error al enviar el email de recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout
        title="Email Enviado"
        subtitle="Revisa tu bandeja de entrada"
      >
        <div className="text-center space-y-4">
          <FeedbackMessage
            type="success"
            title="¡Email enviado exitosamente!"
            message={`Hemos enviado las instrucciones de recuperación a ${email}`}
            isVisible={true}
            autoClose={false}
          />
          
          <div className="space-y-3">
            <p className="text-glass-200 text-sm">
              Si no recibes el email en unos minutos, revisa tu carpeta de spam.
            </p>
            
            <div className="flex flex-col space-y-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 bg-quantum-blue/20 hover:bg-quantum-blue/30 text-white rounded-lg transition-colors duration-200 border border-quantum-blue/30"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al Login
              </Link>
              
              <button
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                }}
                className="text-quantum-purple hover:text-quantum-purple/80 text-sm transition-colors duration-200"
              >
                Enviar a otro email
              </button>
            </div>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar Contraseña"
      subtitle="Ingresa tu email para recibir instrucciones"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <FeedbackMessage
            type="error"
            message={error}
            isVisible={true}
            onClose={() => setError(null)}
            autoClose={true}
            autoCloseDelay={5000}
          />
        )}

        <ValidatedInput
          id="forgot-email"
          type="email"
          label="Correo Electrónico"
          placeholder="tu@email.com"
          value={email}
          onChange={setEmail}
          onValidationChange={(isValid) => setIsEmailValid(isValid)}
          disabled={isLoading}
          required={true}
          icon={<Mail className="h-5 w-5" />}
          showValidation={true}
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={isLoading || !isEmailValid || !email}
          className="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-quantum-blue to-quantum-purple hover:from-quantum-blue/90 hover:to-quantum-purple/90 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-quantum-blue focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <ButtonLoading
            isLoading={isLoading}
            text="Enviar Instrucciones"
            loadingText="Enviando..."
            size="md"
          />
        </button>

        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center text-quantum-blue hover:text-quantum-blue/80 text-sm transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Volver al Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;