import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Minus, 
  Trash2, 
  Sparkles, 
  Search,
  ArrowDownUp,
  ShieldAlert,
  ShoppingCart
} from 'lucide-react';
import { InventoryCategory, InventoryItem, StockStatus, StoreCategory, UrgencyLevel } from '../types';

interface InventoryViewProps {
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  onTriggerCommand: (cmd: string) => void;
  onNavigateToShopping: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  setInventory,
  onTriggerCommand,
  onNavigateToShopping,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  // New item form
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<InventoryCategory>('Despensa');
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newMinQuantity, setNewMinQuantity] = useState<number>(2);
  const [newUnit, setNewUnit] = useState('unidades');
  const [newUrgency, setNewUrgency] = useState<UrgencyLevel>('Normal');
  const [newStoreRubro, setNewStoreRubro] = useState<StoreCategory>('Almacén');

  // Change quantity with auto stock recalculation
  const updateQuantity = (id: string, delta: number) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const nextQty = Math.max(0, item.quantity + delta);
        let nextStatus: StockStatus = 'Suficiente';
        if (nextQty === 0) {
          nextStatus = 'Agotado';
        } else if (nextQty <= item.minQuantity) {
          nextStatus = 'Por agotar';
        }

        return {
          ...item,
          quantity: nextQty,
          stockStatus: nextStatus,
          lastChecked: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const deleteItem = (id: string) => {
    setInventory((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    let initialStatus: StockStatus = 'Suficiente';
    if (newQuantity === 0) initialStatus = 'Agotado';
    else if (newQuantity <= newMinQuantity) initialStatus = 'Por agotar';

    const newItem: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      stockStatus: initialStatus,
      urgency: newUrgency,
      quantity: newQuantity,
      minQuantity: newMinQuantity,
      unit: newUnit,
      suggestedStoreCategory: newStoreRubro,
      lastChecked: new Date().toISOString().split('T')[0],
    };

    setInventory((prev) => [newItem, ...prev]);
    setNewName('');
    setIsAddingItem(false);
  };

  const categories: InventoryCategory[] = ['Limpieza', 'Higiene', 'Despensa', 'Insumos Generales'];

  const filteredItems = inventory.filter((item) => {
    const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
    const matchesUrgency = selectedUrgency === 'Todas' || item.urgency === selectedUrgency;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesUrgency && matchesSearch;
  });

  const urgentCount = inventory.filter((i) => i.urgency === 'Urgente').length;
  const depletedCount = inventory.filter((i) => i.stockStatus === 'Agotado').length;
  const lowCount = inventory.filter((i) => i.stockStatus === 'Por agotar').length;

  const getStockBadge = (status: StockStatus) => {
    switch (status) {
      case 'Suficiente':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Por agotar':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      case 'Agotado':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
    }
  };

  const getUrgencyBadge = (urg: UrgencyLevel) => {
    switch (urg) {
      case 'Urgente':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'Normal':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Reposición rutinaria':
        return 'bg-emerald-100/70 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & KPI summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Control de Inventario e Insumos del Hogar
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
              Área 2
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervisión continua de stock (Suficiente / Por agotar / Agotado) y niveles de urgencia para reposición.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onTriggerCommand('Estado de inventario')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Consultar con Asistente</span>
          </button>
          <button
            onClick={onNavigateToShopping}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Generar Compras Faltantes</span>
          </button>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Insumos
          </span>
          <span className="text-xl font-extrabold text-slate-900 mt-1 block">
            {inventory.length}
          </span>
        </div>
        <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Urgencia Alta
          </span>
          <span className="text-xl font-extrabold text-rose-700 mt-1 block">
            {urgentCount}
          </span>
        </div>
        <div className="bg-rose-50/30 border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
            Stock Agotado
          </span>
          <span className="text-xl font-extrabold text-rose-700 mt-1 block">
            {depletedCount}
          </span>
        </div>
        <div className="bg-amber-50/40 border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Por Agotar
          </span>
          <span className="text-xl font-extrabold text-amber-700 mt-1 block">
            {lowCount}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('Todas')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === 'Todas'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todas las Categorías
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat} ({inventory.filter((i) => i.category === cat).length})
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddingItem(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir Insumo</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar insumo (e.g. detergente, arroz, papel)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
              Filtrar urgencia:
            </span>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
            >
              <option value="Todas">Todas las urgencias</option>
              <option value="Urgente">Solo Urgentes</option>
              <option value="Normal">Normal</option>
              <option value="Reposición rutinaria">Reposición rutinaria</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Item Drawer/Form */}
      {isAddingItem && (
        <form onSubmit={handleAddItem} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Registrar Nuevo Insumo del Hogar
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingItem(false)}
              className="text-xs text-slate-400 hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nombre del Insumo / Producto
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Detergente lavavajilla 750ml"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Categoría Hogar
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as InventoryCategory)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="Limpieza">Limpieza</option>
                <option value="Higiene">Higiene</option>
                <option value="Despensa">Despensa</option>
                <option value="Insumos Generales">Insumos Generales</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Cantidad Actual
              </label>
              <input
                type="number"
                min="0"
                value={newQuantity}
                onChange={(e) => setNewQuantity(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Stock Mínimo
              </label>
              <input
                type="number"
                min="1"
                value={newMinQuantity}
                onChange={(e) => setNewMinQuantity(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Unidad
              </label>
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="u., litros, kg, rollos"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nivel de Urgencia
              </label>
              <select
                value={newUrgency}
                onChange={(e) => setNewUrgency(e.target.value as UrgencyLevel)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="Urgente">Urgente</option>
                <option value="Normal">Normal</option>
                <option value="Reposición rutinaria">Reposición rutinaria</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Rubro Comercial de Compra
              </label>
              <select
                value={newStoreRubro}
                onChange={(e) => setNewStoreRubro(e.target.value as StoreCategory)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="Almacén">Almacén</option>
                <option value="Limpieza">Limpieza</option>
                <option value="Refrigerados">Refrigerados</option>
                <option value="Verdulería">Verdulería</option>
                <option value="Carnicería">Carnicería</option>
              </select>
            </div>

            <div className="sm:col-span-6 flex items-end">
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold transition-colors"
              >
                Guardar Insumo en Inventario
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Categorized List of Items (Rule: listas claras categorizadas para inventario) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Listado de Stock y Niveles de Urgencia ({filteredItems.length} artículos)
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Ajuste rápido de cantidades (+/-)
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors ${
                item.stockStatus === 'Agotado' ? 'bg-rose-50/20' : ''
              }`}
            >
              {/* Item Details */}
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5">
                  {item.stockStatus === 'Agotado' ? (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  ) : item.stockStatus === 'Por agotar' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {item.name}
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                    <span>
                      Mínimo requerido: <strong className="text-slate-700">{item.minQuantity} {item.unit}</strong>
                    </span>
                    <span>•</span>
                    <span>Rubro tienda: <strong className="text-slate-700">{item.suggestedStoreCategory}</strong></span>
                  </div>
                </div>
              </div>

              {/* Stock controls & status badges */}
              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {/* Urgency Badge */}
                <span className={`text-[10px] px-2.5 py-1 rounded-md border ${getUrgencyBadge(item.urgency)}`}>
                  {item.urgency}
                </span>

                {/* Stock Status Badge */}
                <span className={`text-[10px] px-2.5 py-1 rounded-md border ${getStockBadge(item.stockStatus)}`}>
                  {item.stockStatus}
                </span>

                {/* Stepper (+ / -) */}
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
                    title="Disminuir stock"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-center text-xs font-mono font-bold text-slate-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
                    title="Aumentar stock"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-xs text-slate-500 font-medium w-12 truncate">
                  {item.unit}
                </span>

                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Eliminar insumo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="p-10 text-center text-slate-400 text-xs">
              No se encontraron insumos para los filtros aplicados.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
