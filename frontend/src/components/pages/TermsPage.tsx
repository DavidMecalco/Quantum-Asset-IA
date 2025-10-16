import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, AlertTriangle, Users, Gavel } from 'lucide-react';
import { AuthLayout } from '../auth/AuthLayout';

/**
 * Página de términos y condiciones
 */
export const TermsPage: React.FC = () => {
  return (
    <AuthLayout
      title="Términos y Condiciones"
      subtitle="Quantum Asset IA - Condiciones de Uso"
      showLogo={false}
    >
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {/* Introducción */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-6 h-6 text-quantum-blue" />
            <h3 className="text-lg font-medium text-white">
              Acuerdo de Uso
            </h3>
          </div>
          
          <p className="text-glass-200 text-sm leading-relaxed">
            Al acceder y usar Quantum Asset IA, usted acepta cumplir con estos términos y condiciones. 
            Este sistema está destinado exclusivamente para uso corporativo autorizado.
          </p>
        </div>

        {/* Uso autorizado */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="w-6 h-6 text-quantum-purple" />
            <h3 className="text-lg font-medium text-white">
              Uso Autorizado
            </h3>
          </div>
          
          <div className="space-y-3 text-glass-200 text-sm">
            <div>
              <h4 className="text-white font-medium mb-1">Usuarios Autorizados:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Empleados activos de la organización</li>
                <li>Contratistas con autorización específica</li>
                <li>Personal de soporte técnico autorizado</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-1">Propósito del Sistema:</h4>
              <p>Este sistema está diseñado para la gestión de activos empresariales 
              y la integración con IBM Maximo Application Suite.</p>
            </div>
          </div>
        </div>

        {/* Responsabilidades del usuario */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400" />
            <h3 className="text-lg font-medium text-white">
              Responsabilidades del Usuario
            </h3>
          </div>
          
          <div className="space-y-2 text-glass-200 text-sm">
            <p><strong>Seguridad de Credenciales:</strong> Mantener la confidencialidad de sus credenciales de acceso.</p>
            <p><strong>Uso Apropiado:</strong> Usar el sistema únicamente para propósitos comerciales legítimos.</p>
            <p><strong>Cumplimiento:</strong> Seguir todas las políticas corporativas y regulaciones aplicables.</p>
            <p><strong>Reporte de Incidentes:</strong> Informar inmediatamente cualquier actividad sospechosa o violación de seguridad.</p>
          </div>
        </div>

        {/* Prohibiciones */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Gavel className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-medium text-white">
              Actividades Prohibidas
            </h3>
          </div>
          
          <div className="space-y-2 text-glass-200 text-sm">
            <p><strong>Acceso No Autorizado:</strong> Intentar acceder a áreas o datos para los cuales no tiene autorización.</p>
            <p><strong>Compartir Credenciales:</strong> Compartir sus credenciales de acceso con terceros.</p>
            <p><strong>Uso Malicioso:</strong> Usar el sistema para actividades ilegales o dañinas.</p>
            <p><strong>Ingeniería Inversa:</strong> Intentar descompilar, modificar o realizar ingeniería inversa del sistema.</p>
            <p><strong>Sobrecarga del Sistema:</strong> Realizar acciones que puedan sobrecargar o interrumpir el servicio.</p>
          </div>
        </div>

        {/* Propiedad intelectual */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Propiedad Intelectual
          </h3>
          
          <div className="space-y-2 text-glass-200 text-sm">
            <p>Todos los derechos de propiedad intelectual del sistema Quantum Asset IA, 
            incluyendo software, documentación y contenido, pertenecen a la organización.</p>
            <p>Los usuarios no adquieren ningún derecho de propiedad sobre el sistema o su contenido.</p>
          </div>
        </div>

        {/* Limitación de responsabilidad */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Limitación de Responsabilidad
          </h3>
          
          <div className="space-y-2 text-glass-200 text-sm">
            <p>El sistema se proporciona "tal como está" sin garantías expresas o implícitas.</p>
            <p>La organización no será responsable por daños indirectos, incidentales o consecuentes 
            que puedan surgir del uso del sistema.</p>
            <p>Los usuarios son responsables de mantener copias de seguridad de sus datos importantes.</p>
          </div>
        </div>

        {/* Modificaciones */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Modificaciones de los Términos
          </h3>
          
          <div className="space-y-2 text-glass-200 text-sm">
            <p>Nos reservamos el derecho de modificar estos términos en cualquier momento.</p>
            <p>Los usuarios serán notificados de cambios significativos a través del sistema.</p>
            <p>El uso continuado del sistema después de las modificaciones constituye aceptación de los nuevos términos.</p>
            <p><strong>Última actualización:</strong> Enero 2024</p>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Contacto Legal
          </h3>
          
          <div className="text-glass-200 text-sm space-y-2">
            <p>Para preguntas sobre estos términos:</p>
            <p><strong>Email:</strong> legal@quantumasset.com</p>
            <p><strong>Teléfono:</strong> +1 (555) 123-4567 Ext. 9999</p>
          </div>
        </div>

        {/* Botón de regreso */}
        <div className="text-center pt-4">
          <Link
            to="/login"
            className="inline-flex items-center px-4 py-2 bg-quantum-blue/20 hover:bg-quantum-blue/30 text-white rounded-lg transition-colors duration-200 border border-quantum-blue/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default TermsPage;