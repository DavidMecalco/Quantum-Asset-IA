import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { FeedbackMessage } from '../ui/FeedbackMessage';

/**
 * Página de registro (placeholder)
 * En este caso, el registro se maneja por administradores
 */
export const RegisterPage: React.FC = () => {
  return (
    <AuthLayout
      title="Crear Cuenta"
      subtitle="Contacta al administrador para obtener acceso"
    >
      <div className="space-y-6">
        <FeedbackMessage
          type="info"
          title="Registro por Invitación"
          message="Las cuentas de Quantum Asset IA son creadas únicamente por administradores del sistema."
          isVisible={true}
          autoClose={false}
        />

        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6 text-center space-y-4">
          <Users className="w-12 h-12 text-quantum-blue mx-auto" />
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">
              ¿Necesitas una cuenta?
            </h3>
            <p className="text-glass-200 text-sm">
              Para obtener acceso a Quantum Asset IA, contacta a tu administrador de sistemas o al departamento de TI.
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-glass-200 text-sm space-y-1">
              <p><strong>Información requerida:</strong></p>
              <ul className="list-disc list-inside text-left space-y-1 ml-4">
                <li>Nombre completo</li>
                <li>Email corporativo</li>
                <li>Departamento o área</li>
                <li>Justificación de acceso</li>
              </ul>
            </div>

            <div className="pt-4 border-t border-glass-100">
              <p className="text-glass-200 text-xs">
                <strong>Contacto de soporte:</strong><br />
                soporte@quantumasset.com<br />
                Ext. 1234
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-4 py-2 bg-quantum-blue/20 hover:bg-quantum-blue/30 text-white rounded-lg transition-colors duration-200 border border-quantum-blue/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Login
          </Link>

          <div className="text-center">
            <p className="text-glass-200 text-sm">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="text-quantum-purple hover:text-quantum-purple/80 transition-colors duration-200 hover:underline font-medium"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;