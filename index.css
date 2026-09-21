import React, { useState } from 'react';
import { 
  Utensils, 
  Sparkles, 
  ShoppingCart, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  Check, 
  RefreshCw,
  Sun,
  Sunset,
  Coffee,
  Moon
} from 'lucide-react';
import { DayMenu, Meal } from '../types';

interface WeeklyMenuViewProps {
  menu: DayMenu[];
  setMenu: React.Dispatch<React.SetStateAction<DayMenu[]>>;
  onTriggerCommand: (cmd: string) => void;
  onNavigateToShopping: () => void;
}

export const WeeklyMenuView: React.FC<WeeklyMenuViewProps> = ({
  menu,
  setMenu,
  onTriggerCommand,
  onNavigateToShopping,
}) => {
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'individual' | 'tabla'>('individual');
  const [isGenerating, setIsGenerating] = useState(false);

  // Edit meal modal
  const [editingMeal, setEditingMeal] = useState<{
    day: DayMenu['day'];
    slot: 'desayuno' | 'almuerzo' | 'merienda' | 'cena';
    meal: Meal;
  } | null>(null);
  const [editMealName, setEditMealName] = useState('');
  const [editMealIngredients, setEditMealIngredients] = useState('');

  const currentDayMenu = menu[selectedDayIndex] || menu[0];

  const handleOpenEdit = (
    day: DayMenu['day'],
    slot: 'desayuno' | 'almuerzo' | 'merienda' | 'cena',
    meal: Meal
  ) => {
    setEditingMeal({ day, slot, meal });
    setEditMealName(meal.name);
    setEditMealIngredients(meal.ingredients.join(', '));
  };

  const handleSaveMealEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeal || !editMealName.trim()) return;

    const ingArray = editMealIngredients
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    setMenu((prev) =>
      prev.map((dayItem) => {
        if (dayItem.day !== editingMeal.day) return dayItem;
        return {
          ...dayItem,
          [editingMeal.slot]: {
            name: editMealName.trim(),
            ingredients: ingArray,
          },
        };
      })
    );

    setEditingMeal(null);
  };

  const handleGenerateMenuWithAI = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: 'Mediterráneo, equilibrado, bajo en grasas saturadas, alto en proteínas y vegetales',
        }),
      });
      const data = await res.json();
      if (data.menu && Array.isArray(data.menu) && data.menu.length === 7) {
        setMenu(data.menu);
      } else {
        // Trigger command via assistant console
        onTriggerCommand('Menú semanal');
      }
    } catch (e) {
      onTriggerCommand('Menú semanal');
    } finally {
      setIsGenerating(false);
    }
  };

  const mealSlots = [
    { key: 'desayuno', label: 'Desayuno', icon: Coffee, color: 'text-amber-600 bg-amber-50' },
    { key: 'almuerzo', label: 'Almuerzo', icon: Sun, color: 'text-emerald-600 bg-emerald-50' },
    { key: 'merienda', label: 'Merienda', icon: Sunset, color: 'text-orange-600 bg-orange-50' },
    { key: 'cena', label: 'Cena', icon: Moon, color: 'text-indigo-600 bg-indigo-50' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Plan Alimentario Semanal (7 Días)
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              Área 3
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Planificación integral de desayunos, almuerzos, meriendas y cenas variadas, cruzadas con la lista de compras.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerateMenuWithAI}
            disabled={isGenerating}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isGenerating ? 'Generando...' : 'Optimizar Menú con Asistente'}</span>
          </button>

          <button
            onClick={onNavigateToShopping}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Cruzar & Ver Lista de Compras</span>
          </button>
        </div>
      </div>

      {/* View Switcher & Day Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* 7 Days selector chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {menu.map((dayItem, idx) => (
            <button
              key={dayItem.day}
              onClick={() => {
                setSelectedDayIndex(idx);
                setViewMode('individual');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedDayIndex === idx && viewMode === 'individual'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {dayItem.day}
            </button>
          ))}
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-1 self-end sm:self-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs">
          <button
            onClick={() => setViewMode('individual')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              viewMode === 'individual' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-600'
            }`}
          >
            Vista Detallada
          </button>
          <button
            onClick={() => setViewMode('tabla')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              viewMode === 'tabla' ? 'bg-white shadow-2xs text-slate-900 font-bold' : 'text-slate-600'
            }`}
          >
            Tabla Semanal Completa
          </button>
        </div>
      </div>

      {/* INDIVIDUAL DAY VIEW */}
      {viewMode === 'individual' && currentDayMenu && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Menú del {currentDayMenu.day}</span>
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedDayIndex((prev) => (prev > 0 ? prev - 1 : menu.length - 1))}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                title="Día anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedDayIndex((prev) => (prev < menu.length - 1 ? prev + 1 : 0))}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                title="Día siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mealSlots.map((slot) => {
              const meal = currentDayMenu[slot.key];
              const Icon = slot.icon;

              return (
                <div
                  key={slot.key}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${slot.color}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {slot.label}
                      </span>

                      <button
                        onClick={() => handleOpenEdit(currentDayMenu.day, slot.key, meal)}
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors rounded"
                        title="Modificar comida"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {meal.name}
                    </h4>

                    {/* Ingredients tags */}
                    <div className="mt-3">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Ingredientes requeridos para la compra:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {meal.ingredients.map((ing, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FULL WEEK TABLE (Rule: tablas para cronogramas) */}
      {viewMode === 'tabla' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Cronograma Nutricional Completo de 7 Días
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 w-28">Día</th>
                  <th className="py-3 px-4">🌅 Desayuno</th>
                  <th className="py-3 px-4">☀️ Almuerzo</th>
                  <th className="py-3 px-4">☕ Merienda</th>
                  <th className="py-3 px-4">🌙 Cena</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {menu.map((dayItem) => (
                  <tr key={dayItem.day} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap bg-slate-50/30">
                      {dayItem.day}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-800">{dayItem.desayuno.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {dayItem.desayuno.ingredients.join(', ')}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-800">{dayItem.almuerzo.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {dayItem.almuerzo.ingredients.join(', ')}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-800">{dayItem.merienda.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {dayItem.merienda.ingredients.join(', ')}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-800">{dayItem.cena.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {dayItem.cena.ingredients.join(', ')}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Meal Modal */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveMealEdit}
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Editar {editingMeal.slot} — {editingMeal.day}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMeal(null)}
                className="text-slate-400 hover:text-slate-700 text-xs"
              >
                Cerrar
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del plato / comida
              </label>
              <input
                type="text"
                required
                value={editMealName}
                onChange={(e) => setEditMealName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ingredientes (separados por coma para consolidar en lista de compras)
              </label>
              <textarea
                rows={3}
                value={editMealIngredients}
                onChange={(e) => setEditMealIngredients(e.target.value)}
                placeholder="Pollo, espinacas, arroz, tomates..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingMeal(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
