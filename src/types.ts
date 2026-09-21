export type PriorityLevel = 'Alta' | 'Media' | 'Baja';

export type StockStatus = 'Suficiente' | 'Por agotar' | 'Agotado';

export type UrgencyLevel = 'Urgente' | 'Normal' | 'Reposición rutinaria';

export type InventoryCategory = 'Limpieza' | 'Higiene' | 'Despensa' | 'Insumos Generales';

export type StoreCategory = 'Verdulería' | 'Almacén' | 'Refrigerados' | 'Carnicería' | 'Limpieza';

export interface Task {
  id: string;
  title: string;
  priority: PriorityLevel;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  category: 'Trabajo' | 'Hogar' | 'Personal' | 'Finanzas';
  completed: boolean;
  notes?: string;
}

export interface Reminder {
  id: string;
  title: string;
  executionDate: string; // YYYY-MM-DD
  executionTime: string; // HH:mm
  priority: PriorityLevel;
  isAlertActive: boolean;
  status: 'Pendiente' | 'Completado';
  contextTag: string; // e.g., 'Compromiso Clave', 'Pago', 'Seguimiento'
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  stockStatus: StockStatus;
  urgency: UrgencyLevel;
  quantity: number;
  minQuantity: number;
  unit: string; // 'u.', 'kg', 'L', 'paq.', 'rollos'
  suggestedStoreCategory: StoreCategory;
  lastChecked?: string;
}

export interface Meal {
  name: string;
  ingredients: string[];
}

export interface DayMenu {
  day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  desayuno: Meal;
  almuerzo: Meal;
  merienda: Meal;
  cena: Meal;
}

export interface ShoppingItem {
  id: string;
  name: string;
  rubro: StoreCategory;
  quantity: string;
  source: 'Menú' | 'Inventario' | 'Manual';
  sourceDetail?: string; // e.g. "Cena Miércoles: Salmón al horno" or "Falta en despensa"
  isPurchased: boolean;
  urgency?: UrgencyLevel;
}

export interface TimeBlock {
  id: string;
  timeRange: string; // e.g. "08:00 - 09:30"
  blockName: string;
  type: 'Foco Profundo' | 'Rutina' | 'Reuniones' | 'Operativo' | 'Hogar & Alimentación' | 'Descanso';
  tasks: string[];
  priority: PriorityLevel;
  completed?: boolean;
}

export interface ProjectStep {
  id: string;
  title: string;
  timeEstimate: string;
  priority: PriorityLevel;
  suggestedTiming?: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  goal: string;
  deadline: string;
  progress: number;
  steps: ProjectStep[];
}
