import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Check, 
  Circle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Copy, 
  RotateCcw, 
  Sparkles, 
  Apple, 
  Beef, 
  Milk, 
  Package, 
  Sparkle, 
  Filter
} from 'lucide-react';
import { ShoppingItem, StoreCategory } from '../types';

interface ShoppingListViewProps {
  shoppingList: ShoppingItem[];
  setShoppingList: React.Dispatch<React.SetStateAction<ShoppingItem[]>>;
  onRegenerateList: () => void;
  onTriggerCommand: (cmd: string) => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  shoppingList,
  setShoppingList,
  onRegenerateList,
  onTriggerCommand,
}) => {
  const [selectedRubroFilter, setSelectedRubroFilter] = useState<string>('Todos');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // New item state
  const [newItemName, setNewItemName] = useState('');
  const [newItemRubro, setNewItemRubro] = useState<StoreCategory>('Verdulería');
  const [newItemQty, setNewItemQty] = useState('');

  const rubros: { key: StoreCategory; label: string; icon: any; color: string }[] = [
    { key: 'Verdulería', label: 'Verdulería & Frutas', icon: Apple, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { key: 'Carnicería', label: 'Carnicería & Pescados', icon: Beef, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { key: 'Refrigerados', label: 'Refrigerados & Lácteos', icon: Milk, color: 'text-sky-700 bg-sky-50 border-sky-200' },
    { key: 'Almacén', label: 'Almacén & Secos', icon: Package, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { key: 'Limpieza', label: 'Limpieza & Higiene', icon: Sparkle, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  ];

  const toggleItem = (id: string) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isPurchased: !item.isPurchased } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setShoppingList((prev) => prev.filter((i) => i.id !== id));
  };

  const clearPurchased = () => {
    setShoppingList((prev) => prev.filter((i) => !i.isPurchased));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: `shop-manual-${Date.now()}`,
      name: newItemName.trim(),
      rubro: newItemRubro,
      quantity: newItemQty.trim() || '1 u.',
      source: 'Manual',
      isPurchased: false,
    };

    setShoppingList((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemQty('');
    setIsAddingItem(false);
  };

  const totalCount = shoppingList.length;
  const purchasedCount = shoppingList.filter((i) => i.isPurchased).length;
  const progressPercent = totalCount > 0 ? Math.round((purchasedCount / totalCount) * 100) : 0;

  // Copy categorized text list
  const copyFormattedList = () => {
    let output = '🛒 LISTA DE COMPRAS CONSOLIDADA (Agrupada por Rubro)\n\n';

    rubros.forEach(({ key, label }) => {
      const itemsInRubro = shoppingList.filter((i) => i.rubro === key && !i.isPurchased);
      if (itemsInRubro.length > 0) {
        output += `📍 ${label.toUpperCase()}\n`;
        itemsInRubro.forEach((item) => {
          output += `• [ ] ${item.name} (${item.quantity})${item.sourceDetail ? ` - ${item.sourceDetail}` : ''}\n`;
        });
        output += '\n';
      }
    });

    navigator.clipboard.writeText(output);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Lista Definitiva de Compras por Rubro Comercial
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              Cruce Menú + Insumos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Estructurada por comercios para optimizar el recorrido en el supermercado o tienda sin compras redundantes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onRegenerateList}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>"Generar lista de compras"</span>
          </button>

          <button
            onClick={copyFormattedList}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedNotification ? '¡Copiada!' : 'Copiar para WhatsApp'}</span>
          </button>
        </div>
      </div>

      {/* Progress & Quick stats bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex flex-col items-center justify-center shrink-0">
            <span className="text-sm font-extrabold leading-none">{progressPercent}%</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-tighter">Listo</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>
                Comprados: <strong className="text-slate-900">{purchasedCount}</strong> de {totalCount} artículos
              </span>
              <span className="text-slate-400 font-normal">
                {totalCount - purchasedCount} pendientes en chango / carro
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {purchasedCount > 0 && (
            <button
              onClick={clearPurchased}
              className="text-xs text-slate-500 hover:text-rose-600 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Limpiar tachados
            </button>
          )}

          <button
            onClick={() => setIsAddingItem(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Ítem</span>
          </button>
        </div>
      </div>

      {/* Manual item add form */}
      {isAddingItem && (
        <form onSubmit={handleAddItem} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Añadir Producto Manual a la Lista
            </h4>
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Producto
              </label>
              <input
                type="text"
                required
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="e.g. Frutillas frescas, Papel aluminio..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Rubro Comercial
              </label>
              <select
                value={newItemRubro}
                onChange={(e) => setNewItemRubro(e.target.value as StoreCategory)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="Verdulería">Verdulería</option>
                <option value="Carnicería">Carnicería</option>
                <option value="Refrigerados">Refrigerados</option>
                <option value="Almacén">Almacén</option>
                <option value="Limpieza">Limpieza</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Cantidad / Unidad
              </label>
              <input
                type="text"
                value={newItemQty}
                onChange={(e) => setNewItemQty(e.target.value)}
                placeholder="1 kg, 2 u."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold transition-colors"
              >
                Agregar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Rubro Tabs Selector */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => setSelectedRubroFilter('Todos')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            selectedRubroFilter === 'Todos'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          Todos los Rubros ({totalCount})
        </button>

        {rubros.map((r) => {
          const count = shoppingList.filter((i) => i.rubro === r.key).length;
          const Icon = r.icon;
          return (
            <button
              key={r.key}
              onClick={() => setSelectedRubroFilter(r.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedRubroFilter === r.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{r.key} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* Shopping List Grouped by Rubros (Rule: clasifica por categoría de comercio) */}
      <div className="space-y-5">
        {rubros
          .filter((r) => selectedRubroFilter === 'Todos' || selectedRubroFilter === r.key)
          .map((rubroDef) => {
            const itemsInRubro = shoppingList.filter((i) => i.rubro === rubroDef.key);
            if (itemsInRubro.length === 0 && selectedRubroFilter === 'Todos') return null;

            const Icon = rubroDef.icon;
            const completedInRubro = itemsInRubro.filter((i) => i.isPurchased).length;

            return (
              <div
                key={rubroDef.key}
                className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden"
              >
                {/* Rubro Header */}
                <div className="p-3.5 sm:p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`p-1.5 rounded-lg border ${rubroDef.color}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {rubroDef.label}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        {completedInRubro} de {itemsInRubro.length} en carrito
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-slate-400">
                    {itemsInRubro.length} ítems
                  </span>
                </div>

                {/* Items in Rubro */}
                <div className="divide-y divide-slate-100">
                  {itemsInRubro.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors ${
                        item.isPurchased ? 'bg-slate-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => toggleItem(item.id)}
                          className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                          title={item.isPurchased ? 'Desmarcar' : 'Tachar comprado'}
                        >
                          {item.isPurchased ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs sm:text-sm font-bold text-slate-900 truncate ${
                              item.isPurchased ? 'line-through text-slate-400 font-normal' : ''
                            }`}
                          >
                            {item.name}
                          </p>
                          {item.sourceDetail && (
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {item.sourceDetail}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                          {item.quantity}
                        </span>

                        {/* Origin badge */}
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                            item.source === 'Inventario'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : item.source === 'Menú'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.source}
                        </span>

                        <button
                          onClick={() => deleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Eliminar de lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {itemsInRubro.length === 0 && (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      No hay artículos pendientes en este rubro.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
