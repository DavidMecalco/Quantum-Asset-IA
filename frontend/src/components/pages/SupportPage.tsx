import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MessageCircle, FileText } from 'lucide-react';
import { AuthLayout } from '../auth/AuthLayout';

/**
 * Página de soporte técnico
 */
export const SupportPage: React.FC = () => {
  return (
    <AuthLayout
      title="Soporte Técnico"
      subtitle="Estamos aquí para ayudarte"
    >
      <div className="space-y-6">
        {/* Información de contacto */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6 space-y-4">
          <h3 className="text-lg font-medium text-white mb-4">
            Canales de Soporte
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-quantum-blue flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-medium">Email</h4>
                <p className="text-glass-200 text-sm">soporte@quantumasset.com</p>
                <p className="text-glass-200 text-xs">Respuesta en 24 horas</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-quantum-purple flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-medium">Teléfono</h4>
                <p className="text-glass-200 text-sm">+1 (555) 123-4567 Ext. 1234</p>
                <p className="text-glass-200 text-xs">Lunes a Viernes, 9:00 AM - 6:00 PM</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MessageCircle className="w-5 h-5 text-quantum-indigo flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-medium">Chat en Vivo</h4>
                <p className="text-glass-200 text-sm">Disponible en horario laboral</p>
                <button className="text-quantum-indigo hover:text-quantum-indigo/80 text-xs transition-colors duration-200 underline">
                  Iniciar Chat
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Preguntas frecuentes */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Preguntas Frecuentes
          </h3>
          
          <div className="space-y-4">
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-white hover:text-quantum-blue transition-colors duration-200">
                <span className="font-medium">¿Cómo recupero mi contraseña?</span>
                <span className="group-open:rotate-180 transition-transform duration-200">▼</span>
              </summary>
              <div className="mt-2 text-glass-200 text-sm">
                Usa el enlace "¿Olvidaste tu contraseña?" en la página de login. 
                Recibirás un email con instrucciones para crear una nueva contraseña.
              </div>
            </details>
            
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-white hover:text-quantum-blue transition-colors duration-200">
                <span className="font-medium">¿Cómo solicito una nueva cuenta?</span>
                <span className="group-open:rotate-180 transition-transform duration-200">▼</span>
              </summary>
              <div className="mt-2 text-glass-200 text-sm">
                Las cuentas son creadas únicamente por administradores. 
                Contacta a tu departamento de TI con tu información completa y justificación de acceso.
              </div>
            </details>
            
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-white hover:text-quantum-blue transition-colors duration-200">
                <span className="font-medium">¿Qué navegadores son compatibles?</span>
                <span className="group-open:rotate-180 transition-transform duration-200">▼</span>
              </summary>
              <div className="mt-2 text-glass-200 text-sm">
                Recomendamos Chrome, Firefox, Safari o Edge en sus versiones más recientes. 
                Internet Explorer no es compatible.
              </div>
            </details>
            
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-white hover:text-quantum-blue transition-colors duration-200">
                <span className="font-medium">¿Dónde encuentro la documentación?</span>
                <span className="group-open:rotate-180 transition-transform duration-200">▼</span>
              </summary>
              <div className="mt-2 text-glass-200 text-sm">
                La documentación completa está disponible en el portal interno una vez que inicies sesión. 
                También puedes solicitarla al equipo de soporte.
              </div>
            </details>
          </div>
        </div>

        {/* Recursos adicionales */}
        <div className="bg-glass-50 backdrop-blur-md rounded-lg border border-glass-100 p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Recursos Adicionales
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="#"
              className="flex items-center space-x-3 p-3 bg-glass-50 hover:bg-glass-100 rounded-lg border border-glass-100 transition-colors duration-200"
            >
              <FileText className="w-5 h-5 text-quantum-blue" />
              <div>
                <h4 className="text-white font-medium text-sm">Manual de Usuario</h4>
                <p className="text-glass-200 text-xs">Guía completa del sistema</p>
              </div>
            </a>
            
            <a
              href="#"
              className="flex items-center space-x-3 p-3 bg-glass-50 hover:bg-glass-100 rounded-lg border border-glass-100 transition-colors duration-200"
            >
              <MessageCircle className="w-5 h-5 text-quantum-purple" />
              <div>
                <h4 className="text-white font-medium text-sm">Foro de Usuarios</h4>
                <p className="text-glass-200 text-xs">Comunidad y discusiones</p>
              </div>
            </a>
          </div>
        </div>

        {/* Botón de regreso */}
        <div className="text-center">
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

export default SupportPage;