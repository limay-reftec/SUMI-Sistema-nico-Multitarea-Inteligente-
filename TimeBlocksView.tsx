import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  CalendarClock, 
  BellRing, 
  PackageSearch, 
  UtensilsCrossed, 
  ShoppingCart, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2,
  Mic,
  MicOff,
  Mail,
  RefreshCw,
  LogOut,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { DayMenu, InventoryItem, Reminder, Task, TimeBlock, ShoppingItem } from '../types';
import { googleAuthManager, GmailMessageSummary, GoogleUserProfile } from '../utils/googleAuth';

interface ExecutiveConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCommand: string | null;
  tasks: Task[];
  reminders: Reminder[];
  inventory: InventoryItem[];
  menu: DayMenu[];
  timeBlocks: TimeBlock[];
  onNavigateTab: (tab: string) => void;
  onRefreshShoppingList: () => void;
  onAddReminder?: (reminder: Omit<Reminder, 'id' | 'status' | 'isAlertActive'>) => void;
  onAddShoppingItem?: (item: Omit<ShoppingItem, 'id' | 'isPurchased'>) => void;
  onAddTask?: (task: Omit<Task, 'id' | 'completed'>) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  commandTag?: string;
  gmailData?: GmailMessageSummary[];
  actionType?: 'reminder' | 'shopping' | 'task';
}

export const ExecutiveConsoleModal: React.FC<ExecutiveConsoleModalProps> = ({
  isOpen,
  onClose,
  currentCommand,
  tasks,
  reminders,
  inventory,
  menu,
  timeBlocks,
  onNavigateTab,
  onRefreshShoppingList,
  onAddReminder,
  onAddShoppingItem,
  onAddTask,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Gmail OAuth State
  const [isGoogleLinked, setIsGoogleLinked] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<GoogleUserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Voice Recording State (Web Speech API)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);
  const handleProcessVoiceTextRef = useRef<(text: string) => void>(() => {});

  // Play subtle feedback audio tone
  const playAudioCue = (type: 'start' | 'success' | 'stop') => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'start') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(587, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.07, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      }
    } catch {
      // Ignore if AudioContext is blocked or unsupported
    }
  };

  // Check auth and speech capabilities on mount
  useEffect(() => {
    setIsGoogleLinked(googleAuthManager.isAuthenticated());
    setGoogleUser(googleAuthManager.getUserProfile());

    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const rec = new SpeechRecognition();
          rec.continuous = false;
          rec.interimResults = true;
          rec.lang = 'es-ES';
          rec.maxAlternatives = 1;

          rec.onstart = () => {
            setIsListening(true);
            setInterimTranscript('');
            setVoiceFeedback('Escuchando instrucción por voz...');
          };

          rec.onresult = (event: any) => {
            let interim = '';
            let final = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const trans = event.results[i][0]?.transcript || '';
              if (event.results[i].isFinal) {
                final += trans;
              } else {
                interim += trans;
              }
            }

            if (interim) {
              setInterimTranscript(interim);
              setVoiceFeedback(`Escuchando: "${interim}"`);
            }

            if (final) {
              const cleanFinal = final.trim();
              if (cleanFinal) {
                setInterimTranscript('');
                setVoiceFeedback(`Procesando instrucción: "${cleanFinal}"...`);
                playAudioCue('success');
                handleProcessVoiceTextRef.current(cleanFinal);
              }
            }
          };

          rec.onerror = (event: any) => {
            console.warn('Speech recognition error:', event.error);
            setIsListening(false);
            setInterimTranscript('');
            playAudioCue('stop');
            if (event.error === 'not-allowed') {
              setVoiceFeedback('Permiso de micrófono denegado. Habilita el acceso en tu navegador.');
            } else if (event.error === 'no-speech') {
              setVoiceFeedback('No se detectó voz. Haz clic en el micrófono e intenta nuevamente.');
            } else if (event.error === 'network') {
              setVoiceFeedback('Error de conectividad de voz. Puedes escribir directamente.');
            } else if (event.error === 'audio-capture') {
              setVoiceFeedback('No se detectó micrófono conectado en el dispositivo.');
            } else {
              setVoiceFeedback(`Aviso de voz: ${event.error}`);
            }
            setTimeout(() => setVoiceFeedback(null), 4000);
          };

          rec.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = rec;
        } catch (e) {
          setSpeechSupported(false);
        }
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Keep ref up to date to prevent stale closures
  useEffect(() => {
    handleProcessVoiceTextRef.current = handleProcessVoiceText;
  });

  // Handle incoming command when opened from header
  useEffect(() => {
    if (isOpen && currentCommand) {
      executeCommand(currentCommand);
    }
  }, [isOpen, currentCommand]);

  // Initial welcome message if empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'msg-init',
          sender: 'assistant',
          text: `**Asistente Ejecutivo, Administrador del Hogar e IA Gemini activo.**

Directo al grano. Estoy preparado para estructurar tus tareas, consultar tus correos de Gmail, procesar instrucciones por voz para compras o recordatorios, y responder cualquier otra consulta general con inteligencia artificial.

**Comandos rápidos disponibles:**
* 📅 **"Planificar día"** — Cronograma de bloques y foco
* 🔔 **"Mis recordatorios"** — Compromisos y alertas prioritarias
* 📦 **"Estado de inventario"** — Auditoría de insumos y urgencias
* 🍽️ **"Menú semanal"** — 7 días estructurados
* 🛒 **"Generar lista de compras"** — Cruce de menú + faltantes
* 📧 **"Revisar Gmail"** — Sincronizar y auditar correos recientes`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, []);

  // Toggle Voice Input
  const toggleListening = () => {
    if (!speechSupported) {
      alert('Tu navegador no soporta la Web Speech API nativa en este entorno. Puedes escribir la instrucción directamente o usar los botones de dictado rápido.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
        playAudioCue('stop');
      } catch (e) {
        // ignore
      }
      setIsListening(false);
      setVoiceFeedback(null);
      setInterimTranscript('');
    } else {
      setInterimTranscript('');
      setVoiceFeedback('Iniciando micrófono... Habla con tu instrucción.');
      playAudioCue('start');
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Could not start recognition:', err);
        // Attempt clean restart
        try {
          recognitionRef.current?.stop();
        } catch {}
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            setIsListening(false);
            setVoiceFeedback('No se pudo iniciar el micrófono.');
            setTimeout(() => setVoiceFeedback(null), 3000);
          }
        }, 150);
      }
    }
  };

  // Google Login flow
  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      await googleAuthManager.login();
      setIsGoogleLinked(true);
      setGoogleUser(googleAuthManager.getUserProfile());

      // Notify in chat
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `✅ **Cuenta de Gmail vinculada exitosamente.**\n\nUsuario: **${googleAuthManager.getUserProfile()?.email || 'Conectado'}**.\nYa puedes pedirme: *"Revisar mis correos recientes"* o *"Buscar correos pendientes"* para integrar tareas a tu agenda.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Error al autorizar con Google');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogout = () => {
    googleAuthManager.logout();
    setIsGoogleLinked(false);
    setGoogleUser(null);
    setMessages((prev) => [
      ...prev,
      {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: `🔒 Se ha desvinculado la sesión de Gmail. Puedes volver a iniciar sesión cuando desees sincronizar tus correos.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Check Gmail Messages
  const handleCheckGmail = async () => {
    if (!googleAuthManager.isAuthenticated()) {
      handleGoogleLogin();
      return;
    }

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: 'Revisar Gmail y buscar compromisos pendientes',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const emailSummaries = await googleAuthManager.getRecentEmails(5);

      if (emailSummaries.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: 'assistant',
            text: `📧 **Bandeja de Entrada de Gmail:** No se encontraron correos recientes en la bandeja principal.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      // Format emails into structured executive report
      let emailReport = `### 📧 Auditoría de Correos Recientes (Gmail)\n\n`;
      emailReport += `Se analizaron los últimos **${emailSummaries.length} correos** de tu bandeja de entrada:\n\n`;
      emailReport += `| Remitente | Asunto | Extracto / Acción Potencial |\n| :--- | :--- | :--- |\n`;
      
      emailSummaries.forEach((m) => {
        const cleanFrom = m.from.replace(/<.*?>/, '').trim() || m.from;
        emailReport += `| **${cleanFrom}** | ${m.subject} | ${m.snippet.slice(0, 95)}... |\n`;
      });

      emailReport += `\n*Puedes pedirme por voz o texto: "Crea un recordatorio para responder al correo de..." o cualquier instrucción derivada.*`;

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: emailReport,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          gmailData: emailSummaries,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Error de sincronización con Gmail:** ${err.message || 'No se pudieron consultar los correos.'} Si expiró la sesión, vuelve a hacer clic en "Vincular Gmail".`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Process natural language or voice instruction to auto-add items or answer queries
  const handleProcessVoiceText = async (transcript: string) => {
    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: `🎤 "${transcript}"`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/process-voice-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          currentDate: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await response.json();
      let responseText = data.summary || 'Instrucción procesada correctamente.';
      let actionType: 'reminder' | 'shopping' | 'task' | undefined = undefined;

      if (data.intent === 'add_reminder' && data.payload) {
        actionType = 'reminder';
        if (onAddReminder) {
          onAddReminder({
            title: data.payload.title,
            executionDate: data.payload.executionDate,
            executionTime: data.payload.executionTime,
            priority: data.payload.priority || 'Media',
            contextTag: data.payload.contextTag || 'Voz',
            notes: `Creado por voz: "${transcript}"`,
          });
        }
        responseText = `✅ **Recordatorio Agendado:**
* **Compromiso:** ${data.payload.title}
* **Fecha y Hora:** ${data.payload.executionDate} a las ${data.payload.executionTime}
* **Prioridad:** ${data.payload.priority || 'Media'} (${data.payload.contextTag || 'General'})`;
      } else if (data.intent === 'add_shopping_item' && data.payload) {
        actionType = 'shopping';
        if (onAddShoppingItem) {
          onAddShoppingItem({
            name: data.payload.name,
            rubro: data.payload.rubro || 'Almacén',
            quantity: data.payload.quantity || '1 unidad',
            source: 'Manual',
            sourceDetail: `Añadido por voz: "${transcript}"`,
            urgency: data.payload.urgency || 'Normal',
          });
        }
        responseText = `🛒 **Añadido a la Lista de Compras:**
* **Producto:** ${data.payload.name}
* **Rubro de comercio:** ${data.payload.rubro || 'Almacén'}
* **Cantidad:** ${data.payload.quantity || '1 unidad'}
* **Urgencia:** ${data.payload.urgency || 'Normal'}`;
      } else if (data.intent === 'add_task' && data.payload) {
        actionType = 'task';
        if (onAddTask) {
          onAddTask({
            title: data.payload.title,
            priority: data.payload.priority || 'Media',
            dueDate: data.payload.dueDate || new Date().toISOString().split('T')[0],
            category: data.payload.category || 'Personal',
            notes: `Ingresado por voz`,
          });
        }
        responseText = `📋 **Nueva Tarea Registrada:**
* **Tarea:** ${data.payload.title}
* **Vencimiento:** ${data.payload.dueDate}
* **Prioridad:** ${data.payload.priority}`;
      } else if (data.intent === 'general_query' && data.payload?.answer) {
        responseText = data.payload.answer;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType,
        },
      ]);
    } catch (err: any) {
      console.warn('Voice processing fallback:', err);
      // Fallback
      let fallbackActionType: 'shopping' | undefined = undefined;
      if (onAddShoppingItem && (transcript.toLowerCase().includes('comprar') || transcript.toLowerCase().includes('lista'))) {
        fallbackActionType = 'shopping';
        onAddShoppingItem({
          name: transcript.replace(/(comprar|agregar|a la lista)/gi, '').trim() || transcript,
          rubro: 'Almacén',
          quantity: '1 u.',
          source: 'Manual',
        });
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `He procesado tu instrucción de voz: "${transcript}". Se ha integrado al registro del sistema.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionType: fallbackActionType,
        },
      ]);
    } finally {
      setIsLoading(false);
      setVoiceFeedback(null);
    }
  };

  const executeCommand = async (commandName: string) => {
    if (commandName === 'Revisar Gmail') {
      handleCheckGmail();
      return;
    }

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: commandName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      commandTag: commandName,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build focused context according to command
      const contextPayload: any = {};
      if (commandName === 'Planificar día') {
        contextPayload.timeBlocks = timeBlocks;
        contextPayload.pendingTasks = tasks.filter((t) => !t.completed);
      } else if (commandName === 'Mis recordatorios') {
        contextPayload.reminders = reminders;
      } else if (commandName === 'Estado de inventario') {
        contextPayload.inventory = inventory;
      } else if (commandName === 'Menú semanal') {
        contextPayload.weeklyMenu = menu;
      } else if (commandName === 'Generar lista de compras') {
        contextPayload.weeklyMenu = menu;
        contextPayload.lackingInventory = inventory.filter(
          (i) => i.stockStatus === 'Agotado' || i.stockStatus === 'Por agotar'
        );
      }

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: commandName,
          context: contextPayload,
        }),
      });

      const data = await response.json();
      let assistantText = data.text;

      if (!assistantText) {
        assistantText = generateRuleBasedResponse(commandName);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: assistantText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          commandTag: commandName,
        },
      ]);
    } catch (err) {
      console.warn('Network call error, using deterministic local assistant engine:', err);
      const fallbackText = generateRuleBasedResponse(commandName);
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: fallbackText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          commandTag: commandName,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const query = inputValue.trim();
    setInputValue('');

    // Check if user is asking to add item by text (e.g. "recordar llamar a Juan" or "comprar leche")
    const lower = query.toLowerCase();
    if (
      lower.startsWith('comprar ') ||
      lower.startsWith('recordar ') ||
      lower.startsWith('recuérdame ') ||
      lower.startsWith('agregar ') ||
      lower.startsWith('añadir ')
    ) {
      handleProcessVoiceText(query);
      return;
    }

    if (lower.includes('correo') || lower.includes('gmail') || lower.includes('email') || lower.includes('inbox')) {
      handleCheckGmail();
      return;
    }

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          context: {
            tasks: tasks.slice(0, 5),
            reminders: reminders.filter((r) => r.status === 'Pendiente'),
            inventoryShortage: inventory.filter((i) => i.stockStatus !== 'Suficiente'),
            googleUserEmail: googleUser?.email || null,
          },
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: data.text || 'Entendido. Procesado con éxito.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: `He tomado nota de tu consulta. Puedes utilizar los comandos rápidos, usar el micrófono para agregar recordatorios o listas, o sincronizar Gmail.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateRuleBasedResponse = (command: string): string => {
    switch (command) {
      case 'Planificar día':
        return `### Cronograma del Día por Bloques de Tiempo

| Bloque Horario | Tipo de Bloque | Actividad y Entregable Clave | Prioridad |
| :--- | :--- | :--- | :--- |
| **06:30 - 08:00** | Rutina | Movilidad, hidratación y desayuno equilibrado | Alta |
| **08:00 - 11:30** | Foco Profundo | Informe de métricas estratégicas Q3 (Sin interrupciones) | Alta |
| **11:30 - 13:00** | Operativo / Reuniones | Revisión de contratos y llamadas con proveedores | Media |
| **13:00 - 14:15** | Hogar & Almuerzo | Bowl de quinoa con pollo + pausa activa de 15 min | Media |
| **14:15 - 16:45** | Proyectos | Desglose de hitos Q4 y conciliación presupuestaria | Alta |
| **16:45 - 18:00** | Logística Hogar | Verificación de inventario crítico y compras del súper | Normal |

**Recomendación ejecutiva:** Proteger estrictamente el bloque matutino desactivando alertas secundarias.`;

      case 'Mis recordatorios':
        const pendingReminders = reminders.filter((r) => r.status === 'Pendiente');
        return `### Pendientes Críticos y Alertas Clave

| Compromiso / Pendiente | Fecha y Hora Propuesta | Prioridad | Estado de Alerta |
| :--- | :--- | :--- | :--- |
${pendingReminders
  .map(
    (r) =>
      `| ${r.title} | **${r.executionDate} ${r.executionTime}** | **${r.priority}** | ${
        r.isAlertActive ? '🔔 Activa' : '🔕 Inactiva'
      } |`
  )
  .join('\n')}

**Acción inmediata requerida:** La renovación de póliza y la medicación matutina están marcadas con prioridad **Alta** para ejecución hoy en el primer bloque.`;

      case 'Estado de inventario':
        const urgentItems = inventory.filter((i) => i.urgency === 'Urgente');
        const normalItems = inventory.filter((i) => i.urgency === 'Normal');
        const routineItems = inventory.filter((i) => i.urgency === 'Reposición rutinaria');

        return `### Auditoría de Insumos del Hogar

**Nivel de Urgencia: Urgente**
${urgentItems.map((i) => `* **${i.name}** — Stock: *${i.stockStatus}* (${i.quantity} ${i.unit} / Mínimo: ${i.minQuantity}). Rubro: ${i.category}`).join('\n')}

**Nivel de Urgencia: Normal**
${normalItems.map((i) => `* **${i.name}** — Stock: *${i.stockStatus}* (${i.quantity} ${i.unit} / Mínimo: ${i.minQuantity}). Rubro: ${i.category}`).join('\n')}

**Nivel de Urgencia: Reposición Rutinaria**
${routineItems.slice(0, 4).map((i) => `* **${i.name}** — Stock: *${i.stockStatus}* (${i.quantity} ${i.unit}). Rubro: ${i.category}`).join('\n')}

**Resumen:** Hay **${urgentItems.length} insumos con urgencia alta** que requieren compra inmediata.`;

      case 'Menú semanal':
        return `### Menú Semanal Equilibrado (7 Días)

| Día | Desayuno | Almuerzo | Merienda | Cena |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Lunes** | Tostadas con palta y huevo poché | Bowl de quinoa, pollo y espinaca | Yogur con nueces y fruta | Merluza con papas y brócoli |
| **Martes** | Porridge de avena y plátano | Wok de ternera con verduras y arroz | Tostada masa madre y queso | Tortilla de espinacas con ensalada |
| **Miércoles** | Omelette con champiñones | Guiso ligero de lentejas y calabaza | Batido proteico frutos rojos | Salmón al horno con espárragos |
| **Jueves** | Pancakes de avena y banana | Pasta integral con carne magra y tomate | Frutos secos y fruta fresca | Crema tibia de zapallo y zanahoria |
| **Viernes** | Tostadas con queso y tomate | Tarta de calabaza y puerros con verdes | Yogur griego y granola | Fajitas de pollo con guacamole |
| **Sábado** | Huevos revueltos y jugo natural | Bife de ternera magra con papas rústicas | Café frío y galletas de avena | Pizza casera fina de rúcula y jamón |
| **Domingo** | Tostadas francesas con frutas | Arroz con mariscos y verduras | Té con tostadas de semillas | Sopa de verduras y fideos de arroz |`;

      case 'Generar lista de compras':
        return `### Lista Definitiva de Compras (Cruce de Menú + Insumos Faltantes)

**Verdulería**
* Espinaca fresca, Tomates cherry, Brócoli, Papas, Paltas / Aguacates (Requerido para Menú)
* Morrones rojos, Zanahorias, Calabaza / Zapallo, Rúcula, Champiñones, Puerros, Espárragos

**Carnicería**
* Filet de merluza (400g) — *Menú Lunes*
* Pechuga de pollo (1kg) — *Menú Lunes / Miércoles / Viernes*
* Bife de lomo o ternera magra (800g) — *Menú Martes / Sábado*

**Almacén**
* Quinoa (500g), Avena tradicional (1 paquete), Arroz integral (1 paquete)
* Lentejas secas o en lata (2 latas), Harina integral / masa madre
* Aceite de oliva virgen extra (1L) — *Inventario Agotado*

**Refrigerados**
* Huevos de campo (1 docena) — *Inventario Agotado*
* Yogur natural o griego (4 potes), Queso fresco o cuartirolo (300g)
* Leche descremada (2L) — *Inventario Por Agotar*

**Limpieza**
* Detergente concentrado vajilla (1L) — *Inventario Agotado*
* Papel higiénico (pack 4 rollos) — *Inventario Por Agotar*
* Jabón líquido para ropa (1 botella) — *Inventario Por Agotar*`;

      default:
        return `Comando procesado correctamente.`;
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div
        className={`bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
          isExpanded
            ? 'w-full h-full max-w-6xl max-h-[96vh]'
            : 'w-full max-w-3xl h-[88vh] sm:h-[82vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold tracking-tight text-white truncate">
                  Consola Ejecutiva con Gemini IA
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Gemini Online
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Voz inteligente • Sincronización Gmail • Formato tabular y estructurado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Gmail Connection Indicator & Button */}
            {isGoogleLinked ? (
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-[11px] truncate max-w-[120px]" title={googleUser?.email}>
                  {googleUser?.email || 'Gmail Vinculado'}
                </span>
                <button
                  onClick={handleGoogleLogout}
                  className="p-1 hover:text-rose-400 transition-colors"
                  title="Desvincular Gmail"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isAuthLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors shadow-xs"
                title="Vincular con tu cuenta de Gmail"
              >
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Vincular Gmail</span>
              </button>
            )}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title={isExpanded ? 'Contraer' : 'Expandir'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Command Chips */}
        <div className="bg-slate-950/60 border-b border-slate-800 px-3 sm:px-4 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {/* Dedicated Voice Command Button */}
          <button
            onClick={toggleListening}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap shadow-xs ${
              isListening
                ? 'bg-rose-600 text-white border border-rose-400 animate-pulse'
                : 'bg-amber-400 text-slate-950 hover:bg-amber-300 border border-amber-300'
            }`}
            title="Activar micrófono para dictar con Web Speech API"
          >
            {isListening ? <MicOff className="w-3.5 h-3.5 animate-bounce" /> : <Mic className="w-3.5 h-3.5" />}
            <span>{isListening ? 'Escuchando...' : 'Dictar por voz'}</span>
          </button>

          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap mx-1">
            •
          </span>

          {[
            { label: 'Planificar día', icon: CalendarClock },
            { label: 'Mis recordatorios', icon: BellRing },
            { label: 'Estado de inventario', icon: PackageSearch },
            { label: 'Menú semanal', icon: UtensilsCrossed },
            { label: 'Generar lista de compras', icon: ShoppingCart },
            { label: 'Revisar Gmail', icon: Mail, highlight: true },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => executeCommand(item.label)}
                disabled={isLoading}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap ${
                  item.highlight
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>"{item.label}"</span>
              </button>
            );
          })}
        </div>

        {/* Voice Feedback Banner when active */}
        {voiceFeedback && (
          <div className="bg-amber-950/70 border-b border-amber-800 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="font-medium">{voiceFeedback}</span>
            </div>
            {isListening && (
              <button
                onClick={toggleListening}
                className="text-[11px] font-bold underline hover:text-white"
              >
                Detener
              </button>
            )}
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-slate-900/60">
          {/* Quick Voice Command Prompts */}
          <div className="flex items-center gap-1.5 flex-wrap p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-400 flex items-center gap-1 shrink-0">
              <Mic className="w-3 h-3 text-amber-400" />
              Prueba dictar o tocar:
            </span>
            <button
              type="button"
              onClick={() => handleProcessVoiceText('añadir recordatorio de pago mañana a las 10')}
              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition-colors"
            >
              "añadir recordatorio de pago mañana a las 10"
            </button>
            <button
              type="button"
              onClick={() => handleProcessVoiceText('comprar 2 kilos de manzanas y café')}
              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
            >
              "comprar 2 kilos de manzanas y café"
            </button>
            <button
              type="button"
              onClick={() => handleProcessVoiceText('añadir tarea preparar balance financiero')}
              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 transition-colors"
            >
              "añadir tarea preparar balance"
            </button>
          </div>

          {messages.map((msg) => {
            const isAsst = msg.sender === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 sm:gap-3 ${isAsst ? 'items-start' : 'items-start justify-end'}`}
              >
                {isAsst && (
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`relative rounded-xl p-3.5 sm:p-4 max-w-2xl text-xs sm:text-sm shadow-xs ${
                    isAsst
                      ? 'bg-slate-800/90 border border-slate-700 text-slate-100'
                      : 'bg-amber-400 text-slate-950 font-medium ml-10 sm:ml-12 shadow-md'
                  }`}
                >
                  {/* Assistant response header with copy */}
                  {isAsst && (
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/80 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300">
                        {msg.commandTag ? `Comando: "${msg.commandTag}"` : 'Respuesta Gemini Asistente'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="flex items-center gap-1 text-slate-400 hover:text-slate-100 transition-colors"
                          title="Copiar texto"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>{copiedId === msg.id ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Render content */}
                  <div className="prose-xs space-y-2 leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>

                  {/* Quick Action Buttons for structured flows */}
                  {isAsst && (msg.commandTag === 'Generar lista de compras' || msg.actionType === 'shopping') && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700 flex items-center gap-2">
                      <button
                        onClick={() => {
                          onRefreshShoppingList();
                          onNavigateTab('compras');
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Ver en Lista de Compras</span>
                      </button>
                    </div>
                  )}

                  {isAsst && (msg.commandTag === 'Planificar día' || msg.actionType === 'task') && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700 flex items-center gap-2">
                      <button
                        onClick={() => {
                          onNavigateTab('tiempo');
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Ver en Agenda y Tareas</span>
                      </button>
                    </div>
                  )}

                  {isAsst && msg.actionType === 'reminder' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700 flex items-center gap-2">
                      <button
                        onClick={() => {
                          onNavigateTab('recordatorios');
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Ver en Pestaña Recordatorios</span>
                      </button>
                    </div>
                  )}

                  <span
                    className={`block mt-2 text-[10px] text-right ${
                      isAsst ? 'text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 shadow-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Gemini procesando información ejecutiva...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Active Voice Waveform and Interim Transcription Bar */}
        {isListening && (
          <div className="bg-slate-900/95 border-t border-rose-500/40 p-3 flex items-center justify-between gap-3 text-xs shadow-inner animate-in fade-in duration-150">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="flex items-end gap-1 h-5 px-1 shrink-0">
                <span className="w-1 bg-rose-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                <span className="w-1 bg-rose-400 rounded-full animate-[bounce_0.8s_ease-in-out_infinite] h-5" />
                <span className="w-1 bg-rose-500 rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-2" />
                <span className="w-1 bg-rose-400 rounded-full animate-[bounce_0.7s_ease-in-out_infinite] h-4" />
                <span className="w-1 bg-rose-500 rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-3" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-rose-300 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Web Speech API activa • Di tu instrucción:
                </p>
                <p className="text-slate-200 italic truncate text-[11px] mt-0.5">
                  {interimTranscript ? `"${interimTranscript}"` : 'Ej: "Añadir recordatorio de pago mañana a las 10"...'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (interimTranscript.trim()) {
                    handleProcessVoiceText(interimTranscript.trim());
                  }
                  toggleListening();
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs active:scale-95"
              >
                Detener y procesar
              </button>
              <button
                type="button"
                onClick={toggleListening}
                className="px-2 py-1 text-slate-400 hover:text-white text-[11px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Input Bar with Voice (Microphone), Text, and Submit */}
        <form
          onSubmit={handleSendMessage}
          className="p-2.5 sm:p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          {/* Voice Input Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
              isListening
                ? 'bg-rose-600 text-white border-rose-500 animate-pulse ring-2 ring-rose-500/50'
                : 'bg-slate-800 text-amber-400 hover:bg-slate-700 border-slate-700'
            }`}
            title={isListening ? 'Detener grabación de voz' : 'Dictar por voz (recordatorios, listas de compras, consultas)'}
            aria-label="Entrada por voz"
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder='Escribe o di por voz: "Comprar 2kg manzanas", "Recordarme pagar seguro mañana 10am"...'
            className="flex-1 bg-slate-900 hover:bg-slate-900/80 focus:bg-slate-900 text-slate-100 placeholder:text-slate-500 text-xs sm:text-sm px-3.5 py-2 rounded-xl border border-slate-800 focus:border-amber-400 outline-none transition-all"
            disabled={isLoading || isListening}
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-slate-950 font-bold rounded-xl transition-colors shadow-xs active:scale-95"
            title="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
