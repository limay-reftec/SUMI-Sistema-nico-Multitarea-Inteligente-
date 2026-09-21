import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellRing, 
  BellOff, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Sparkles, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Smartphone, 
  Monitor, 
  Flame, 
  Volume2, 
  VolumeX, 
  Check, 
  ArrowRight,
  Send,
  Loader2,
  Tag,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { PriorityLevel, Reminder } from '../types';
import { playAlertSound } from '../utils/audioAlert';

interface SmartRemindersViewProps {
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  onTriggerCommand: (cmd: string) => void;
}

export const SmartRemindersView: React.FC<SmartRemindersViewProps> = ({
  reminders,
  setReminders,
  onTriggerCommand,
}) => {
  // Mobile Android view mode toggle (defaults to true if on mobile screen, but user can toggle)
  const [isMobileMode, setIsMobileMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  // Filters
  const [filter, setFilter] = useState<'todos' | 'alta' | 'hoy' | 'pendientes'>('todos');

  // Form states
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-09-21');
  const [time, setTime] = useState('09:00');
  const [priority, setPriority] = useState<PriorityLevel>('Alta');
  const [contextTag, setContextTag] = useState('Compromiso Clave');
  const [notes, setNotes] = useState('');

  // AI assistant parser states
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Auto-detect window resize for initial preference
  useEffect(() => {
    const handleResize = () => {
      // only adjust if user hasn't explicitly set preference recently
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showToast = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // Actions
  const toggleReminderStatus = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newStatus = r.status === 'Pendiente' ? 'Completado' : 'Pendiente';
          if (newStatus === 'Completado') {
            playAlertSound('complete');
            showToast('✓ Recordatorio completado');
          }
          return { ...r, status: newStatus };
        }
        return r;
      })
    );
  };

  const toggleAlert = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextState = !r.isAlertActive;
          if (nextState) {
            playAlertSound('standard');
            showToast('🔔 Alerta activada');
          } else {
            showToast('🔕 Alerta silenciada');
          }
          return { ...r, isAlertActive: nextState };
        }
        return r;
      })
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    showToast('Recordatorio eliminado');
  };

  // Quick Snooze / Postpone Actions (+15 min, +1 hora, +1 día)
  const snoozeReminder = (id: string, minutes: number) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const [h, m] = r.executionTime.split(':').map(Number);
          const dateObj = new Date(`2026-09-21T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);
          dateObj.setMinutes(dateObj.getMinutes() + minutes);

          const newH = String(dateObj.getHours()).padStart(2, '0');
          const newM = String(dateObj.getMinutes()).padStart(2, '0');
          const newTime = `${newH}:${newM}`;

          playAlertSound('standard');
          showToast(`⏱️ Pospuesto ${minutes >= 60 ? `${minutes / 60} hora(s)` : `${minutes} min`} (${newTime} hs)`);

          return {
            ...r,
            executionTime: newTime,
            status: 'Pendiente',
          };
        }
        return r;
      })
    );
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newReminder: Reminder = {
      id: `rem-${Date.now()}`,
      title: title.trim(),
      executionDate: date,
      executionTime: time,
      priority,
      isAlertActive: true,
      status: 'Pendiente',
      contextTag: contextTag || 'Compromiso Clave',
      notes: notes.trim() || undefined,
    };

    setReminders((prev) => [newReminder, ...prev]);
    if (priority === 'Alta') {
      playAlertSound('urgent');
    } else {
      playAlertSound('standard');
    }

    setTitle('');
    setNotes('');
    setIsAdding(false);
    showToast(`✓ Recordatorio (${priority}) programado con éxito`);
  };

  // Quick Presets for Mobile 1-Tap Scheduling
  const applyPresetTime = (presetDate: string, presetTime: string, presetPriority: PriorityLevel = 'Alta') => {
    setDate(presetDate);
    setTime(presetTime);
    setPriority(presetPriority);
  };

  // Natural Language AI Parser
  const handleParseWithAi = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/parse-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: aiPrompt,
          currentDate: '2026-09-21',
        }),
      });

      const data = await res.json();
      if (data && data.title) {
        setTitle(data.title);
        setDate(data.executionDate || '2026-09-21');
        setTime(data.executionTime || '09:00');
        setPriority((data.priority as PriorityLevel) || 'Alta');
        if (data.contextTag) setContextTag(data.contextTag);

        setIsAdding(true);
        setShowAiInput(false);
        setAiPrompt('');
        showToast('✨ Recordatorio interpretado por el Asistente');
      }
    } catch {
      showToast('No se pudo interpretar automáticamente. Ingresa los datos manualmente.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Proactive Assistant suggestions
  const handleSuggestReminders = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/suggest-reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            currentDate: '2026-09-21',
            existingCount: reminders.length,
          },
        }),
      });

      const data = await res.json();
      if (data && data.suggestions && data.suggestions.length > 0) {
        const newOnes: Reminder[] = data.suggestions.map((s: any, idx: number) => ({
          id: `rem-sug-${Date.now()}-${idx}`,
          title: s.title,
          executionDate: s.executionDate || '2026-09-21',
          executionTime: s.executionTime || '10:00',
          priority: s.priority || 'Alta',
          isAlertActive: true,
          status: 'Pendiente',
          contextTag: s.contextTag || 'Sugerencia Ejecutiva',
        }));

        setReminders((prev) => [...newOnes, ...prev]);
        playAlertSound('urgent');
        showToast(`✨ Se añadieron ${newOnes.length} recordatorios inteligentes`);
      }
    } catch {
      showToast('Error al obtener sugerencias del Asistente');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filtered Reminders
  const filteredReminders = reminders.filter((r) => {
    if (filter === 'alta') return r.priority === 'Alta' && r.status === 'Pendiente';
    if (filter === 'hoy') return r.executionDate === '2026-09-21';
    if (filter === 'pendientes') return r.status === 'Pendiente';
    return true;
  });

  // Separate High Priority Reminders that are Pending for Immediate Attention Section
  const urgentHighPriorityReminders = reminders.filter(
    (r) => r.priority === 'Alta' && r.status === 'Pendiente'
  );

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Toast Notification */}
      {feedbackMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Mode Switcher & Executive Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold">
                <BellRing className="w-4 h-4 animate-bounce" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Sistema de Recordatorios Inteligentes
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configuración ejecutiva de compromisos, fechas/horas propuestas y alertas de alta prioridad.
            </p>
          </div>

          {/* Device View Toggle (Mobile Android vs Web) & Assistant Suggestion */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Web vs Celular Android */}
            <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-100 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIsMobileMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  !isMobileMode
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vista</span> Web
              </button>

              <button
                type="button"
                onClick={() => setIsMobileMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  isMobileMode
                    ? 'bg-slate-900 text-white shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Celular (Android)</span>
              </button>
            </div>

            {/* AI Suggest Button */}
            <button
              onClick={handleSuggestReminders}
              disabled={isAiLoading}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isAiLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              )}
              <span className="hidden sm:inline">Sugerencias IA</span>
              <span className="sm:hidden">Sugerir</span>
            </button>

            {/* Test Audio Alert */}
            <button
              type="button"
              onClick={() => playAlertSound('urgent')}
              title="Probar sonido de alarma alta prioridad"
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs transition-colors"
            >
              <Volume2 className="w-4 h-4 text-rose-600" />
            </button>
          </div>
        </div>

        {/* Quick Natural Language Assistant Creator Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          {!showAiInput ? (
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>¿Quieres dictar o escribir en lenguaje natural?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAiInput(true)}
                  className="text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Crear con Asistente (ej. "Reunión mañana a las 10 am urgente")</span>
                </button>
                <button
                  onClick={() => setIsAdding(!isAdding)}
                  className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Recordatorio</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Asistente Ejecutivo: Ingresa la tarea con fecha, hora y prioridad</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowAiInput(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs"
                >
                  Cerrar
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleParseWithAi()}
                  placeholder="Ej: Llamar al director financiero mañana a las 11:30 prioridad alta..."
                  className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  onClick={handleParseWithAi}
                  disabled={isAiLoading || !aiPrompt.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Procesar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HIGHLIGHTED SECTION: ATENCIÓN INMEDIATA - RECORDATORIOS DE ALTA PRIORIDAD */}
      {/* ========================================================================= */}
      {urgentHighPriorityReminders.length > 0 && (
        <section
          aria-label="Recordatorios de Alta Prioridad"
          className="relative overflow-hidden bg-gradient-to-r from-rose-900 via-slate-900 to-rose-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border-2 border-rose-500/80"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between gap-3 mb-3 border-b border-rose-800/60 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
              </span>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                  <span>ATENCIÓN INMEDIATA: RECORDATORIOS DE ALTA PRIORIDAD</span>
                  <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                    {urgentHighPriorityReminders.length} CRÍTICOS
                  </span>
                </h3>
                <p className="text-[11px] text-rose-200">
                  Compromisos de pronta atención requerida con alertas activas
                </p>
              </div>
            </div>

            <button
              onClick={() => playAlertSound('urgent')}
              className="text-xs bg-rose-600/50 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors border border-rose-400/40"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alerta Sonora</span>
            </button>
          </div>

          {/* Cards for High Priority Reminders */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentHighPriorityReminders.map((rem) => (
              <div
                key={rem.id}
                className="bg-slate-900/90 border-2 border-rose-500 rounded-xl p-3.5 flex flex-col justify-between gap-3 shadow-md hover:border-rose-400 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
                      <Flame className="w-3 h-3 text-amber-300" />
                      ALTA PRIORIDAD
                    </span>
                    <span className="text-[11px] font-semibold text-rose-200 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-rose-300" />
                      {rem.executionTime} hs
                    </span>
                  </div>

                  <h4 className="mt-2 text-sm font-bold text-white leading-snug">
                    {rem.title}
                  </h4>

                  {rem.notes && (
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {rem.notes}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-300">
                    <span className="flex items-center gap-1 font-mono bg-slate-800/80 px-2 py-0.5 rounded">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      {rem.executionDate}
                    </span>
                    <span className="bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">
                      {rem.contextTag}
                    </span>
                  </div>
                </div>

                {/* Direct Action Buttons for High Priority */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
                  <button
                    onClick={() => toggleReminderStatus(rem.id)}
                    className="flex-1 min-h-[38px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold px-3 py-1.5 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Cumplido</span>
                  </button>

                  <button
                    onClick={() => snoozeReminder(rem.id, 60)}
                    title="Posponer 1 hora"
                    className="min-h-[38px] bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-bold px-2.5 py-1.5 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>+1h</span>
                  </button>

                  <button
                    onClick={() => toggleAlert(rem.id)}
                    title={rem.isAlertActive ? 'Silenciar alerta' : 'Activar alerta'}
                    className={`min-h-[38px] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      rem.isAlertActive
                        ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {rem.isAlertActive ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Manual / Full Reminder Form Drawer */}
      {isAdding && (
        <form
          onSubmit={handleManualAdd}
          className="bg-white border-2 border-slate-900 rounded-2xl p-4 sm:p-5 shadow-md space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-500" />
              <span>Programar Nuevo Recordatorio Inteligente</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-medium"
            >
              Cancelar
            </button>
          </div>

          {/* Quick 1-Tap Presets (Special for Mobile / Fast Entry) */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Atajos Rápidos de Programación (1 Toque):
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => applyPresetTime('2026-09-21', '12:00', 'Alta')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                Hoy 12:00 (Alta)
              </button>
              <button
                type="button"
                onClick={() => applyPresetTime('2026-09-21', '18:00', 'Alta')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                Hoy 18:00 (Alta)
              </button>
              <button
                type="button"
                onClick={() => applyPresetTime('2026-09-22', '09:00', 'Alta')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                Mañana 09:00
              </button>
              <button
                type="button"
                onClick={() => applyPresetTime('2026-09-22', '15:30', 'Media')}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
              >
                Mañana 15:30
              </button>
            </div>
          </div>

          {/* Main Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tarea o Compromiso Concreto *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Envío de documentación tributaria, pagar seguro..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha Propuesta *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hora Propuesta *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
              />
            </div>

            {/* Explicit Priority Selector */}
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nivel de Prioridad *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('Alta')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
                    priority === 'Alta'
                      ? 'bg-rose-600 text-white shadow-xs scale-102 border-2 border-rose-700'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Alta (Crítica)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPriority('Media')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
                    priority === 'Media'
                      ? 'bg-amber-500 text-white shadow-xs scale-102 border-2 border-amber-600'
                      : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <span>Media</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPriority('Baja')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
                    priority === 'Baja'
                      ? 'bg-slate-700 text-white shadow-xs scale-102 border-2 border-slate-800'
                      : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  <span>Baja</span>
                </button>
              </div>
            </div>

            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contexto / Categoría
              </label>
              <select
                value={contextTag}
                onChange={(e) => setContextTag(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800 min-h-[44px]"
              >
                <option value="Compromiso Clave">Compromiso Clave</option>
                <option value="Finanzas">Finanzas & Pagos</option>
                <option value="Salud">Salud & Medicación</option>
                <option value="Hogar & Alimentación">Hogar & Alimentación</option>
                <option value="Seguimiento">Seguimiento de Proveedores</option>
                <option value="Administración">Administración General</option>
              </select>
            </div>

            <div className="sm:col-span-12">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notas adicionales (opcional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalles relevantes para no olvidar..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Recordatorio</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilter('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Todos ({reminders.length})
          </button>

          <button
            onClick={() => setFilter('alta')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === 'alta'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Alta Prioridad ({reminders.filter((r) => r.priority === 'Alta' && r.status === 'Pendiente').length})</span>
          </button>

          <button
            onClick={() => setFilter('hoy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'hoy'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Hoy ({reminders.filter((r) => r.executionDate === '2026-09-21').length})
          </button>

          <button
            onClick={() => setFilter('pendientes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'pendientes'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Pendientes ({reminders.filter((r) => r.status === 'Pendiente').length})
          </button>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo Recordatorio</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW VARIANT 1: SIMPLE MOBILE (ANDROID) INTERFACE (CARDS, THUMB-FRIENDLY) */}
      {/* ========================================================================= */}
      {isMobileMode ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold">📱 Modo Celular (Android) Simple</span>
            <span>{filteredReminders.length} compromisos</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredReminders.map((rem) => {
              const isCompleted = rem.status === 'Completado';
              const isAlta = rem.priority === 'Alta';

              return (
                <div
                  key={rem.id}
                  className={`bg-white rounded-2xl p-4 transition-all shadow-xs border ${
                    isAlta && !isCompleted
                      ? 'border-2 border-rose-500 bg-rose-50/20'
                      : isCompleted
                      ? 'border-slate-200 bg-slate-50/60 opacity-75'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Top Bar: Priority Badge + Time */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider ${
                        rem.priority === 'Alta'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : rem.priority === 'Media'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {rem.priority === 'Alta' && <Flame className="w-3.5 h-3.5 text-rose-600" />}
                      <span>{rem.priority} Prioridad</span>
                    </span>

                    <div className="flex items-center gap-1 text-slate-900 font-mono font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{rem.executionTime} hs</span>
                    </div>
                  </div>

                  {/* Task Title with checkbox */}
                  <div className="flex items-start gap-3 my-2">
                    <button
                      onClick={() => toggleReminderStatus(rem.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors p-1"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-slate-300" />
                      )}
                    </button>

                    <div className="flex-1">
                      <h4
                        className={`text-sm sm:text-base font-bold text-slate-900 leading-snug ${
                          isCompleted ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {rem.title}
                      </h4>

                      {rem.notes && (
                        <p className="text-xs text-slate-600 mt-1">{rem.notes}</p>
                      )}

                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {rem.executionDate === '2026-09-21' ? 'Hoy' : rem.executionDate}
                        </span>
                        <span>•</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                          {rem.contextTag}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Big Touch Action Bar (Min 44-48px height) */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => toggleReminderStatus(rem.id)}
                      className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                        isCompleted
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Reabrir</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Listo</span>
                        </>
                      )}
                    </button>

                    {!isCompleted && (
                      <button
                        onClick={() => snoozeReminder(rem.id, 60)}
                        className="min-h-[44px] px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>+1h</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleAlert(rem.id)}
                      className={`min-h-[44px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors ${
                        rem.isAlertActive
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {rem.isAlertActive ? (
                        <Bell className="w-4 h-4 text-amber-700" />
                      ) : (
                        <BellOff className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => deleteReminder(rem.id)}
                      className="min-h-[44px] px-3 text-slate-400 hover:text-rose-600 rounded-xl transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredReminders.length === 0 && (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
                No hay recordatorios con el filtro seleccionado.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW VARIANT 2: FORMAL WEB DESKTOP TABLE WITH EXECUTIVE PRECISION        */
        /* ========================================================================= */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 uppercase font-semibold tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">Estado</th>
                  <th className="py-3.5 px-4">Tarea / Compromiso Concreto</th>
                  <th className="py-3.5 px-4 w-48">Fecha & Hora Propuesta</th>
                  <th className="py-3.5 px-4 w-32 text-center">Nivel Prioridad</th>
                  <th className="py-3.5 px-4 w-36">Contexto</th>
                  <th className="py-3.5 px-4 w-28 text-center">Alerta</th>
                  <th className="py-3.5 px-4 w-36 text-right">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredReminders.map((rem) => {
                  const isCompleted = rem.status === 'Completado';
                  const isAlta = rem.priority === 'Alta';

                  return (
                    <tr
                      key={rem.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCompleted
                          ? 'bg-slate-50/40 text-slate-400'
                          : isAlta
                          ? 'bg-rose-50/30'
                          : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleReminderStatus(rem.id)}
                          className="text-slate-400 hover:text-emerald-600 transition-colors"
                          title={isCompleted ? 'Marcar pendiente' : 'Marcar completado'}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span
                            className={`font-semibold text-slate-900 ${
                              isCompleted ? 'line-through text-slate-400' : ''
                            } ${isAlta && !isCompleted ? 'text-rose-950 font-bold' : ''}`}
                          >
                            {rem.title}
                          </span>
                          {rem.notes && (
                            <span className="text-[11px] text-slate-500 mt-0.5">{rem.notes}</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{rem.executionDate}</span>
                          <span className="text-slate-400 font-sans">•</span>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span className="font-bold text-amber-700">{rem.executionTime} hs</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${
                            rem.priority === 'Alta'
                              ? 'bg-rose-100 text-rose-800 border-rose-200'
                              : rem.priority === 'Media'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {rem.priority === 'Alta' && <Flame className="w-3 h-3 text-rose-600" />}
                          {rem.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {rem.contextTag}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleAlert(rem.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                            rem.isAlertActive
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                          title="Activar / Desactivar alerta"
                        >
                          {rem.isAlertActive ? (
                            <>
                              <Bell className="w-3 h-3 text-amber-600" />
                              <span>Activa</span>
                            </>
                          ) : (
                            <>
                              <BellOff className="w-3 h-3" />
                              <span>Silencio</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!isCompleted && (
                            <button
                              onClick={() => snoozeReminder(rem.id, 60)}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                              title="Posponer 1 hora"
                            >
                              +1h
                            </button>
                          )}
                          <button
                            onClick={() => deleteReminder(rem.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors p-1.5"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredReminders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                      No hay recordatorios registrados para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) for Mobile Android */}
      {isMobileMode && (
        <button
          onClick={() => setIsAdding(true)}
          className="fixed bottom-20 right-5 z-40 w-14 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 border-2 border-amber-400"
          aria-label="Agregar recordatorio rápido"
        >
          <Plus className="w-6 h-6 text-amber-400" />
        </button>
      )}
    </div>
  );
};
