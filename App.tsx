import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Calendar, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Bell, 
  BellOff, 
  Tag, 
  Check, 
  Sparkles, 
  ArrowUpDown, 
  Filter,
  Flame,
  ListTodo,
  Layers,
  BellRing
} from 'lucide-react';
import { PriorityLevel, Reminder, Task } from '../types';
import { SmartRemindersView } from './SmartRemindersView';

interface ProductivityViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  onTriggerCommand: (cmd: string) => void;
}

export const ProductivityView: React.FC<ProductivityViewProps> = ({
  tasks,
  setTasks,
  reminders,
  setReminders,
  onTriggerCommand,
}) => {
  const [subView, setSubView] = useState<'recordatorios' | 'tareas' | 'ambas'>('recordatorios');
  const [taskFilter, setTaskFilter] = useState<'todas' | 'pendientes' | 'completadas'>('pendientes');
  const [reminderFilter, setReminderFilter] = useState<'todos' | 'pendientes' | 'alta'>('todos');

  // New task form state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<PriorityLevel>('Alta');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-09-21');
  const [newTaskDueTime, setNewTaskDueTime] = useState('12:00');
  const [newTaskCategory, setNewTaskCategory] = useState<'Trabajo' | 'Hogar' | 'Personal' | 'Finanzas'>('Trabajo');

  // Task toggles
  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
      dueTime: newTaskDueTime,
      category: newTaskCategory,
      completed: false,
    };

    setTasks((prev) => [newTask, ...prev]);
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'pendientes') return !t.completed;
    if (taskFilter === 'completadas') return t.completed;
    return true;
  });

  const getPriorityBadge = (p: PriorityLevel) => {
    switch (p) {
      case 'Alta':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'Media':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      case 'Baja':
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const activeAlertsCount = reminders.filter((r) => r.isAlertActive && r.status === 'Pendiente').length;
  const highPriorityCount = reminders.filter((r) => r.priority === 'Alta' && r.status === 'Pendiente').length;

  return (
    <div className="space-y-6">
      {/* Sub-view Navigation Tabs */}
      <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex-wrap">
        <div className="inline-flex rounded-xl p-1 bg-slate-100 gap-1 text-xs font-bold w-full sm:w-auto">
          <button
            onClick={() => setSubView('recordatorios')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
              subView === 'recordatorios'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BellRing className={`w-3.5 h-3.5 ${subView === 'recordatorios' ? 'text-amber-400' : ''}`} />
            <span>Sistema de Recordatorios</span>
            {highPriorityCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {highPriorityCount} Alta
              </span>
            )}
          </button>

          <button
            onClick={() => setSubView('tareas')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
              subView === 'tareas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>Tareas Diarias</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
              {tasks.filter((t) => !t.completed).length}
            </span>
          </button>

          <button
            onClick={() => setSubView('ambas')}
            className={`hidden md:flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
              subView === 'ambas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Vista Integral</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onTriggerCommand('Mis recordatorios')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Auditoría con Asistente</span>
          </button>
        </div>
      </div>

      {/* Render Smart Reminders View */}
      {(subView === 'recordatorios' || subView === 'ambas') && (
        <SmartRemindersView
          reminders={reminders}
          setReminders={setReminders}
          onTriggerCommand={onTriggerCommand}
        />
      )}

      {/* Render Tasks View */}
      {(subView === 'tareas' || subView === 'ambas') && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Tareas Diarias & Seguimiento de Vencimientos
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Gestión operativa con categorías de trabajo, hogar, finanzas y personal
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs">
                <button
                  onClick={() => setTaskFilter('pendientes')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    taskFilter === 'pendientes' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Pendientes ({tasks.filter((t) => !t.completed).length})
                </button>
                <button
                  onClick={() => setTaskFilter('todas')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    taskFilter === 'todas' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Todas ({tasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter('completadas')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    taskFilter === 'completadas' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Completadas
                </button>
              </div>

              <button
                onClick={() => setIsAddingTask(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Tarea</span>
              </button>
            </div>
          </div>

          {/* Add task inline form */}
          {isAddingTask && (
            <form onSubmit={handleAddTask} className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Nueva Tarea Diaria
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="text-slate-400 hover:text-slate-700 text-xs"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Descripción de la tarea *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g., Revisar informe trimestral..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-slate-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as PriorityLevel)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Fecha Vencimiento
                  </label>
                  <input
                    type="date"
                    required
                    value={newTaskDueDate}
                    onChange={(e) => setNewTaskDueDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none"
                  >
                    <option value="Trabajo">Trabajo</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Personal">Personal</option>
                    <option value="Finanzas">Finanzas</option>
                  </select>
                </div>

                <div className="sm:col-span-1 flex items-end">
                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-1.5 text-xs font-bold transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tasks List */}
          <div className="divide-y divide-slate-100">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                className={`p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors ${
                  t.completed ? 'bg-slate-50/40 text-slate-400' : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleTask(t.id)}
                    className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                  >
                    {t.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs sm:text-sm font-semibold text-slate-900 truncate ${
                        t.completed ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {t.dueDate}
                      </span>
                      {t.dueTime && (
                        <span className="flex items-center gap-1 font-mono text-slate-700">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {t.dueTime} hs
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {t.category}
                      </span>
                      {t.notes && <span className="italic text-slate-400">• {t.notes}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${getPriorityBadge(
                      t.priority
                    )}`}
                  >
                    {t.priority}
                  </span>

                  <button
                    onClick={() => deleteTask(t.id)}
                    className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                    title="Eliminar tarea"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No hay tareas en este estado.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
