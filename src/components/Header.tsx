import React from 'react';
import { 
  Sparkles, 
  CalendarClock, 
  BellRing, 
  PackageSearch, 
  UtensilsCrossed, 
  ShoppingCart, 
  Bot,
  Moon,
  Sun
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onExecuteCommand: (command: string) => void;
  pendingTasksCount: number;
  activeAlertsCount: number;
  lowStockCount: number;
  openConsole: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExecuteCommand,
  pendingTasksCount,
  activeAlertsCount,
  lowStockCount,
  openConsole,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const capitalizedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);

  const activationCommands = [
    { label: 'Planificar día', tab: 'tiempo', icon: CalendarClock },
    { label: 'Mis recordatorios', tab: 'recordatorios', icon: BellRing, badge: activeAlertsCount },
    { label: 'Estado de inventario', tab: 'inventario', icon: PackageSearch, badge: lowStockCount },
    { label: 'Menú semanal', tab: 'menu', icon: UtensilsCrossed },
    { label: 'Generar lista de compras', tab: 'compras', icon: ShoppingCart },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center font-bold shadow-xs shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                Asistente Ejecutivo & Administrador del Hogar
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
                En línea
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium capitalize truncate">
              {capitalizedDate} • Modo Nocturno Activo
            </p>
          </div>
        </div>

        {/* Quick summary badges & Assistant Trigger & Dark Mode Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap justify-between md:justify-end">
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-1 text-xs font-medium text-slate-300">
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-100 font-semibold shadow-2xs">
              {pendingTasksCount} pendientes
            </span>
            {activeAlertsCount > 0 && (
              <span className="px-2 py-0.5 text-amber-400 font-semibold flex items-center gap-1">
                <BellRing className="w-3 h-3" /> {activeAlertsCount} alertas
              </span>
            )}
            {lowStockCount > 0 && (
              <span className="px-2 py-0.5 text-rose-400 font-semibold">
                {lowStockCount} reposición
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Night / Day Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDarkMode 
                  ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700' 
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
              title={isDarkMode ? 'Cambiar a modo diurno' : 'Activar modo nocturno'}
              aria-label="Alternar tema"
            >
              {isDarkMode ? (
                <>
                  <Moon className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline text-xs">Nocturno</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline text-xs">Diurno</span>
                </>
              )}
            </button>

            <button
              onClick={openConsole}
              className="flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
              <span className="whitespace-nowrap">Consola</span>
            </button>
          </div>
        </div>
      </div>

      {/* Activation Commands Bar */}
      <div className="bg-slate-950/90 border-t border-slate-800/80 px-3 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1">
            Comandos:
          </span>
          {activationCommands.map((cmd) => {
            const Icon = cmd.icon;
            const isActive = activeTab === cmd.tab;
            return (
              <button
                key={cmd.label}
                onClick={() => {
                  setActiveTab(cmd.tab);
                  onExecuteCommand(cmd.label);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white border border-amber-500/50 shadow-xs ring-1 ring-amber-500/30'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>"{cmd.label}"</span>
                {typeof cmd.badge === 'number' && cmd.badge > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {cmd.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

