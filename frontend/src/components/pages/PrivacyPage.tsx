import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, Database } from 'lucide-react';
import { AuthLayout } from '../auth/AuthLayout';

/**
 * Página de política de privacidad
 */
export const PrivacyPage: React.FC = () => {
  return (
    <AuthLayout
      title="Política de Privacidad"
      subtitle="Quantum Asset IA - Protección de Datos"
      showLogo={false}
    >
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {/* Introducción */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-6 h-6 text-quantum-blue" />
            <h3 className="text-lg font-medium text-white">
              Compromiso con la Privacidad
            </h3>
          </div>
          
          <p className="text-glass-200 text-sm leading-relaxed">
            En Quantum Asset IA, nos comprometemos a proteger la privacidad y seguridad 
            de la información personal de nuestros usuarios. Esta política describe cómo 
            recopilamos, usamos y protegemos sus datos.
          </p>
        </div>

        {/* Información que recopilamos */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-6 h-6 text-quantum-purple" />
            <h3 className="text-lg font-medium text-white">
              Información que Recopilamos
            </h3>
          </div>
          
          <div className="space-y-3 text-glass-200 text-sm">
            <div>
              <h4 className="text-white font-medium mb-1">Información de Cuenta:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Nombre completo y email corporativo</li>
                <li>Rol y departamento dentro de la organización</li>
                <li>Preferencias de usuario y configuraciones</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-1">Información de Uso:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Registros de acceso y actividad en el sistema</li>
                <li>Direcciones IP y información del navegador</li>
                <li>Patrones de uso y interacciones con la plataforma</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cómo usamos la información */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Eye className="w-6 h-6 text-quantum-indigo" />
            <h3 className="text-lg font-medium text-white">
              Uso de la Información
            </h3>
          </div>
          
          <div className="space-y-2 text-glass-200 text-sm">
            <p><strong>Operación del Servicio:</strong> Para proporcionar acceso seguro y funcionalidad completa del sistema.</p>
            <p><strong>Seguridad:</strong> Para detectar y prevenir accesos no autorizados y actividades sospechosas.</p>
            <p><strong>Mejoras:</strong> Para analizar el uso y mejorar la experiencia del usuario.</p>
            <p><strong>Comunicación:</strong> Para enviar notificaciones importantes del sistema y soporte técnico.</p>
          </div>
        </div>

        {/* Protección de datos */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Lock className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-medium text-white">
              Protección de Datos
            </h3>
          </div>
          
          <div className="space-y-3 text-glass-200 text-sm">
            <div>
              <h4 className="text-white font-medium mb-1">Medidas de Seguridad:</h4>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Encriptación de datos en tránsito y en reposo</li>
                <li>Autenticación multifactor y controles de acceso</li>
                <li>Monitoreo continuo de seguridad</li>
                <li>Auditorías regulares de seguridad</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-1">Acceso a Datos:</h4>
              <p>Solo el personal autorizado tiene acceso a los datos personales, 
              y únicamente cuando es necesario para proporcionar soporte o mantener el servicio.</p>
            </div>
          </div>
        </div>

        {/* Derechos del usuario */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Sus Derechos
          </h3>
          
          <div className="space-y-2 text-glass-200 text-sm">
            <p><strong>Acceso:</strong> Puede solicitar una copia de sus datos personales.</p>
            <p><strong>Corrección:</strong> Puede solicitar la corrección de datos inexactos.</p>
            <p><strong>Eliminación:</strong> Puede solicitar la eliminación de sus datos (sujeto a requisitos legales).</p>
            <p><strong>Portabilidad:</strong> Puede solicitar sus datos en un formato estructurado.</p>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Contacto sobre Privacidad
          </h3>
          
          <div className="text-glass-200 text-sm space-y-2">
            <p>Para preguntas sobre esta política o sus datos personales:</p>
            <p><strong>Email:</strong> privacidad@quantumasset.com</p>
            <p><strong>Teléfono:</strong> +1 (555) 123-4567 Ext. 5678</p>
            <p><strong>Última actualización:</strong> Enero 2024</p>
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

export default PrivacyPage;