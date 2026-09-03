import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight, 
  Percent, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Layers,
  ArrowRight,
  Lock,
  ShieldAlert,
  Users,
  Filter,
  Search,
  X,
  Building2,
  FileText,
  Tag,
  Download,
  RotateCcw
} from 'lucide-react';
import { FinancialRecord, WeeklyReport, AppUser, ItemBreakdown } from '../types';
import { generateWeeklyReport, getAvailableWeeks, formatCurrency } from '../utils/financeUtils';
import { getWeekRangeForDate, formatDateISO, getISOWeekAndYear } from '../utils/dateUtils';
import { exportToExcel, exportToCSV } from '../utils/exportUtils';

interface WeeklyReportViewProps {
  records?: FinancialRecord[];
  currencySymbol: string;
  currentUser: AppUser;
  onOpenUserModal: () => void;
  users?: AppUser[];
}

export const WeeklyReportView: React.FC<WeeklyReportViewProps> = ({
  records = [],
  currencySymbol,
  currentUser,
  onOpenUserModal,
  users = [],
}) => {
  const safeRecords = records || [];
  const isAdmin = currentUser.role === 'admin';

  const availableWeeks = getAvailableWeeks(safeRecords);
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(
    availableWeeks[0]?.weekKey || ''
  );

  // Period mode filter
  const [periodMode, setPeriodMode] = useState<'week' | 'all'>('week');

  // Specific Filters
  const [filterConcept, setFilterConcept] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFiltersBar, setShowFiltersBar] = useState<boolean>(true);

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center max-w-2xl mx-auto my-8 space-y-6">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5" />
            Acceso Reservado para Administrador
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Módulo de Reportes y Balances Confidencial
          </h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
            Actualmente has iniciado sesión como <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.roleLabel}). Este rol tiene permisos exclusivos para <strong>ingresar datos</strong> y <strong>consultar el historial de movimientos</strong>.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 max-w-md mx-auto text-left space-y-2">
          <p className="font-bold text-slate-800">¿Qué puedes hacer como operador?</p>
          <ul className="list-disc list-inside space-y-1 text-slate-500">
            <li>Registrar ventas diarias en el formulario de entrada.</li>
            <li>Registrar gastos operativos e insumos.</li>
            <li>Revisar el listado general de transacciones registradas.</li>
          </ul>
        </div>

        <div className="pt-2">
          <button
            onClick={onOpenUserModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-200 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Cambiar a Cuenta Administrador</span>
          </button>
        </div>
      </div>
    );
  }

  // Listas únicas de conceptos, clientes y categorías para los desplegables de filtro
  const uniqueConcepts = useMemo(() => {
    const set = new Set<string>();
    safeRecords.forEach(r => {
      if (r && r.description && r.description.trim()) {
        set.add(r.description.trim());
      }
    });
    return Array.from(set).sort();
  }, [safeRecords]);

  const uniqueEntities = useMemo(() => {
    const set = new Set<string>();
    safeRecords.forEach(r => {
      if (r && r.entityName && r.entityName.trim()) {
        set.add(r.entityName.trim());
      }
    });
    return Array.from(set).sort();
  }, [safeRecords]);

  const uniqueCategories = useMemo(() => {
    const set = new Set<string>();
    safeRecords.forEach(r => {
      if (r && r.category && r.category.trim()) {
        set.add(r.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [safeRecords]);

  const activeWeekInfo = availableWeeks.find(w => w.weekKey === selectedWeekKey) || availableWeeks[0];
  const activeDate = activeWeekInfo ? activeWeekInfo.sampleDate : formatDateISO(new Date());

  const currentWeekIndex = availableWeeks.findIndex(w => w.weekKey === selectedWeekKey);
  const prevWeekInfo = currentWeekIndex !== -1 && currentWeekIndex < availableWeeks.length - 1
    ? availableWeeks[currentWeekIndex + 1]
    : undefined;

  const prevWeekRecords = prevWeekInfo 
    ? safeRecords.filter(r => {
        if (!r) return false;
        const info = getWeekRangeForDate(r.date);
        return info.weekKey === prevWeekInfo.weekKey;
      })
    : undefined;

  // Filtrar el conjunto de datos según los filtros activos
  const filteredRecords = useMemo(() => {
    return safeRecords.filter(r => {
      if (!r) return false;
      // 1. Período
      if (periodMode === 'week' && activeWeekInfo) {
        const info = getWeekRangeForDate(r.date);
        if (info.weekKey !== activeWeekInfo.weekKey) return false;
      }

      // 2. Tipo
      if (filterType !== 'all' && r.type !== filterType) {
        return false;
      }

      // 3. Concepto
      if (filterConcept !== 'all' && r.description !== filterConcept) {
        return false;
      }

      // 4. Cliente / Proveedor
      if (filterEntity !== 'all' && r.entityName !== filterEntity) {
        return false;
      }

      // 5. Categoría
      if (filterCategory !== 'all' && r.category !== filterCategory) {
        return false;
      }

      // 6. Usuario
      if (filterUser !== 'all' && r.createdBy !== filterUser) {
        return false;
      }

      // 7. Búsqueda de texto libre
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = r.description?.toLowerCase().includes(q);
        const matchEntity = r.entityName?.toLowerCase().includes(q);
        const matchCat = r.category?.toLowerCase().includes(q);
        const matchNotes = r.notes?.toLowerCase().includes(q);
        const matchUser = r.createdByName?.toLowerCase().includes(q);
        if (!matchDesc && !matchEntity && !matchCat && !matchNotes && !matchUser) {
          return false;
        }
      }

      return true;
    });
  }, [records, periodMode, activeWeekInfo, filterType, filterConcept, filterEntity, filterCategory, filterUser, searchQuery]);

  // Generar reporte base
  const report: WeeklyReport = generateWeeklyReport(filteredRecords, activeDate, prevWeekRecords);

  // Desglose por Conceptos (Rankings)
  const conceptBreakdown = useMemo(() => {
    const salesMap = new Map<string, { amount: number; count: number }>();
    const expensesMap = new Map<string, { amount: number; count: number }>();

    filteredRecords.forEach(r => {
      const name = r.description?.trim() || 'Sin descripción específica';
      if (r.type === 'sale') {
        const current = salesMap.get(name) || { amount: 0, count: 0 };
        salesMap.set(name, { amount: current.amount + r.amount, count: current.count + 1 });
      } else {
        const current = expensesMap.get(name) || { amount: 0, count: 0 };
        expensesMap.set(name, { amount: current.amount + r.amount, count: current.count + 1 });
      }
    });

    const topSaleConcepts: ItemBreakdown[] = Array.from(salesMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: report.totalSales > 0 ? (data.amount / report.totalSales) * 100 : 0,
        type: 'sale' as const,
      }))
      .sort((a, b) => b.amount - a.amount);

    const topExpenseConcepts: ItemBreakdown[] = Array.from(expensesMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: report.totalExpenses > 0 ? (data.amount / report.totalExpenses) * 100 : 0,
        type: 'expense' as const,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { topSaleConcepts, topExpenseConcepts };
  }, [filteredRecords, report.totalSales, report.totalExpenses]);

  // Desglose por Clientes / Proveedores (Rankings)
  const entityBreakdown = useMemo(() => {
    const clientsMap = new Map<string, { amount: number; count: number }>();
    const providersMap = new Map<string, { amount: number; count: number }>();

    filteredRecords.forEach(r => {
      if (r.entityName && r.entityName.trim()) {
        const name = r.entityName.trim();
        if (r.type === 'sale') {
          const current = clientsMap.get(name) || { amount: 0, count: 0 };
          clientsMap.set(name, { amount: current.amount + r.amount, count: current.count + 1 });
        } else {
          const current = providersMap.get(name) || { amount: 0, count: 0 };
          providersMap.set(name, { amount: current.amount + r.amount, count: current.count + 1 });
        }
      }
    });

    const topClients: ItemBreakdown[] = Array.from(clientsMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: report.totalSales > 0 ? (data.amount / report.totalSales) * 100 : 0,
        type: 'sale' as const,
      }))
      .sort((a, b) => b.amount - a.amount);

    const topProviders: ItemBreakdown[] = Array.from(providersMap.entries())
      .map(([name, data]) => ({
        name,
        amount: data.amount,
        count: data.count,
        percentage: report.totalExpenses > 0 ? (data.amount / report.totalExpenses) * 100 : 0,
        type: 'expense' as const,
      }))
      .sort((a, b) => b.amount - a.amount);

    return { topClients, topProviders };
  }, [filteredRecords, report.totalSales, report.totalExpenses]);

  const maxDailyValue = Math.max(
    ...report.dailyBreakdown.map(d => Math.max(d.sales, d.expenses)),
    100
  );

  const activeFiltersCount = [
    filterConcept !== 'all',
    filterEntity !== 'all',
    filterCategory !== 'all',
    filterUser !== 'all',
    filterType !== 'all',
    searchQuery.trim() !== '',
    periodMode !== 'week',
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setFilterConcept('all');
    setFilterEntity('all');
    setFilterCategory('all');
    setFilterUser('all');
    setFilterType('all');
    setSearchQuery('');
    setPeriodMode('week');
  };

  const handlePrevWeek = () => {
    if (currentWeekIndex < availableWeeks.length - 1) {
      setSelectedWeekKey(availableWeeks[currentWeekIndex + 1].weekKey);
    }
  };

  const handleNextWeek = () => {
    if (currentWeekIndex > 0) {
      setSelectedWeekKey(availableWeeks[currentWeekIndex - 1].weekKey);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Barra Principal de Control y Exportación */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        {/* Fila 1: Título del Reporte, Badges Informativos y Restablecer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                Análisis y Reportes
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {periodMode === 'week' ? `Semana #${report.weekNumber} de ${report.year}` : 'Historial Total Filtrado'}
              </span>
              {activeFiltersCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} activo{activeFiltersCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 tracking-tight">
              {periodMode === 'week' ? `Flujo Financiero: ${report.formattedRange}` : `Flujo Financiero Acumulado (${filteredRecords.length} movimientos)`}
            </h2>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Filtros</span>
            </button>
          )}
        </div>

        {/* Fila 2: Barra de Herramientas, Selectores de Período y Botón de Exportación */}
        <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Controles de Selección de Período */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Toggle Modo Semana / Todo el Historial */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
              <button
                onClick={() => setPeriodMode('week')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  periodMode === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setPeriodMode('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  periodMode === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todo el Historial
              </button>
            </div>

            {/* Navegación de Semanas si el modo es 'week' */}
            {periodMode === 'week' && (
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button
                  onClick={handlePrevWeek}
                  disabled={currentWeekIndex >= availableWeeks.length - 1}
                  title="Semana anterior"
                  className="p-2 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <select
                  aria-label="Seleccionar semana"
                  value={selectedWeekKey}
                  onChange={(e) => setSelectedWeekKey(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 px-3 py-1.5 focus:outline-none cursor-pointer"
                >
                  {availableWeeks.map(w => (
                    <option key={w.weekKey} value={w.weekKey}>
                      {w.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleNextWeek}
                  disabled={currentWeekIndex <= 0}
                  title="Semana siguiente"
                  className="p-2 rounded-lg hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Botones de Exportación */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => exportToExcel(filteredRecords, currencySymbol, `Reporte_Financiero_Filtrado_${new Date().toISOString().split('T')[0]}.xlsx`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 transition-colors cursor-pointer"
              title="Descargar datos en Excel con formato y tablas"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Reporte Excel</span>
            </button>

            <button
              onClick={() => exportToCSV(filteredRecords, currencySymbol)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Descargar formato CSV compatible"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* PANEL DE FILTROS AVANZADOS POR CONCEPTO, CLIENTE, CATEGORÍA, USUARIO Y TIPO */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Filtros Avanzados para Reportes</h3>
              <p className="text-[11px] text-slate-500">Analiza el flujo financiero por conceptos, clientes o categorías específicas</p>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {/* Fila de controles de filtro */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
          
          {/* Filtro por Concepto / Descripción */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3 text-blue-600" />
              <span>Concepto</span>
            </label>
            <select
              aria-label="Filtrar por concepto"
              value={filterConcept}
              onChange={(e) => setFilterConcept(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50/70 hover:bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">Todos los Conceptos ({uniqueConcepts.length})</option>
              {uniqueConcepts.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Cliente / Pagador / Proveedor */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-blue-600" />
              <span>Cliente / Proveedor</span>
            </label>
            <select
              aria-label="Filtrar por cliente o proveedor"
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50/70 hover:bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">Todos ({uniqueEntities.length})</option>
              {uniqueEntities.map(e => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Categoría */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3 h-3 text-blue-600" />
              <span>Categoría</span>
            </label>
            <select
              aria-label="Filtrar por categoría"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50/70 hover:bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">Todas las Categorías ({uniqueCategories.length})</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Tipo (Venta / Gasto) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Tipo de Movimiento
            </label>
            <select
              aria-label="Filtrar por tipo"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50/70 hover:bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">Ventas y Gastos</option>
              <option value="sale">Solo Ventas (Ingresos)</option>
              <option value="expense">Solo Gastos (Egresos)</option>
            </select>
          </div>

          {/* Filtro por Usuario / Operador */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Users className="w-3 h-3 text-blue-600" />
              <span>Registrado por</span>
            </label>
            <select
              aria-label="Filtrar por usuario"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold bg-slate-50/70 hover:bg-white border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">Todos los Usuarios</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Buscador de texto libre */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar palabras clave en descripciones, clientes, notas o categorías..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded-md hover:bg-slate-200/50"
            >
              ✕
            </button>
          )}
        </div>

        {/* Resumen del conjunto filtrado */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
          <span>
            Evaluando <strong>{filteredRecords.length}</strong> transacciones de un total de {records.length}
          </span>
          <span className="text-slate-700 font-semibold">
            {filterConcept !== 'all' ? `Concepto: ${filterConcept}` : ''}
            {filterEntity !== 'all' ? ` • Cliente/Prov: ${filterEntity}` : ''}
          </span>
        </div>
      </div>

      {/* 4 Métricas Clave Semanales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Ventas */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ventas Totales
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-2">
            {formatCurrency(report.totalSales, currencySymbol)}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {report.previousWeekComparison?.salesDiffPercent !== undefined ? (
              <>
                <span className={`font-bold flex items-center ${report.previousWeekComparison.salesDiffPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {report.previousWeekComparison.salesDiffPercent >= 0 ? '+' : ''}{report.previousWeekComparison.salesDiffPercent.toFixed(1)}%
                </span>
                <span className="text-slate-400">vs semana anterior</span>
              </>
            ) : (
              <span className="text-slate-400">{report.salesCount} ingresos registrados</span>
            )}
          </div>
        </div>

        {/* Total Gastos */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gastos Operativos
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-2">
            {formatCurrency(report.totalExpenses, currencySymbol)}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            {report.previousWeekComparison?.expensesDiffPercent !== undefined ? (
              <>
                <span className={`font-bold flex items-center ${report.previousWeekComparison.expensesDiffPercent <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {report.previousWeekComparison.expensesDiffPercent >= 0 ? '+' : ''}{report.previousWeekComparison.expensesDiffPercent.toFixed(1)}%
                </span>
                <span className="text-slate-400">vs semana anterior</span>
              </>
            ) : (
              <span className="text-slate-400">{report.expensesCount} salidas registradas</span>
            )}
          </div>
        </div>

        {/* Flujo Neto / Balance */}
        <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/10 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
              Flujo Neto / Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-2">
            {formatCurrency(report.netFlow, currencySymbol)}
          </div>
          <div className="text-xs text-blue-100">
            {report.netFlow >= 0 ? 'Balance positivo en el período' : 'Déficit temporal en el período'}
          </div>
        </div>

        {/* Margen de Ganancia */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Margen de Utilidad
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-2">
            {report.marginPercent.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-400">
            {filteredRecords.length} transacciones analizadas
          </div>
        </div>
      </div>

      {/* Gráfico Detallado de Flujo Diario de la Semana (si modo semana) */}
      {periodMode === 'week' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">Desglose Diario de la Semana</h3>
              <p className="text-xs text-slate-500">Comportamiento día por día de ingresos y gastos</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-slate-700">Ventas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-slate-300" />
                <span className="text-slate-700">Gastos</span>
              </div>
            </div>
          </div>

          {/* Columnas de los 7 días */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-48 pt-6 pb-2 border-b border-slate-100">
            {report.dailyBreakdown.map((day) => {
              const salePct = (day.sales / maxDailyValue) * 100;
              const expPct = (day.expenses / maxDailyValue) * 100;

              return (
                <div key={day.date} className="flex flex-col items-center gap-2 h-full justify-end group relative">
                  <div className="flex items-end gap-1.5 w-full justify-center h-36">
                    {/* Barra Ventas */}
                    <div 
                      style={{ height: `${day.sales > 0 ? Math.max(salePct, 6) : 4}%` }} 
                      className={`w-3 sm:w-5 rounded-t-lg transition-all ${
                        day.sales > 0 ? 'bg-blue-500 group-hover:bg-blue-600' : 'bg-slate-100'
                      }`}
                    />
                    {/* Barra Gastos */}
                    <div 
                      style={{ height: `${day.expenses > 0 ? Math.max(expPct, 6) : 4}%` }} 
                      className={`w-3 sm:w-5 rounded-t-lg transition-all ${
                        day.expenses > 0 ? 'bg-slate-300 group-hover:bg-slate-400' : 'bg-slate-100'
                      }`}
                    />
                  </div>

                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-800">{day.dayName.slice(0, 3)}</p>
                    <p className="text-[10px] text-slate-400">{day.date.slice(8, 10)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabla de valores diarios debajo */}
          <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4 text-center">
            {report.dailyBreakdown.map((day) => (
              <div key={day.date} className="text-[11px]">
                <p className="font-bold text-blue-600">{formatCurrency(day.sales, currencySymbol)}</p>
                <p className="text-slate-500">{formatCurrency(day.expenses, currencySymbol)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECCIÓN NUEVA: RANKING POR CONCEPTOS / DESCRIPCIONES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Conceptos de Ventas */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Conceptos con Mayores Ventas</h3>
                <p className="text-xs text-slate-500">Ingresos agrupados por motivo / concepto</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {conceptBreakdown.topSaleConcepts.length} conceptos
            </span>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {conceptBreakdown.topSaleConcepts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Sin registros de ventas para los filtros actuales</p>
            ) : (
              conceptBreakdown.topSaleConcepts.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 truncate max-w-[200px]" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-slate-900 font-bold">
                      {formatCurrency(item.amount, currencySymbol)} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full rounded-full" 
                      style={{ width: `${Math.min(item.percentage, 100)}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Conceptos de Gastos */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Conceptos con Mayores Gastos</h3>
                <p className="text-xs text-slate-500">Egresos agrupados por motivo / concepto</p>
              </div>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
              {conceptBreakdown.topExpenseConcepts.length} conceptos
            </span>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {conceptBreakdown.topExpenseConcepts.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Sin registros de gastos para los filtros actuales</p>
            ) : (
              conceptBreakdown.topExpenseConcepts.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 truncate max-w-[200px]" title={item.name}>
                      {item.name}
                    </span>
                    <span className="text-slate-900 font-bold">
                      {formatCurrency(item.amount, currencySymbol)} ({item.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full" 
                      style={{ width: `${Math.min(item.percentage, 100)}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* SECCIÓN NUEVA: RANKING POR CLIENTES Y PROVEEDORES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Clientes / Pagadores */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Clientes Principales</h3>
                <p className="text-xs text-slate-500">Clientes que más ventas generan</p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
              {entityBreakdown.topClients.length} clientes
            </span>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {entityBreakdown.topClients.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Sin registros de clientes identificados</p>
            ) : (
              entityBreakdown.topClients.map((client) => (
                <div key={client.name}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 truncate max-w-[200px]" title={client.name}>
                      {client.name}
                    </span>
                    <span className="text-slate-900 font-bold">
                      {formatCurrency(client.amount, currencySymbol)} ({client.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full" 
                      style={{ width: `${Math.min(client.percentage, 100)}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Proveedores / Receptores */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Principales Proveedores</h3>
                <p className="text-xs text-slate-500">Destinatarios con mayores pagos y compras</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
              {entityBreakdown.topProviders.length} proveedores
            </span>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {entityBreakdown.topProviders.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Sin registros de proveedores identificados</p>
            ) : (
              entityBreakdown.topProviders.map((provider) => (
                <div key={provider.name}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 truncate max-w-[200px]" title={provider.name}>
                      {provider.name}
                    </span>
                    <span className="text-slate-900 font-bold">
                      {formatCurrency(provider.amount, currencySymbol)} ({provider.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full" 
                      style={{ width: `${Math.min(provider.percentage, 100)}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Categorías más vendidas y principales gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Categorías de Ventas */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">Distribución por Categorías de Ventas</h3>
              <p className="text-xs text-slate-500">Categorías con mayores ingresos</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              {report.topSaleCategories.length} categorías
            </span>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {report.topSaleCategories.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Sin registros de ventas en la selección</p>
            ) : (
              report.topSaleCategories.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">{cat.category}</span>
                    <span className="text-slate-900 font-bold">{formatCurrency(cat.amount, currencySymbol)} ({cat.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full" 
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Categorías de Gastos */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">Distribución por Categorías de Gastos</h3>
              <p className="text-xs text-slate-500">Salidas agrupadas por rubro operativo</p>
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
              {report.topExpenseCategories.length} categorías
            </span>
          </div>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {report.topExpenseCategories.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Sin registros de gastos en la selección</p>
            ) : (
              report.topExpenseCategories.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">{cat.category}</span>
                    <span className="text-slate-900 font-bold">{formatCurrency(cat.amount, currencySymbol)} ({cat.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-slate-400 h-full rounded-full" 
                      style={{ width: `${Math.min(cat.percentage, 100)}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
