import React, { useState, useEffect } from 'react';
import { 
  CalendarClock, 
  BellRing, 
  PackageSearch, 
  UtensilsCrossed, 
  ShoppingCart,
  Bot,
  Sparkles,
  Layers
} from 'lucide-react';
import { Header } from './components/Header';
import { ProductivityView } from './components/ProductivityView';
import { InventoryView } from './components/InventoryView';
import { WeeklyMenuView } from './components/WeeklyMenuView';
import { ShoppingListView } from './components/ShoppingListView';
import { TimeBlocksView } from './components/TimeBlocksView';
import { ExecutiveConsoleModal } from './components/ExecutiveConsoleModal';
import { 
  INITIAL_INVENTORY, 
  INITIAL_PROJECTS, 
  INITIAL_REMINDERS, 
  INITIAL_TASKS, 
  INITIAL_TIME_BLOCKS, 
  INITIAL_WEEKLY_MENU 
} from './data/initialData';
import { 
  DayMenu, 
  InventoryItem, 
  Project, 
  Reminder, 
  ShoppingItem, 
  Task, 
  TimeBlock 
} from './types';
import { loadFromLocalStorage, saveToLocalStorage } from './utils/storage';
import { generateConsolidatedShoppingList } from './utils/shoppingLogic';

export default function App() {
  // Theme state: default to night mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('app_theme');
      return saved !== null ? saved === 'dark' : true;
    }
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('app_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('app_theme', 'light');
    }
  }, [isDarkMode]);

  // State with LocalStorage persistence
  const [tasks, setTasks] = useState<Task[]>(() =>
    loadFromLocalStorage('app_tasks', INITIAL_TASKS)
  );

  const [reminders, setReminders] = useState<Reminder[]>(() =>
    loadFromLocalStorage('app_reminders', INITIAL_REMINDERS)
  );

  const [inventory, setInventory] = useState<InventoryItem[]>(() =>
    loadFromLocalStorage('app_inventory', INITIAL_INVENTORY)
  );

  const [weeklyMenu, setWeeklyMenu] = useState<DayMenu[]>(() =>
    loadFromLocalStorage('app_weekly_menu', INITIAL_WEEKLY_MENU)
  );

  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(() =>
    loadFromLocalStorage('app_time_blocks', INITIAL_TIME_BLOCKS)
  );

  const [projects, setProjects] = useState<Project[]>(() =>
    loadFromLocalStorage('app_projects', INITIAL_PROJECTS)
  );

  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    const saved = loadFromLocalStorage<ShoppingItem[] | null>('app_shopping_list', null);
    if (saved && saved.length > 0) return saved;
    return generateConsolidatedShoppingList(INITIAL_WEEKLY_MENU, INITIAL_INVENTORY);
  });

  const [activeTab, setActiveTab] = useState<string>('tiempo');
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [activeCommand, setActiveCommand] = useState<string | null>(null);

  // Persistence effects
  useEffect(() => saveToLocalStorage('app_tasks', tasks), [tasks]);
  useEffect(() => saveToLocalStorage('app_reminders', reminders), [reminders]);
  useEffect(() => saveToLocalStorage('app_inventory', inventory), [inventory]);
  useEffect(() => saveToLocalStorage('app_weekly_menu', weeklyMenu), [weeklyMenu]);
  useEffect(() => saveToLocalStorage('app_time_blocks', timeBlocks), [timeBlocks]);
  useEffect(() => saveToLocalStorage('app_projects', projects), [projects]);
  useEffect(() => saveToLocalStorage('app_shopping_list', shoppingList), [shoppingList]);

  // Regeneration of shopping list crossing Menu + Lacking Inventory
  const handleRegenerateShoppingList = () => {
    const fresh = generateConsolidatedShoppingList(weeklyMenu, inventory);
    setShoppingList(fresh);
  };

  // Triggering activation commands
  const handleExecuteCommand = (cmd: string) => {
    setActiveCommand(cmd);
    setIsConsoleOpen(true);

    // Map command to respective view
    if (cmd === 'Planificar día') setActiveTab('tiempo');
    if (cmd === 'Mis recordatorios') setActiveTab('recordatorios');
    if (cmd === 'Estado de inventario') setActiveTab('inventario');
    if (cmd === 'Menú semanal') setActiveTab('menu');
    if (cmd === 'Generar lista de compras') {
      handleRegenerateShoppingList();
      setActiveTab('compras');
    }
  };

  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const activeAlertsCount = reminders.filter((r) => r.isAlertActive && r.status === 'Pendiente').length;
  const lowStockCount = inventory.filter((i) => i.stockStatus !== 'Suficiente').length;

  const navTabs = [
    { id: 'tiempo', label: 'Cronograma & Proyectos', icon: CalendarClock, area: 'Área 4' },
    { id: 'recordatorios', label: 'Tareas & Recordatorios', icon: BellRing, badge: activeAlertsCount, area: 'Área 1' },
    { id: 'inventario', label: 'Inventario del Hogar', icon: PackageSearch, badge: lowStockCount, area: 'Área 2' },
    { id: 'menu', label: 'Menú Semanal (7 Días)', icon: UtensilsCrossed, area: 'Área 3' },
    { id: 'compras', label: 'Lista de Compras', icon: ShoppingCart, badge: shoppingList.filter((i) => !i.isPurchased).length, area: 'Consolidado' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] text-slate-100 selection:bg-amber-400 selection:text-slate-950">
      {/* Persistent Global Header with Activation Commands */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExecuteCommand={handleExecuteCommand}
        pendingTasksCount={pendingTasksCount}
        activeAlertsCount={activeAlertsCount}
        lowStockCount={lowStockCount}
        openConsole={() => {
          setActiveCommand(null);
          setIsConsoleOpen(true);
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-12 space-y-5 sm:space-y-6">
        {/* Unified Top Navigation Bar (Mobile & Desktop) - Positioned at the Top */}
        <nav className="sticky top-[108px] sm:top-[115px] z-20 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 shadow-lg flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[125px] sm:min-w-[160px] flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-xs border border-amber-500/40 ring-1 ring-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="truncate">{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* View Switcher Container */}
        <div className="transition-all duration-150">
          {activeTab === 'tiempo' && (
            <TimeBlocksView
              timeBlocks={timeBlocks}
              setTimeBlocks={setTimeBlocks}
              projects={projects}
              setProjects={setProjects}
              onTriggerCommand={handleExecuteCommand}
            />
          )}

          {activeTab === 'recordatorios' && (
            <ProductivityView
              tasks={tasks}
              setTasks={setTasks}
              reminders={reminders}
              setReminders={setReminders}
              onTriggerCommand={handleExecuteCommand}
            />
          )}

          {activeTab === 'inventario' && (
            <InventoryView
              inventory={inventory}
              setInventory={setInventory}
              onTriggerCommand={handleExecuteCommand}
              onNavigateToShopping={() => {
                handleRegenerateShoppingList();
                setActiveTab('compras');
              }}
            />
          )}

          {activeTab === 'menu' && (
            <WeeklyMenuView
              menu={weeklyMenu}
              setMenu={setWeeklyMenu}
              onTriggerCommand={handleExecuteCommand}
              onNavigateToShopping={() => {
                handleRegenerateShoppingList();
                setActiveTab('compras');
              }}
            />
          )}

          {activeTab === 'compras' && (
            <ShoppingListView
              shoppingList={shoppingList}
              setShoppingList={setShoppingList}
              onRegenerateList={handleRegenerateShoppingList}
              onTriggerCommand={handleExecuteCommand}
            />
          )}
        </div>
      </main>

      {/* Floating Assistant Trigger for quick access */}
      <button
        onClick={() => {
          setActiveCommand(null);
          setIsConsoleOpen(true);
        }}
        className="fixed bottom-6 right-4 sm:right-6 z-40 px-4 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold transition-transform hover:scale-105 active:scale-95 border border-amber-300/40"
      >
        <div className="w-6 h-6 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center font-bold">
          <Bot className="w-3.5 h-3.5" />
        </div>
        <span>Asistente</span>
        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
      </button>

      {/* Executive Assistant Console Modal */}
      <ExecutiveConsoleModal
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
        currentCommand={activeCommand}
        tasks={tasks}
        reminders={reminders}
        inventory={inventory}
        menu={weeklyMenu}
        timeBlocks={timeBlocks}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onRefreshShoppingList={handleRegenerateShoppingList}
        onAddReminder={(newReminder) => {
          const reminder: Reminder = {
            id: `rem-${Date.now()}`,
            ...newReminder,
            status: 'Pendiente',
            isAlertActive: true,
          };
          setReminders((prev) => [reminder, ...prev]);
        }}
        onAddShoppingItem={(newItem) => {
          const item: ShoppingItem = {
            id: `shop-${Date.now()}`,
            ...newItem,
            isPurchased: false,
          };
          setShoppingList((prev) => [item, ...prev]);
        }}
        onAddTask={(newTask) => {
          const task: Task = {
            id: `task-${Date.now()}`,
            ...newTask,
            completed: false,
          };
          setTasks((prev) => [task, ...prev]);
        }}
      />
    </div>
  );
}
