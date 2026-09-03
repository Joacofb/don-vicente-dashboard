export interface SavedItem {
  id: string;
  name: string;
  type: 'sale' | 'expense' | 'both';
  category?: string;
  usageCount: number;
  lastUsed: string;
}

export const SAVED_CONCEPTS_STORAGE_KEY = 'fin_control_saved_concepts_v1';
export const SAVED_ENTITIES_STORAGE_KEY = 'fin_control_saved_entities_v1';

// Conceptos iniciales predeterminados frecuentes
export const DEFAULT_SAVED_CONCEPTS: SavedItem[] = [
  // Ventas / Ingresos
  { id: 'c-1', name: 'Venta mostrador consumidor final', type: 'sale', usageCount: 15, lastUsed: new Date().toISOString() },
  { id: 'c-2', name: 'Cobro de factura / remito', type: 'sale', usageCount: 12, lastUsed: new Date().toISOString() },
  { id: 'c-3', name: 'Venta por catálogo y tienda online', type: 'sale', usageCount: 10, lastUsed: new Date().toISOString() },
  { id: 'c-4', name: 'Servicio de mantenimiento mensual', type: 'sale', usageCount: 8, lastUsed: new Date().toISOString() },
  { id: 'c-5', name: 'Venta mayorista de mercadería', type: 'sale', usageCount: 6, lastUsed: new Date().toISOString() },
  { id: 'c-6', name: 'Comisión por intermediación', type: 'sale', usageCount: 4, lastUsed: new Date().toISOString() },
  // Gastos / Egresos
  { id: 'c-7', name: 'Compra de materia prima e insumos', type: 'expense', usageCount: 14, lastUsed: new Date().toISOString() },
  { id: 'c-8', name: 'Alquiler del local comercial', type: 'expense', usageCount: 10, lastUsed: new Date().toISOString() },
  { id: 'c-9', name: 'Pago de servicios básicos (Luz/Internet/Agua)', type: 'expense', usageCount: 9, lastUsed: new Date().toISOString() },
  { id: 'c-10', name: 'Pago de fletes y logística de envíos', type: 'expense', usageCount: 7, lastUsed: new Date().toISOString() },
  { id: 'c-11', name: 'Pago de honorarios y sueldos', type: 'expense', usageCount: 6, lastUsed: new Date().toISOString() },
  { id: 'c-12', name: 'Publicidad en redes y marketing', type: 'expense', usageCount: 5, lastUsed: new Date().toISOString() },
  { id: 'c-13', name: 'Gastos menores de librería y limpieza', type: 'expense', usageCount: 4, lastUsed: new Date().toISOString() },
];

// Clientes y Proveedores iniciales
export const DEFAULT_SAVED_ENTITIES: SavedItem[] = [
  { id: 'e-1', name: 'Clientes varios / Mostrador', type: 'sale', usageCount: 20, lastUsed: new Date().toISOString() },
  { id: 'e-2', name: 'Distribuidora Central S.A.', type: 'both', usageCount: 14, lastUsed: new Date().toISOString() },
  { id: 'e-3', name: 'Empresa Alfa S.A.', type: 'sale', usageCount: 10, lastUsed: new Date().toISOString() },
  { id: 'e-4', name: 'Mensajería Express Logística', type: 'expense', usageCount: 8, lastUsed: new Date().toISOString() },
  { id: 'e-5', name: 'Inmobiliaria Los Álamos', type: 'expense', usageCount: 6, lastUsed: new Date().toISOString() },
  { id: 'e-6', name: 'Tienda Digital / E-commerce', type: 'sale', usageCount: 5, lastUsed: new Date().toISOString() },
  { id: 'e-7', name: 'Papelera e Imprenta San Martín', type: 'expense', usageCount: 4, lastUsed: new Date().toISOString() },
];

/**
 * Obtiene lista de conceptos guardados
 */
export function getStoredConcepts(): SavedItem[] {
  try {
    const saved = localStorage.getItem(SAVED_CONCEPTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading saved concepts:', e);
  }
  return DEFAULT_SAVED_CONCEPTS;
}

/**
 * Guarda conceptos
 */
export function saveStoredConcepts(items: SavedItem[]): void {
  try {
    localStorage.setItem(SAVED_CONCEPTS_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving concepts:', e);
  }
}

/**
 * Obtiene lista de clientes/proveedores guardados
 */
export function getStoredEntities(): SavedItem[] {
  try {
    const saved = localStorage.getItem(SAVED_ENTITIES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading saved entities:', e);
  }
  return DEFAULT_SAVED_ENTITIES;
}

/**
 * Guarda clientes/proveedores
 */
export function saveStoredEntities(items: SavedItem[]): void {
  try {
    localStorage.setItem(SAVED_ENTITIES_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving entities:', e);
  }
}

/**
 * Registra o actualiza el contador de uso de un concepto
 */
export function recordConceptUsage(name: string, type: 'sale' | 'expense'): SavedItem[] {
  const trimmed = name.trim();
  if (!trimmed) return getStoredConcepts();

  const current = getStoredConcepts();
  const existingIdx = current.findIndex(c => c.name.toLowerCase() === trimmed.toLowerCase());

  let updated: SavedItem[];
  if (existingIdx >= 0) {
    const item = current[existingIdx];
    const newType = item.type === type ? item.type : 'both';
    const updatedItem: SavedItem = {
      ...item,
      type: newType,
      usageCount: (item.usageCount || 1) + 1,
      lastUsed: new Date().toISOString(),
    };
    updated = [...current];
    updated[existingIdx] = updatedItem;
  } else {
    const newItem: SavedItem = {
      id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      type,
      usageCount: 1,
      lastUsed: new Date().toISOString(),
    };
    updated = [newItem, ...current];
  }

  // Ordenar por uso descendente
  updated.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  saveStoredConcepts(updated);
  return updated;
}

/**
 * Registra o actualiza el contador de uso de un cliente/proveedor
 */
export function recordEntityUsage(name: string, type: 'sale' | 'expense'): SavedItem[] {
  const trimmed = name.trim();
  if (!trimmed) return getStoredEntities();

  const current = getStoredEntities();
  const existingIdx = current.findIndex(e => e.name.toLowerCase() === trimmed.toLowerCase());

  let updated: SavedItem[];
  if (existingIdx >= 0) {
    const item = current[existingIdx];
    const newType = item.type === type ? item.type : 'both';
    const updatedItem: SavedItem = {
      ...item,
      type: newType,
      usageCount: (item.usageCount || 1) + 1,
      lastUsed: new Date().toISOString(),
    };
    updated = [...current];
    updated[existingIdx] = updatedItem;
  } else {
    const newItem: SavedItem = {
      id: `e-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      type,
      usageCount: 1,
      lastUsed: new Date().toISOString(),
    };
    updated = [newItem, ...current];
  }

  updated.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
  saveStoredEntities(updated);
  return updated;
}
