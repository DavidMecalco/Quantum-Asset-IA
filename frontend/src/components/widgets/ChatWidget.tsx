import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BarChart3, FileText, Search, Wrench } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    entities?: any[];
    confidence?: number;
  };
}

interface ChatWidgetProps {
  id: string;
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onResize?: (size: 'small' | 'medium' | 'large') => void;
}

// Respuestas mock del asistente Watson X
const generateAssistantResponse = (userMessage: string): ChatMessage => {
  const message = userMessage.toLowerCase();
  let response = '';
  let intent = 'general';
  
  if (message.includes('reporte') || message.includes('report')) {
    intent = 'generate_report';
    response = `📊 Puedo generar varios tipos de reportes para ti:

• **Reportes de Activos**: Estado, ubicación y mantenimiento
• **Reportes de Órdenes de Trabajo**: Pendientes, completadas, por técnico
• **Reportes de Inventario**: Stock, movimientos, valorización
• **Reportes de KPIs**: Disponibilidad, MTTR, MTBF

¿Qué tipo de reporte necesitas? Puedo generarlo en PDF, Excel o mostrarlo como gráfica.`;
  } else if (message.includes('gráfica') || message.includes('grafico') || message.includes('chart')) {
    intent = 'generate_chart';
    response = `📈 Puedo crear gráficas interactivas:

• **Tendencias de Mantenimiento**: Por período, equipo o técnico
• **Análisis de Costos**: Preventivo vs Correctivo
• **Disponibilidad de Activos**: Por línea de producción
• **Indicadores de Rendimiento**: OEE, MTTR, MTBF

¿Sobre qué datos te gustaría ver una gráfica?`;
  } else if (message.includes('activo') || message.includes('asset') || message.includes('equipo')) {
    intent = 'asset_inquiry';
    response = `🔧 Te ayudo con información de activos:

**Activos Críticos Recientes:**
• Bomba Centrífuga P-001 - Estado: Operativo ✅
• Compresor C-205 - Mantenimiento programado 🔄
• Motor M-150 - Requiere inspección ⚠️

¿Necesitas información específica de algún activo? Puedo buscar por:
- Número de activo
- Ubicación
- Tipo de equipo
- Estado operacional`;
  } else if (message.includes('orden') || message.includes('work order') || message.includes('wo')) {
    intent = 'work_order_inquiry';
    response = `📋 Información de Órdenes de Trabajo:

**Órdenes Pendientes Hoy:**
• WO-2024-001: Mantenimiento Bomba P-001 (Alta prioridad)
• WO-2024-002: Inspección Eléctrica Sector A (Media)
• WO-2024-003: Cambio de filtros HVAC (Baja)

**Estadísticas:**
• 15 órdenes abiertas
• 8 en progreso
• 23 completadas esta semana

¿Necesitas detalles de alguna orden específica?`;
  } else if (message.includes('inventario') || message.includes('inventory') || message.includes('stock')) {
    intent = 'inventory_inquiry';
    response = `📦 Estado del Inventario:

**Alertas de Stock:**
• Filtros de aceite: 5 unidades (Mínimo: 10) ⚠️
• Rodamientos SKF: Stock OK ✅
• Válvulas 2": 2 unidades (Crítico) 🔴

**Movimientos Recientes:**
• Salida: 15 filtros para WO-2024-001
• Entrada: 50 tornillos M12 
• Transferencia: Repuestos a almacén B

¿Necesitas información de algún ítem específico?`;
  } else if (message.includes('kpi') || message.includes('indicador') || message.includes('métrica')) {
    intent = 'kpi_inquiry';
    response = `📊 Indicadores Clave de Rendimiento:

**Este Mes:**
• **Disponibilidad**: 94.2% (Meta: 95%) 🟡
• **MTTR**: 4.2 horas (Meta: 4h) 🟡
• **MTBF**: 168 horas (Meta: 150h) ✅
• **Cumplimiento PM**: 89% (Meta: 90%) 🟡

**Tendencias:**
• Disponibilidad: ↗️ +2.1% vs mes anterior
• Costos de mantenimiento: ↘️ -8.5%

¿Te gustaría ver algún KPI en detalle o generar un dashboard específico?`;
  } else if (message.includes('hola') || message.includes('hello') || message.includes('hi')) {
    response = `¡Hola! 👋 Soy tu asistente inteligente de Maximo integrado con Watson X.

Puedo ayudarte con:
🔧 **Consultas de activos y equipos**
📋 **Información de órdenes de trabajo**
📊 **Generación de reportes y gráficas**
📦 **Estado del inventario**
📈 **Análisis de KPIs y métricas**
🔍 **Búsquedas avanzadas en Maximo**

¿En qué puedo ayudarte hoy?`;
  } else if (message.includes('ayuda') || message.includes('help')) {
    response = `🤖 **Comandos que entiendo:**

**Consultas:**
• "¿Cuál es el estado del activo P-001?"
• "Muéstrame las órdenes pendientes"
• "¿Cómo está el inventario de filtros?"

**Reportes:**
• "Genera un reporte de mantenimiento"
• "Crea una gráfica de disponibilidad"
• "Exporta los KPIs del mes"

**Análisis:**
• "Analiza los costos de mantenimiento"
• "¿Cuáles son los activos críticos?"
• "Muestra las tendencias de este trimestre"

¡Prueba preguntarme algo específico!`;
  } else {
    response = `Entiendo tu consulta sobre "${userMessage}". 

Como asistente de Maximo con Watson X, puedo ayudarte con:
• Consultas específicas de activos y equipos
• Información de órdenes de trabajo
• Generación de reportes personalizados
• Análisis de datos y KPIs

¿Podrías ser más específico sobre qué información necesitas? Por ejemplo:
- "Estado del activo [número]"
- "Órdenes pendientes de [área]"
- "Reporte de [tipo] del [período]"`;
  }

  return {
    id: Date.now().toString(),
    type: 'assistant',
    content: response,
    timestamp: new Date(),
    metadata: {
      intent,
      confidence: 0.95
    }
  };
};

// Sugerencias rápidas
const QUICK_SUGGESTIONS = [
  { text: "Estado de activos críticos", icon: "🔧" },
  { text: "Órdenes pendientes hoy", icon: "📋" },
  { text: "Generar reporte semanal", icon: "📊" },
  { text: "KPIs del mes actual", icon: "📈" },
  { text: "Inventario bajo stock", icon: "📦" },
  { text: "Análisis de costos", icon: "💰" }
];

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  id,
  size = 'medium',
  isLoading = false,
  error = null,
  onRefresh,
  onResize
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: '¡Hola! 👋 Soy tu asistente inteligente de Maximo con Watson X. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al final de los mensajes
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enviar mensaje
  const handleSendMessage = async (message?: string) => {
    const messageToSend = message || inputMessage.trim();
    if (!messageToSend) return;

    // Agregar mensaje del usuario
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simular delay de respuesta del asistente
    setTimeout(() => {
      const assistantResponse = generateAssistantResponse(messageToSend);
      setMessages(prev => [...prev, assistantResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // 1-2 segundos
  };

  // Manejar envío con Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Usar sugerencia rápida
  const handleQuickSuggestion = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <div className="h-full flex flex-col bg-white/5 rounded-lg">
      {/* Header del Chat */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-medium">Watson X Assistant</h3>
            <p className="text-white/60 text-xs">Asistente Inteligente de Maximo</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-white/60 text-xs">En línea</span>
        </div>
      </div>

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-2 max-w-[80%] ${
              message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}>
              {/* Avatar */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.type === 'user' 
                  ? 'bg-blue-600' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}>
                {message.type === 'user' ? (
                  <User className="w-3 h-3 text-white" />
                ) : (
                  <Bot className="w-3 h-3 text-white" />
                )}
              </div>

              {/* Mensaje */}
              <div className={`rounded-2xl px-4 py-2 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-white border border-white/20'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-white/50'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Indicador de escritura */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sugerencias rápidas */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-white/60 text-xs mb-2">Sugerencias rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_SUGGESTIONS.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleQuickSuggestion(suggestion.text)}
                className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 text-white/80 rounded-full transition-colors duration-200 border border-white/20"
              >
                {suggestion.icon} {suggestion.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input de mensaje */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pregúntame sobre activos, órdenes, reportes..."
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isTyping}
            />
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isTyping}
            className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;