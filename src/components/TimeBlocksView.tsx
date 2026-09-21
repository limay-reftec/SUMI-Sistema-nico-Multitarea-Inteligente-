import React, { useState } from 'react';
import { 
  Clock, 
  CalendarClock, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Briefcase, 
  Layers, 
  ChevronRight, 
  Check, 
  Trash2, 
  Hourglass,
  ArrowRight
} from 'lucide-react';
import { PriorityLevel, Project, ProjectStep, TimeBlock } from '../types';

interface TimeBlocksViewProps {
  timeBlocks: TimeBlock[];
  setTimeBlocks: React.Dispatch<React.SetStateAction<TimeBlock[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  onTriggerCommand: (cmd: string) => void;
}

export const TimeBlocksView: React.FC<TimeBlocksViewProps> = ({
  timeBlocks,
  setTimeBlocks,
  projects,
  setProjects,
  onTriggerCommand,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bloques' | 'proyectos'>('bloques');

  // New time block modal
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newRange, setNewRange] = useState('18:00 - 19:30');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<TimeBlock['type']>('Foco Profundo');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('Alta');
  const [newTasksStr, setNewTasksStr] = useState('');

  // Project breakdown modal
  const [isBreakingDownProject, setIsBreakingDownProject] = useState(false);
  const [projNameInput, setProjNameInput] = useState('');
  const [projGoalInput, setProjGoalInput] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const toggleBlockCompleted = (id: string) => {
    setTimeBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b))
    );
  };

  const deleteBlock = (id: string) => {
    setTimeBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const taskList = newTasksStr
      .split('\n')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newBlock: TimeBlock = {
      id: `tb-${Date.now()}`,
      timeRange: newRange,
      blockName: newName.trim(),
      type: newType,
      priority: newPriority,
      tasks: taskList.length > 0 ? taskList : ['Actividad planificada'],
      completed: false,
    };

    setTimeBlocks((prev) => [...prev, newBlock]);
    setNewName('');
    setNewTasksStr('');
    setIsAddingBlock(false);
  };

  // Toggle project step completion
  const toggleProjectStep = (projId: string, stepId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;
        const updatedSteps = p.steps.map((s) =>
          s.id === stepId ? { ...s, completed: !s.completed } : s
        );
        const completedCount = updatedSteps.filter((s) => s.completed).length;
        const newProgress = Math.round((completedCount / updatedSteps.length) * 100);

        return {
          ...p,
          steps: updatedSteps,
          progress: newProgress,
        };
      })
    );
  };

  // Trigger AI Project Breakdown
  const handleBreakdownProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projNameInput.trim()) return;

    setIsProcessingAI(true);
    try {
      const res = await fetch('/api/breakdown-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projNameInput,
          projectGoal: projGoalInput,
        }),
      });

      const data = await res.json();
      let steps: ProjectStep[] = [];

      if (data.tasks && Array.isArray(data.tasks)) {
        steps = data.tasks.map((t: any, idx: number) => ({
          id: `ps-new-${Date.now()}-${idx}`,
          title: t.title || 'Acción concreta',
          timeEstimate: t.timeEstimate || '1 hora',
          priority: (t.priority as PriorityLevel) || 'Alta',
          suggestedTiming: t.suggestedTiming || `Fase ${idx + 1}`,
          completed: false,
        }));
      } else {
        // Smart fallback breakdown
        steps = [
          {
            id: `ps-${Date.now()}-1`,
            title: `Definición de alcance y entregables para ${projNameInput}`,
            timeEstimate: '45 min',
            priority: 'Alta',
            suggestedTiming: 'Día 1 - Bloque Foco',
            completed: false,
          },
          {
            id: `ps-${Date.now()}-2`,
            title: 'Recopilación de información base y recursos requeridos',
            timeEstimate: '1.5 horas',
            priority: 'Alta',
            suggestedTiming: 'Día 2 - Bloque Foco',
            completed: false,
          },
          {
            id: `ps-${Date.now()}-3`,
            title: 'Ejecución del núcleo operativo y redacción de propuesta',
            timeEstimate: '2 horas',
            priority: 'Media',
            suggestedTiming: 'Día 3 - Bloque Operativo',
            completed: false,
          },
          {
            id: `ps-${Date.now()}-4`,
            title: 'Revisión final, control de calidad y cierre de entregables',
            timeEstimate: '1 hora',
            priority: 'Alta',
            suggestedTiming: 'Día 4 - Bloque Cierre',
            completed: false,
          },
        ];
      }

      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: projNameInput.trim(),
        goal: projGoalInput.trim() || 'Ejecución optimizada sin complicaciones',
        deadline: '2026-10-15',
        progress: 0,
        steps,
      };

      setProjects((prev) => [newProject, ...prev]);
      setProjNameInput('');
      setProjGoalInput('');
      setIsBreakingDownProject(false);
    } catch (err) {
      console.warn('Error calling breakdown api:', err);
    } finally {
      setIsProcessingAI(false);
    }
  };

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

  const getTypeBadge = (type: TimeBlock['type']) => {
    switch (type) {
      case 'Foco Profundo':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Rutina':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Reuniones':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Operativo':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hogar & Alimentación':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Tiempo, Rutinas y Proyectos
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              Área 4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cronograma diario organizado por bloques de tiempo y desglose de metas complejas en acciones secuenciales.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onTriggerCommand('Planificar día')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>"Planificar día" con Asistente</span>
          </button>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('bloques')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'bloques'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <CalendarClock className="w-4 h-4" />
          <span>Cronograma Diario por Bloques ({timeBlocks.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('proyectos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'proyectos'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Desglose de Proyectos ({projects.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: TIME BLOCKS SCHEDULE (Rule: utiliza tablas para horarios/cronogramas) */}
      {activeSubTab === 'bloques' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Tabla de Bloques Horarios del Día
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Protege los bloques de foco profundo y delimita las rutinas operativas del hogar
                </p>
              </div>

              <button
                onClick={() => setIsAddingBlock(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Bloque Horario</span>
              </button>
            </div>

            {/* Add block form */}
            {isAddingBlock && (
              <form onSubmit={handleAddBlock} className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Nuevo Bloque de Tiempo
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddingBlock(false)}
                    className="text-xs text-slate-400 hover:text-slate-700"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Rango Horario
                    </label>
                    <input
                      type="text"
                      required
                      value={newRange}
                      onChange={(e) => setNewRange(e.target.value)}
                      placeholder="e.g. 08:00 - 09:30"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nombre del Bloque
                    </label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Foco Profundo - Entregables Q3"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tipo de Bloque
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none"
                    >
                      <option value="Foco Profundo">Foco Profundo</option>
                      <option value="Rutina">Rutina</option>
                      <option value="Reuniones">Reuniones</option>
                      <option value="Operativo">Operativo</option>
                      <option value="Hogar & Alimentación">Hogar & Alimentación</option>
                      <option value="Descanso">Descanso</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Prioridad
                    </label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none"
                    >
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>

                  <div className="sm:col-span-10">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Tareas asociadas (una por línea)
                    </label>
                    <textarea
                      rows={2}
                      value={newTasksStr}
                      onChange={(e) => setNewTasksStr(e.target.value)}
                      placeholder="Tarea 1&#10;Tarea 2"
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2 text-xs font-bold transition-colors"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Formal Table for Time Blocks */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Hecho</th>
                    <th className="py-3 px-4 w-36">Horario</th>
                    <th className="py-3 px-4 w-48">Bloque</th>
                    <th className="py-3 px-4 w-36">Tipo</th>
                    <th className="py-3 px-4">Tareas & Entregables Asignados</th>
                    <th className="py-3 px-4 w-24 text-center">Prioridad</th>
                    <th className="py-3 px-4 w-16 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {timeBlocks.map((block) => (
                    <tr
                      key={block.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        block.completed ? 'bg-slate-50/50 opacity-60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleBlockCompleted(block.id)}
                          className="text-slate-400 hover:text-emerald-600 transition-colors"
                          title={block.completed ? 'Desmarcar' : 'Completar bloque'}
                        >
                          {block.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{block.timeRange}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <span className={block.completed ? 'line-through text-slate-400' : ''}>
                          {block.blockName}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getTypeBadge(block.type)}`}>
                          {block.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <ul className="list-disc list-inside space-y-0.5 text-slate-700 text-xs">
                          {block.tasks.map((task, idx) => (
                            <li key={idx} className={block.completed ? 'line-through text-slate-400' : ''}>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-md border text-[10px] ${getPriorityBadge(block.priority)}`}>
                          {block.priority}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Eliminar bloque"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PROJECT BREAKDOWN */}
      {activeSubTab === 'proyectos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Desglose de Metas y Proyectos Complejos
              </h3>
              <p className="text-xs text-slate-500">
                Transforma grandes metas en secuencias de acciones concretas con tiempo estimado
              </p>
            </div>

            <button
              onClick={() => setIsBreakingDownProject(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Desglosar Nuevo Proyecto con Coach IA</span>
            </button>
          </div>

          {/* AI Project Breakdown Form */}
          {isBreakingDownProject && (
            <form onSubmit={handleBreakdownProject} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Asistente Ejecutivo: Desglosador de Metas
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBreakingDownProject(false)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre de la meta o proyecto complejo
                </label>
                <input
                  type="text"
                  required
                  value={projNameInput}
                  onChange={(e) => setProjNameInput(e.target.value)}
                  placeholder="e.g. Mudanza y organización del nuevo estudio, Lanzamiento de producto Q4..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Objetivo o resultado deseado (detalles adicionales)
                </label>
                <textarea
                  rows={2}
                  value={projGoalInput}
                  onChange={(e) => setProjGoalInput(e.target.value)}
                  placeholder="Definir el resultado esperado para que el asistente determine acciones secuenciales precisas..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsBreakingDownProject(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAI}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isProcessingAI ? 'Desglosando en acciones...' : 'Generar Acciones Concretas'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Projects Cards List */}
          <div className="space-y-5">
            {projects.map((proj) => (
              <div key={proj.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                {/* Project Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{proj.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{proj.goal}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">
                      Límite: <strong className="text-slate-800">{proj.deadline}</strong>
                    </span>
                    <span className="text-xs font-extrabold text-slate-900 px-2.5 py-1 bg-slate-100 rounded-lg">
                      {proj.progress}% completado
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 my-4 overflow-hidden">
                  <div
                    className="bg-slate-900 h-full rounded-full transition-all duration-300"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>

                {/* Action steps list */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Acciones Concretas Secuenciales:
                  </span>
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                    {proj.steps.map((step) => (
                      <div
                        key={step.id}
                        className={`p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors ${
                          step.completed ? 'bg-slate-50/50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            onClick={() => toggleProjectStep(proj.id, step.id)}
                            className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                          >
                            {step.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>

                          <span
                            className={`text-xs font-semibold text-slate-800 truncate ${
                              step.completed ? 'line-through text-slate-400 font-normal' : ''
                            }`}
                          >
                            {step.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {step.suggestedTiming && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {step.suggestedTiming}
                            </span>
                          )}

                          <span className="text-[10px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                            <Hourglass className="w-3 h-3 text-slate-400" />
                            {step.timeEstimate}
                          </span>

                          <span className={`text-[10px] px-2 py-0.5 rounded-md border ${getPriorityBadge(step.priority)}`}>
                            {step.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
