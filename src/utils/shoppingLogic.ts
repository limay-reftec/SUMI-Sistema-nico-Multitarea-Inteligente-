import { DayMenu, InventoryItem, ShoppingItem, StoreCategory } from '../types';

// Classification dictionary for rapid accurate mapping to trade categories
const VERDULERIA_KEYWORDS = [
  'tomate', 'cebolla', 'papa', 'palta', 'aguacate', 'espinaca', 'rúcula', 'rucula',
  'brócoli', 'brocoli', 'plátano', 'platano', 'banana', 'manzana', 'pera', 'limón',
  'limon', 'morrón', 'morron', 'pimiento', 'zanahoria', 'calabaza', 'zapallo',
  'champiñón', 'champinon', 'hongo', 'arándano', 'arandano', 'frutos rojos',
  'espárrago', 'esparrago', 'coliflor', 'puerro', 'albahaca', 'naranja', 'frutilla',
  'fresa', 'lechuga', 'ciboulette', 'hierba', 'vegetal', 'verdura', 'fruta'
];

const REFRIGERADOS_KEYWORDS = [
  'huevo', 'leche', 'yogur', 'queso', 'muzzarella', 'manteca', 'crema',
  'parmesano', 'desnatada', 'griego', 'lácteo', 'lacteo'
];

const CARNICERIA_KEYWORDS = [
  'pollo', 'pechuga', 'carne', 'ternera', 'vacuna', 'picada', 'merluza', 'pescado',
  'salmón', 'salmon', 'trucha', 'jamón', 'jamon', 'mariscos', 'langostino',
  'solomillo', 'asado', 'bife', 'filet', 'filete'
];

const LIMPIEZA_KEYWORDS = [
  'detergente', 'lavandina', 'cloro', 'desinfectante', 'jabón', 'jabon', 'bolsa',
  'papel higiénico', 'papel higienico', 'pasta dental', 'lavarropas', 'limpiador',
  'esponja', 'cepillo', 'trapo', 'suavizante', 'shampoo', 'acondicionador'
];

export function determineStoreCategory(name: string, defaultCategory?: StoreCategory): StoreCategory {
  const lower = name.toLowerCase();

  // Explicit check order
  for (const kw of LIMPIEZA_KEYWORDS) {
    if (lower.includes(kw)) return 'Limpieza';
  }
  for (const kw of CARNICERIA_KEYWORDS) {
    if (lower.includes(kw)) return 'Carnicería';
  }
  for (const kw of REFRIGERADOS_KEYWORDS) {
    if (lower.includes(kw)) return 'Refrigerados';
  }
  for (const kw of VERDULERIA_KEYWORDS) {
    if (lower.includes(kw)) return 'Verdulería';
  }

  return defaultCategory || 'Almacén';
}

/**
 * Cross weekly menu ingredients + lacking household inventory into a consolidated,
 * categorized shopping list structured strictly by commercial sectors.
 */
export function generateConsolidatedShoppingList(
  weeklyMenu: DayMenu[],
  inventory: InventoryItem[]
): ShoppingItem[] {
  const itemMap = new Map<string, ShoppingItem>();

  // 1. Process deficient inventory items (Agotado or Por agotar)
  inventory.forEach((inv) => {
    if (inv.stockStatus === 'Agotado' || inv.stockStatus === 'Por agotar' || inv.quantity < inv.minQuantity) {
      const key = inv.name.trim().toLowerCase();
      const rubro = inv.suggestedStoreCategory || determineStoreCategory(inv.name, 'Limpieza');
      const neededQty = inv.minQuantity > inv.quantity 
        ? `${inv.minQuantity - inv.quantity} ${inv.unit}` 
        : `1 ${inv.unit}`;

      itemMap.set(key, {
        id: `shop-inv-${inv.id}`,
        name: inv.name,
        rubro: rubro,
        quantity: neededQty,
        source: 'Inventario',
        sourceDetail: `Stock ${inv.stockStatus.toLowerCase()} (${inv.quantity} ${inv.unit})`,
        isPurchased: false,
        urgency: inv.urgency,
      });
    }
  });

  // 2. Process ingredients from the 7-day weekly menu
  weeklyMenu.forEach((dayMenu) => {
    const meals = [
      { meal: dayMenu.desayuno, label: `${dayMenu.day} Desayuno` },
      { meal: dayMenu.almuerzo, label: `${dayMenu.day} Almuerzo` },
      { meal: dayMenu.merienda, label: `${dayMenu.day} Merienda` },
      { meal: dayMenu.cena, label: `${dayMenu.day} Cena` },
    ];

    meals.forEach(({ meal, label }) => {
      meal.ingredients.forEach((ingredient) => {
        const cleanName = ingredient.trim();
        const key = cleanName.toLowerCase();

        if (itemMap.has(key)) {
          const existing = itemMap.get(key)!;
          if (!existing.sourceDetail?.includes(label)) {
            existing.sourceDetail = existing.sourceDetail 
              ? `${existing.sourceDetail}, ${label}` 
              : label;
          }
          if (existing.source === 'Inventario') {
            existing.sourceDetail += ` (Requerido para ${label})`;
          }
        } else {
          const rubro = determineStoreCategory(cleanName);
          itemMap.set(key, {
            id: `shop-menu-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: cleanName,
            rubro: rubro,
            quantity: 'Para menú semanal',
            source: 'Menú',
            sourceDetail: `${label} (${meal.name})`,
            isPurchased: false,
            urgency: 'Normal',
          });
        }
      });
    });
  });

  // Convert to array and sort by standard trade path
  const rubroPriority: Record<StoreCategory, number> = {
    Verdulería: 1,
    Carnicería: 2,
    Refrigerados: 3,
    Almacén: 4,
    Limpieza: 5,
  };

  return Array.from(itemMap.values()).sort((a, b) => {
    const diff = rubroPriority[a.rubro] - rubroPriority[b.rubro];
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
}
