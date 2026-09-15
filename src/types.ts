export type TransactionType = 'sale' | 'expense';

export type PaymentMethod = 'cash' | 'transfer' | 'direct_transfer' | 'card' | 'credit' | 'other';

export type UserRole = 'admin' | 'operator';

export type ReviewStatus = 'sin_asignar' | 'pendiente' | 'en_revision' | 'resuelto';

export interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  roleLabel: string;
  avatarColor: string; // Tailwind color class or hex
  description: string;
  pin?: string; // PIN opcional para acceso
  avatar?: string; // Inicial o avatar visual
  createdAt?: string; // Fecha y hora ISO de registro
}

export interface FinancialRecord {
  id: string;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  description: string;
  paymentMethod: PaymentMethod;
  entityName?: string; // Cliente o Proveedor
  linkedEntityName?: string; // Proveedor o Cliente contraparte en transferencias directas
  notes?: string;
  createdAt: string;
  createdBy?: string; // ID del usuario que creó el registro
  createdByName?: string; // Nombre del usuario al crear el registro
  lastEditedAt?: string; // Fecha y hora ISO de la última edición
  lastEditedBy?: string; // ID del usuario que realizó la edición
  lastEditedByName?: string; // Nombre del usuario que autorizó la edición
  editCount?: number; // Cantidad de veces que se ha modificado
  editReason?: string; // Motivo opcional de la edición
  transferGroupId?: string; // ID de agrupación para transferencias directas entre cliente y proveedor
  transferRole?: 'origin_sale' | 'destination_expense'; // Rol en la transferencia directa
  linkedRecordId?: string; // ID del registro contraparte vinculado
  // Flujo de estados de revisión y consultas
  reviewStatus?: ReviewStatus; // 'pendiente' | 'en_revision' | 'resuelto'
  lastReviewedBy?: string; // Nombre o ID del usuario que cambió el estado
  lastReviewedAt?: string; // Fecha y hora ISO de la última revisión
}

export interface RecordMessageSummary {
  concept: string;
  amount: number;
  date: string;
  type: TransactionType;
  entityName?: string;
}

export interface RecordMessage {
  id: string;
  recordId: string; // ID del registro referenciado
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  messageText: string;
  createdAt: string; // Timestamp ISO
  read: boolean;
  recordSummary?: RecordMessageSummary;
}

export interface DirectTransferPayload {
  concept: string;
  amount: number;
  date: string;
  clientName: string; // Origen (Cliente)
  providerName: string; // Destino (Proveedor)
  notes?: string;
}

export interface SaveStateInfo {
  timestamp: string; // Fecha ISO del último guardado
  savedBy: string; // Nombre del usuario que guardó o realizó la acción
  type: 'auto' | 'manual'; // Guardado automático del sistema o manual por el usuario
  recordsCount: number; // Total de transacciones guardadas
}

export interface DaySummary {
  date: string;
  dayName: string;
  formattedDate: string;
  sales: number;
  expenses: number;
  net: number;
  salesCount: number;
  expensesCount: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface ItemBreakdown {
  name: string;
  amount: number;
  percentage: number;
  count: number;
  type: TransactionType;
}

export interface ReportFilterOptions {
  periodType: 'week' | 'month' | 'all';
  selectedWeekKey: string;
  selectedMonth: string; // YYYY-MM
  concept: string; // 'all' or specific concept
  entity: string; // 'all' or specific client/provider
  category: string; // 'all' or specific category
  user: string; // 'all' or specific user ID
  type: 'all' | 'sale' | 'expense';
  searchQuery: string;
}

export interface WeeklyReport {
  weekKey: string; // e.g., "2026-W36"
  weekNumber: number;
  year: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  formattedRange: string;
  totalSales: number;
  totalExpenses: number;
  netFlow: number;
  marginPercent: number;
  salesCount: number;
  expensesCount: number;
  dailyBreakdown: DaySummary[];
  topExpenseCategories: CategoryBreakdown[];
  topSaleCategories: CategoryBreakdown[];
  previousWeekComparison?: {
    salesDiffPercent: number;
    expensesDiffPercent: number;
    netDiffPercent: number;
  };
}

export const DEFAULT_SALE_CATEGORIES = [
  'Venta de Productos',
  'Servicios Prestados',
  'Cobro de Factura',
  'Ventas en Mostrador',
  'Comisiones',
  'Otros Ingresos'
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Materia Prima / Mercadería',
  'Alquiler de Local',
  'Servicios Básicos (Luz/Agua/Internet)',
  'Sueldos y Salarios',
  'Transporte / Logística',
  'Marketing y Publicidad',
  'Mantenimiento y Reparaciones',
  'Impuestos y Tasas',
  'Gastos Menores / Varios'
];

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Efectivo' },
  { id: 'transfer', label: 'Transferencia Bancaria' },
  { id: 'direct_transfer', label: 'Transferencia Directa' },
  { id: 'card', label: 'Tarjeta (Débito/Crédito)' },
  { id: 'credit', label: 'Crédito / Cuenta Corriente' },
  { id: 'other', label: 'Otro Medio' }
];

export interface AppSettings {
  currencySymbol: string;
  businessName: string;
}
