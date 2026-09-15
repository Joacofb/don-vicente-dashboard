import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Tag, 
  CreditCard, 
  User, 
  FileText, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  Bookmark,
  Building2,
  Upload,
  ChevronDown,
  Edit3,
  Clock,
  Repeat,
  MessageSquare,
  Eye
} from 'lucide-react';
import { 
  FinancialRecord, 
  TransactionType, 
  PaymentMethod, 
  DEFAULT_SALE_CATEGORIES, 
  DEFAULT_EXPENSE_CATEGORIES, 
  PAYMENT_METHODS,
  AppUser
} from '../types';
import { SavedItem } from '../data/savedItemsData';
import { getTodayString, formatDateISO, parseDate, formatDisplayDate } from '../utils/dateUtils';
import { formatCurrency, generateWeeklyReport } from '../utils/financeUtils';

export interface DirectTransferPayload {
  concept: string;
  amount: number;
  date: string;
  clientName: string;
  providerName: string;
  notes?: string;
}

interface DataEntryFormProps {
  onAddRecord: (record: Omit<FinancialRecord, 'id' | 'createdAt'>) => void;
  onAddDirectTransfer?: (payload: DirectTransferPayload) => void | Promise<void>;
  onOpenInquiry?: (record: FinancialRecord) => void;
  currencySymbol: string;
  recentRecords: FinancialRecord[];
  onDeleteRecord: (id: string) => void;
  onEditRecord?: (record: FinancialRecord) => void;
  onViewRecord?: (record: FinancialRecord) => void;
  currentUser: AppUser;
  savedConcepts?: SavedItem[];
  savedEntities?: SavedItem[];
  onRecordConcept?: (name: string, type: 'sale' | 'expense' | 'both') => void;
  onRecordEntity?: (name: string, type: 'sale' | 'expense' | 'both') => void;
  onOpenCatalogModal: () => void;
  onOpenImportModal: () => void;
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({
  onAddRecord,
  onAddDirectTransfer,
  onOpenInquiry,
  currencySymbol,
  recentRecords = [],
  onDeleteRecord,
  onEditRecord,
  onViewRecord,
  currentUser,
  savedConcepts = [],
  savedEntities = [],
  onRecordConcept,
  onRecordEntity,
  onOpenCatalogModal,
  onOpenImportModal,
}) => {
  const [entryMode, setEntryMode] = useState<'sale' | 'expense' | 'transfer'>('sale');
  const [type, setType] = useState<TransactionType>('sale');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayString());
  const [category, setCategory] = useState<string>(DEFAULT_SALE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [description, setDescription] = useState<string>('');
  const [entityName, setEntityName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [lastAddedAmount, setLastAddedAmount] = useState<number | null>(null);
  const [showConceptSuggestions, setShowConceptSuggestions] = useState<boolean>(false);
  const [showEntitySuggestions, setShowEntitySuggestions] = useState<boolean>(false);

  // Estados específicos para Transferencia Directa (Cliente -> Proveedor)
  const [transferClientName, setTransferClientName] = useState<string>('');
  const [transferProviderName, setTransferProviderName] = useState<string>('');
  const [showTransferClientSuggestions, setShowTransferClientSuggestions] = useState<boolean>(false);
  const [showTransferProviderSuggestions, setShowTransferProviderSuggestions] = useState<boolean>(false);

  const isAdmin = currentUser.role === 'admin';
  const availableCategories = type === 'sale' ? DEFAULT_SALE_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  const safeConcepts = savedConcepts || [];
  const safeEntities = savedEntities || [];

  // Filtrar sugerencias relevantes para el tipo actual
  const relevantConcepts = safeConcepts
    .filter(c => c && (c.type === 'both' || c.type === (entryMode === 'transfer' ? 'both' : type)))
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

  const relevantEntities = safeEntities
    .filter(e => e && (e.type === 'both' || e.type === type))
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

  // Entidades para transferencias directas
  const clientEntities = safeEntities
    .filter(e => e && (e.type === 'both' || e.type === 'sale'))
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

  const providerEntities = safeEntities
    .filter(e => e && (e.type === 'both' || e.type === 'expense'))
    .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

  // Filtrar según lo que el usuario va escribiendo
  const filteredConcepts = relevantConcepts.filter(c => 
    c && (!description.trim() || c.name.toLowerCase().includes(description.toLowerCase()))
  );

  const filteredEntities = relevantEntities.filter(e => 
    e && (!entityName.trim() || e.name.toLowerCase().includes(entityName.toLowerCase()))
  );

  const filteredTransferClients = clientEntities.filter(e =>
    e && (!transferClientName.trim() || e.name.toLowerCase().includes(transferClientName.toLowerCase()))
  );

  const filteredTransferProviders = providerEntities.filter(e =>
    e && (!transferProviderName.trim() || e.name.toLowerCase().includes(transferProviderName.toLowerCase()))
  );

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(newType === 'sale' ? DEFAULT_SALE_CATEGORIES[0] : DEFAULT_EXPENSE_CATEGORIES[0]);
    setIsAddingCustomCategory(false);
  };

  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    setDate(formatDateISO(d));
  };

  const handleAddQuickAmount = (val: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    // FLUJO ESPECIAL: Transferencia Directa (Cliente -> Proveedor)
    if (entryMode === 'transfer') {
      const trimmedClient = transferClientName.trim();
      const trimmedProvider = transferProviderName.trim();
      if (!trimmedClient || !trimmedProvider) {
        return;
      }

      const trimmedDesc = description.trim();

      if (onRecordEntity) {
        onRecordEntity(trimmedClient, 'sale');
        onRecordEntity(trimmedProvider, 'expense');
      }
      if (trimmedDesc && onRecordConcept) {
        onRecordConcept(trimmedDesc, 'both');
      }

      if (onAddDirectTransfer) {
        onAddDirectTransfer({
          concept: trimmedDesc || `Transferencia de ${trimmedClient} a ${trimmedProvider}`,
          amount: numAmount,
          date,
          clientName: trimmedClient,
          providerName: trimmedProvider,
          notes: notes.trim() || undefined,
        });
      } else {
        // Fallback en caso de no proveer handler específico
        const transferGroupId = `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        onAddRecord({
          type: 'sale',
          amount: numAmount,
          date,
          category: 'Transferencia Directa',
          paymentMethod: 'direct_transfer',
          description: trimmedDesc ? `[Transferencia] ${trimmedDesc} (Cliente: ${trimmedClient})` : `Transferencia de ${trimmedClient} hacia ${trimmedProvider}`,
          entityName: trimmedClient,
          linkedEntityName: trimmedProvider,
          transferGroupId,
          transferRole: 'origin_sale',
          notes: notes.trim() || undefined,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
        });
        onAddRecord({
          type: 'expense',
          amount: numAmount,
          date,
          category: 'Transferencia Directa',
          paymentMethod: 'direct_transfer',
          description: trimmedDesc ? `[Transferencia] ${trimmedDesc} (Proveedor: ${trimmedProvider})` : `Transferencia hacia ${trimmedProvider} desde ${trimmedClient}`,
          entityName: trimmedProvider,
          linkedEntityName: trimmedClient,
          transferGroupId,
          transferRole: 'destination_expense',
          notes: notes.trim() || undefined,
          createdBy: currentUser.id,
          createdByName: currentUser.name,
        });
      }

      setLastAddedAmount(numAmount);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);

      setAmount('');
      setDescription('');
      setTransferClientName('');
      setTransferProviderName('');
      setNotes('');
      setShowConceptSuggestions(false);
      setShowTransferClientSuggestions(false);
      setShowTransferProviderSuggestions(false);
      return;
    }

    const finalCategory = isAddingCustomCategory && customCategory.trim() 
      ? customCategory.trim() 
      : category;

    const trimmedDesc = description.trim();
    const trimmedEntity = entityName.trim();

    // Guardar en catálogo de reutilizables para futuro autocompletado y filtros
    if (trimmedDesc && onRecordConcept) {
      onRecordConcept(trimmedDesc, type);
    }
    if (trimmedEntity && onRecordEntity) {
      onRecordEntity(trimmedEntity, type);
    }

    onAddRecord({
      type,
      amount: numAmount,
      date,
      category: finalCategory,
      paymentMethod,
      description: trimmedDesc,
      entityName: trimmedEntity || undefined,
      notes: notes.trim() || undefined,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      reviewStatus: 'sin_asignar',
    });

    setLastAddedAmount(numAmount);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);

    setAmount('');
    setDescription('');
    setEntityName('');
    setNotes('');
    setCustomCategory('');
    setIsAddingCustomCategory(false);
    setShowConceptSuggestions(false);
    setShowEntitySuggestions(false);
  };

  // Cálculo de la semana activa para el card superior derecho
  const weeklyReport = generateWeeklyReport(recentRecords, date);
  const totalSales = weeklyReport.totalSales;
  const totalExpenses = weeklyReport.totalExpenses;
  const weeklyBalance = weeklyReport.netFlow;

  // Resumen del día seleccionado
  const dayRecords = recentRecords.filter(r => r.date === date);

  // Datos para el mini gráfico semanal
  const maxBarValue = Math.max(
    ...weeklyReport.dailyBreakdown.map(d => Math.max(d.sales, d.expenses)),
    50
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Columna Izquierda: Formulario Principal "Sleek" */}
      <div className="lg:col-span-7 flex flex-col">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between flex-1">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fila 1: Título del Formulario, Badge de Usuario y Botón Importar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Nueva Entrada de Datos</h2>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
                    isAdmin 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentUser.avatarColor}`} />
                    {currentUser.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Control diario de ventas e ingresos vs gastos operativos</p>
              </div>

              {/* Botón Importar */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onOpenImportModal}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Importar historial antiguo desde archivo Excel o CSV"
                >
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                  <span>Importar</span>
                </button>
              </div>
            </div>

            {/* Fila 2: Selector Segmentado de Tipo de Registro (Ingreso / Gasto / Transferencia Directa) */}
            <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <button
                  type="button"
                  id="btn-select-sale"
                  onClick={() => {
                    setEntryMode('sale');
                    handleTypeChange('sale');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryMode === 'sale'
                      ? 'bg-white shadow-xs text-emerald-700 border border-emerald-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${entryMode === 'sale' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <span>Ingreso / Venta</span>
                </button>

                <button
                  type="button"
                  id="btn-select-expense"
                  onClick={() => {
                    setEntryMode('expense');
                    handleTypeChange('expense');
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryMode === 'expense'
                      ? 'bg-white shadow-xs text-rose-700 border border-rose-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${entryMode === 'expense' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-500'}`}>
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  </div>
                  <span>Gasto / Salida</span>
                </button>

                <button
                  type="button"
                  id="btn-select-transfer"
                  onClick={() => {
                    setEntryMode('transfer');
                    setIsAddingCustomCategory(false);
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    entryMode === 'transfer'
                      ? 'bg-white shadow-xs text-purple-700 border border-purple-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${entryMode === 'transfer' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'}`}>
                    <Repeat className="w-3.5 h-3.5" />
                  </div>
                  <span>Transferencia Directa</span>
                </button>
              </div>
            </div>

            {/* Banner Informativo si está en modo Transferencia Directa */}
            {entryMode === 'transfer' && (
              <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-2xl flex items-start gap-3 text-purple-900 animate-in fade-in">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Repeat className="w-4 h-4" />
                </div>
                <div className="text-xs leading-relaxed">
                  <span className="font-bold block text-purple-950 text-xs mb-0.5">
                    Movimiento Entre Cuentas (Cliente → Proveedor)
                  </span>
                  <p className="text-purple-800/90 text-[11px]">
                    Esta acción crea en una misma operación <strong>1 Ingreso</strong> a nombre del Cliente y <strong>1 Gasto/Egreso</strong> por el mismo monto hacia el Proveedor, ambos enlazados con medio de pago <em>"Transferencia Directa"</em>. 
                    El balance global queda equilibrado (impacto neto en caja: $0.00).
                  </p>
                </div>
              </div>
            )}

            {/* Fila 1: Monto y Fecha */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Campo Monto */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Monto ({currencySymbol}) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                    {currencySymbol}
                  </span>
                  <input
                    id="input-record-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base font-bold text-slate-900 placeholder:text-slate-300"
                  />
                </div>
                {/* Accesos rápidos de monto */}
                <div className="flex gap-1.5 mt-2">
                  {[10, 50, 100, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleAddQuickAmount(val)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Campo Fecha */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Fecha del Registro *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="input-record-date"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-semibold text-slate-800"
                  />
                </div>
                {/* Atajos de Fecha */}
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setQuickDate(0)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors"
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors"
                  >
                    Ayer
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(2)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors"
                  >
                    Anteayer
                  </button>
                </div>
              </div>
            </div>

            {entryMode !== 'transfer' ? (
              <>
                {/* Fila 2: Categoría y Método de Pago */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Categoría */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Categoría
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {isAddingCustomCategory ? 'Usar lista' : '+ Nueva categoría'}
                  </button>
                </div>

                {isAddingCustomCategory ? (
                  <input
                    type="text"
                    required
                    placeholder="Escribe la nueva categoría..."
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-blue-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  />
                ) : (
                  <select
                    id="select-record-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-800 bg-white cursor-pointer"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Método de Pago */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Método de Pago
                </label>
                <select
                  id="select-payment-method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-800 bg-white cursor-pointer"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Fila 3: Concepto / Descripción con Catálogo y Autocompletado */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Concepto / Descripción</span>
                  <span className="text-slate-400 font-normal lowercase">(reutilizable)</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenCatalogModal}
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Ver y administrar conceptos guardados"
                >
                  <Bookmark className="w-3 h-3" />
                  <span>Ver Catálogo ({safeConcepts.length})</span>
                </button>
              </div>

              <div className="relative">
                <input
                  id="input-record-description"
                  type="text"
                  placeholder={type === 'sale' ? 'Ej: Venta mayorista lote #1, Cobro de factura...' : 'Ej: Pago de alquiler local, Compra de insumos...'}
                  value={description}
                  onFocus={() => setShowConceptSuggestions(true)}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setShowConceptSuggestions(true);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-800 bg-white"
                />

                {description && (
                  <button
                    type="button"
                    onClick={() => setDescription('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded-md hover:bg-slate-100"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sugerencias Rápidas Populares (Chips debajo del input) */}
              {relevantConcepts.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Bookmark className="w-2.5 h-2.5" /> Frecuentes:
                  </span>
                  {relevantConcepts.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setDescription(c.name);
                        setShowConceptSuggestions(false);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                        description === c.name
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200/80 hover:border-blue-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Dropdown flotante si escribe o hace foco */}
              {showConceptSuggestions && filteredConcepts.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowConceptSuggestions(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-52 overflow-y-auto p-1.5 animate-in fade-in">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Sugerencias Guardadas
                    </div>
                    {filteredConcepts.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setDescription(item.name);
                          setShowConceptSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-blue-50 hover:text-blue-800 text-slate-800 rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-normal">
                          {item.usageCount > 1 ? `${item.usageCount} usos` : 'Guardado'}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Fila 4: Cliente/Proveedor y Notas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Cliente / Proveedor con Autocompletado */}
              <div className="relative">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{type === 'sale' ? 'Cliente / Pagador' : 'Proveedor / Receptor'}</span>
                  </label>
                  <button
                    type="button"
                    onClick={onOpenCatalogModal}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    title="Administrar catálogo"
                  >
                    <span>Catálogo ({safeEntities.length})</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder={type === 'sale' ? 'Nombre del cliente o empresa...' : 'Nombre del proveedor...'}
                    value={entityName}
                    onFocus={() => setShowEntitySuggestions(true)}
                    onChange={(e) => {
                      setEntityName(e.target.value);
                      setShowEntitySuggestions(true);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-800 bg-white"
                  />
                  {entityName && (
                    <button
                      type="button"
                      onClick={() => setEntityName('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded-md hover:bg-slate-100"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Chips de clientes frecuentes */}
                {relevantEntities.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="w-2.5 h-2.5" /> Frecuentes:
                    </span>
                    {relevantEntities.slice(0, 3).map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setEntityName(e.name);
                          setShowEntitySuggestions(false);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                          entityName === e.name
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border-slate-200/80 hover:border-blue-200'
                        }`}
                      >
                        {e.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Dropdown flotante para clientes */}
                {showEntitySuggestions && filteredEntities.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowEntitySuggestions(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-52 overflow-y-auto p-1.5 animate-in fade-in">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        {type === 'sale' ? 'Clientes Frecuentes' : 'Proveedores Frecuentes'}
                      </div>
                      {filteredEntities.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setEntityName(item.name);
                            setShowEntitySuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-blue-50 hover:text-blue-800 text-slate-800 rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
                        >
                          <span className="truncate">{item.name}</span>
                          <span className="text-[10px] text-slate-400 group-hover:text-blue-600 font-normal">
                            {item.usageCount > 1 ? `${item.usageCount} usos` : 'Guardado'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Notas Adicionales (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="# comprobante, factura o ref..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Botón de Guardar en la Base */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-submit-record"
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-base hover:bg-slate-800 active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>Registrar Transacción</span>
              </button>
            </div>
          </>
        ) : (
          /* MODO TRANSFERENCIA DIRECTA (CLIENTE -> PROVEEDOR) */
          <div className="space-y-6 animate-in fade-in">
            {/* Concepto General */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>Concepto General / Motivo</span>
                  <span className="text-slate-400 font-normal lowercase">(compartido)</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenCatalogModal}
                  className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Bookmark className="w-3 h-3" />
                  <span>Ver Catálogo</span>
                </button>
              </div>

              <div className="relative">
                <input
                  id="input-transfer-description"
                  type="text"
                  placeholder="Ej: Pago directo de factura, Liquidación de insumos por cuenta de terceros..."
                  value={description}
                  onFocus={() => setShowConceptSuggestions(true)}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setShowConceptSuggestions(true);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium text-slate-800 bg-white"
                />
                {description && (
                  <button
                    type="button"
                    onClick={() => setDescription('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded-md hover:bg-slate-100"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sugerencias Rápidas de Conceptos */}
              {relevantConcepts.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-purple-500" /> Sugeridos:
                  </span>
                  {relevantConcepts.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setDescription(c.name);
                        setShowConceptSuggestions(false);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                        description === c.name 
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs' 
                          : 'bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border-slate-200/80 hover:border-purple-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Dropdown sugerencias concepto */}
              {showConceptSuggestions && filteredConcepts.length > 0 && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowConceptSuggestions(false)} />
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-52 overflow-y-auto p-1.5 animate-in fade-in">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      Conceptos Registrados
                    </div>
                    {filteredConcepts.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setDescription(item.name);
                          setShowConceptSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-purple-50 hover:text-purple-800 text-slate-800 rounded-xl transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <span className="truncate">{item.name}</span>
                        <span className="text-[10px] text-slate-400 group-hover:text-purple-600 font-normal">
                          {item.usageCount > 1 ? `${item.usageCount} usos` : 'Guardado'}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Cliente Origen y Proveedor Destino */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* CLIENTE (ORIGEN) */}
              <div className="relative">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 font-bold">Cliente (Origen / Ingreso) *</span>
                </label>

                <div className="relative">
                  <input
                    id="input-transfer-client"
                    type="text"
                    required
                    placeholder="Nombre del Cliente pagador..."
                    value={transferClientName}
                    onFocus={() => setShowTransferClientSuggestions(true)}
                    onChange={(e) => {
                      setTransferClientName(e.target.value);
                      setShowTransferClientSuggestions(true);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-emerald-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium text-slate-800 bg-white"
                  />
                  {transferClientName && (
                    <button
                      type="button"
                      onClick={() => setTransferClientName('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded-md hover:bg-slate-100"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Chips clientes frecuentes */}
                {clientEntities.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Clientes:
                    </span>
                    {clientEntities.slice(0, 3).map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setTransferClientName(e.name);
                          setShowTransferClientSuggestions(false);
                        }}
                        className={`px-2 py-0.8 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                          transferClientName === e.name
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200/80'
                        }`}
                      >
                        {e.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Dropdown clientes */}
                {showTransferClientSuggestions && filteredTransferClients.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTransferClientSuggestions(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto p-1.5 animate-in fade-in">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        Clientes Registrados
                      </div>
                      {filteredTransferClients.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setTransferClientName(item.name);
                            setShowTransferClientSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-800 text-slate-800 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* PROVEEDOR (DESTINO) */}
              <div className="relative">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-rose-700 font-bold">Proveedor (Destino / Egreso) *</span>
                </label>

                <div className="relative">
                  <input
                    id="input-transfer-provider"
                    type="text"
                    required
                    placeholder="Nombre del Proveedor receptor..."
                    value={transferProviderName}
                    onFocus={() => setShowTransferProviderSuggestions(true)}
                    onChange={(e) => {
                      setTransferProviderName(e.target.value);
                      setShowTransferProviderSuggestions(true);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-rose-200 focus:ring-2 focus:ring-rose-500 outline-none text-sm font-medium text-slate-800 bg-white"
                  />
                  {transferProviderName && (
                    <button
                      type="button"
                      onClick={() => setTransferProviderName('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded-md hover:bg-slate-100"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Chips proveedores frecuentes */}
                {providerEntities.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      Proveedores:
                    </span>
                    {providerEntities.slice(0, 3).map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => {
                          setTransferProviderName(e.name);
                          setShowTransferProviderSuggestions(false);
                        }}
                        className={`px-2 py-0.8 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                          transferProviderName === e.name
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-slate-50 hover:bg-rose-50 text-slate-700 border-slate-200/80'
                        }`}
                      >
                        {e.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Dropdown proveedores */}
                {showTransferProviderSuggestions && filteredTransferProviders.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowTransferProviderSuggestions(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 max-h-48 overflow-y-auto p-1.5 animate-in fade-in">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        Proveedores Registrados
                      </div>
                      {filteredTransferProviders.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setTransferProviderName(item.name);
                            setShowTransferProviderSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold hover:bg-rose-50 hover:text-rose-800 text-slate-800 rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                        >
                          <span className="truncate">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notas Adicionales */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Notas o Referencia de Transferencia (Opcional)
              </label>
              <input
                type="text"
                placeholder="# comprobante, ref bancaria o notas..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none text-sm font-medium text-slate-800"
              />
            </div>

            {/* Botón de Guardar Transferencia Directa */}
            <div className="pt-2">
              <button
                type="submit"
                id="btn-submit-transfer"
                className="w-full bg-purple-700 text-white py-4 rounded-2xl font-bold text-base hover:bg-purple-800 active:scale-[0.99] transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Repeat className="w-5 h-5" />
                <span>Registrar Transferencia Directa (2 Movimientos Vinculados)</span>
              </button>
            </div>
          </div>
        )}
          </form>

          {/* Toast de Éxito */}
          {showSuccessToast && (
            <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold">¡Guardado con éxito! </span>
                Movimiento por {lastAddedAmount ? formatCurrency(lastAddedAmount, currencySymbol) : ''} registrado en la base de datos.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Columna Derecha: Tarjetas del Tema Sleek */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Tarjeta Azul Eléctrico (Hero Balance Card) */}
        <div className="bg-blue-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col justify-between relative overflow-hidden">
          {/* Fondo sutil decorativo */}
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-blue-100 text-xs sm:text-sm font-semibold uppercase tracking-wider">
                Balance Semanal
              </span>
              <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full text-white backdrop-blur-xs">
                {weeklyReport.formattedRange}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-6">
              {formatCurrency(weeklyBalance, currencySymbol)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5 sm:gap-4 relative z-10">
            <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1.5 text-blue-100 text-xs mb-1">
                <ArrowUpRight className="w-4 h-4 text-emerald-300" />
                <span className="font-medium">Ventas</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-white">
                {formatCurrency(totalSales, currencySymbol)}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/10">
              <div className="flex items-center gap-1.5 text-blue-100 text-xs mb-1">
                <ArrowDownRight className="w-4 h-4 text-rose-300" />
                <span className="font-medium">Gastos</span>
              </div>
              <div className="text-base sm:text-lg font-bold text-white">
                {formatCurrency(totalExpenses, currencySymbol)}
              </div>
            </div>
          </div>
        </div>

        {/* Tarjeta de Flujo Financiero con Mini Gráfico Semanal */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Flujo Semanal por Día</h3>
              <p className="text-xs text-slate-500">Comparativa diaria de ventas y salidas</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Ventas
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-200" /> Gastos
              </span>
            </div>
          </div>

          {/* Barras de los 7 días */}
          <div className="grid grid-cols-7 gap-2 items-end h-32 pt-4 pb-2 border-b border-slate-100">
            {weeklyReport.dailyBreakdown.map((day) => {
              const saleHeight = Math.max((day.sales / maxBarValue) * 100, 6);
              const expHeight = Math.max((day.expenses / maxBarValue) * 100, 6);
              const isToday = day.date === getTodayString();

              return (
                <div key={day.date} className="flex flex-col items-center gap-1 h-full justify-end group relative">
                  {/* Tooltip con valores */}
                  <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded-lg z-20 shadow-lg pointer-events-none whitespace-nowrap">
                    <span className="font-bold">{day.dayName}</span>
                    <span className="text-emerald-400">Ventas: {formatCurrency(day.sales, currencySymbol)}</span>
                    <span className="text-rose-400">Gastos: {formatCurrency(day.expenses, currencySymbol)}</span>
                  </div>

                  <div className="flex items-end gap-1 w-full justify-center h-24">
                    {/* Barra de Venta */}
                    <div 
                      style={{ height: `${day.sales > 0 ? saleHeight : 4}%` }} 
                      className={`w-2 sm:w-2.5 rounded-t-md transition-all ${
                        day.sales > 0 ? 'bg-blue-500 group-hover:bg-blue-600' : 'bg-slate-100'
                      }`}
                    />
                    {/* Barra de Gasto */}
                    <div 
                      style={{ height: `${day.expenses > 0 ? expHeight : 4}%` }} 
                      className={`w-2 sm:w-2.5 rounded-t-md transition-all ${
                        day.expenses > 0 ? 'bg-slate-300 group-hover:bg-slate-400' : 'bg-slate-100'
                      }`}
                    />
                  </div>

                  <span className={`text-[10px] font-bold ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                    {day.dayName.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Margen neto del periodo</span>
            <span className={`font-bold ${weeklyReport.marginPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {weeklyReport.marginPercent.toFixed(1)}% de rendimiento
            </span>
          </div>
        </div>

        {/* Movimientos del Día Seleccionado */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-sm">Movimientos del {formatDisplayDate(date, false)}</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
              {dayRecords.length}
            </span>
          </div>

          {dayRecords.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No hay movimientos registrados para esta fecha.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {dayRecords.slice(0, 5).map((r) => (
                <div 
                  key={r.id} 
                  onClick={() => onViewRecord && onViewRecord(r)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 text-xs transition-colors cursor-pointer group"
                  title="Toca para ver la información completa"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      r.type === 'sale' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {r.type === 'sale' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{r.category}</p>
                        {r.paymentMethod === 'direct_transfer' && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-md">
                            <Repeat className="w-2.5 h-2.5" /> Transferencia
                          </span>
                        )}
                      </div>
                      {r.description && <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{r.description}</p>}
                      {r.entityName && <p className="text-[9px] text-slate-400 truncate max-w-[140px]">{r.entityName}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold ${r.type === 'sale' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {r.type === 'sale' ? '+' : '-'}{formatCurrency(r.amount, currencySymbol)}
                    </span>
                    {onViewRecord && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewRecord(r);
                        }}
                        className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Ver ficha completa"
                        aria-label="Ver ficha del registro"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onOpenInquiry && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInquiry(r);
                        }}
                        className="text-slate-400 hover:text-purple-600 p-1 rounded hover:bg-purple-50 transition-colors cursor-pointer"
                        title="Enviar consulta o mensaje sobre este registro"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onEditRecord && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditRecord(r);
                        }}
                        className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Editar registro"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRecord(r.id);
                        }}
                        className="text-slate-300 hover:text-rose-500 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar registro (Solo Administrador)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
