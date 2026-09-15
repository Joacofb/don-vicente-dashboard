import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  FileSpreadsheet, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Layers,
  ArrowUpDown,
  Download,
  User,
  ShieldCheck,
  UserCheck,
  Upload,
  FileText,
  Building2,
  RotateCcw,
  Edit3,
  Clock,
  MessageSquare,
  Repeat,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { FinancialRecord, PAYMENT_METHODS, AppUser } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/financeUtils';
import { exportToExcel, exportToCSV } from '../utils/exportUtils';

interface DailyLogTableProps {
  records?: FinancialRecord[];
  currencySymbol: string;
  onDeleteRecord: (id: string) => void;
  onEditRecord?: (record: FinancialRecord) => void;
  onViewRecord?: (record: FinancialRecord) => void;
  currentUser: AppUser;
  users?: AppUser[];
  onOpenImportModal?: () => void;
  onOpenInquiry?: (record: FinancialRecord) => void;
}

export const DailyLogTable: React.FC<DailyLogTableProps> = ({
  records = [],
  currencySymbol,
  onDeleteRecord,
  onEditRecord,
  onViewRecord,
  currentUser,
  users = [],
  onOpenImportModal,
  onOpenInquiry,
}) => {
  const safeRecords = records || [];
  const safeUsers = users || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterConcept, setFilterConcept] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterReviewStatus, setFilterReviewStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const isAdmin = currentUser.role === 'admin';

  const uniqueCategories = useMemo(() => 
    Array.from(new Set(safeRecords.map(r => r && r.category))).filter(Boolean).sort(),
    [safeRecords]
  );

  const uniqueConcepts = useMemo(() => {
    const set = new Set<string>();
    safeRecords.forEach(r => {
      if (r && r.description && r.description.trim()) set.add(r.description.trim());
    });
    return Array.from(set).sort();
  }, [safeRecords]);

  const uniqueEntities = useMemo(() => {
    const set = new Set<string>();
    safeRecords.forEach(r => {
      if (r && r.entityName && r.entityName.trim()) set.add(r.entityName.trim());
    });
    return Array.from(set).sort();
  }, [safeRecords]);

  const filteredRecords = safeRecords.filter(r => {
    if (!r) return false;
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (filterCategory !== 'all' && r.category !== filterCategory) return false;
    if (filterConcept !== 'all' && r.description !== filterConcept) return false;
    if (filterEntity !== 'all' && r.entityName !== filterEntity) return false;
    if (filterUser !== 'all' && r.createdBy !== filterUser) return false;
    if (filterReviewStatus !== 'all') {
      const currentStatus = r.reviewStatus || 'sin_asignar';
      if (currentStatus !== filterReviewStatus) return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchCategory = r.category?.toLowerCase().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      const matchEntity = (r.entityName || '').toLowerCase().includes(q);
      const matchDate = (r.date || '').includes(q);
      const matchUser = (r.createdByName || '').toLowerCase().includes(q);
      const matchNotes = (r.notes || '').toLowerCase().includes(q);
      if (!matchCategory && !matchDesc && !matchEntity && !matchDate && !matchUser && !matchNotes) return false;
    }
    return true;
  });

  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id);
    }
    if (sortBy === 'date-asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime() || a.id.localeCompare(b.id);
    }
    if (sortBy === 'amount-desc') {
      return b.amount - a.amount;
    }
    if (sortBy === 'amount-asc') {
      return a.amount - b.amount;
    }
    return 0;
  });

  const totalSalesFiltered = filteredRecords.filter(r => r.type === 'sale').reduce((sum, r) => sum + r.amount, 0);
  const totalExpensesFiltered = filteredRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
  const netFiltered = totalSalesFiltered - totalExpensesFiltered;

  const activeFiltersCount = [
    filterType !== 'all',
    filterCategory !== 'all',
    filterConcept !== 'all',
    filterEntity !== 'all',
    filterUser !== 'all',
    filterReviewStatus !== 'all',
    searchQuery.trim() !== '',
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setFilterType('all');
    setFilterCategory('all');
    setFilterConcept('all');
    setFilterEntity('all');
    setFilterUser('all');
    setFilterReviewStatus('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      
      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        
        {/* Fila 1: Búsqueda y Acciones rápidas (Importar/Exportar) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Campo de Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por concepto, cliente/proveedor, categoría, usuario o notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Importar datos desde Excel o CSV"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Importar Archivo</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => exportToExcel(filteredRecords, currencySymbol, `Historial_Movimientos_${new Date().toISOString().split('T')[0]}.xlsx`)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Exportar registros filtrados a Excel"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar Filtrados</span>
              </button>
            )}
          </div>
        </div>

        {/* Fila 2: Filtros por Concepto, Cliente, Categoría, Usuario y Orden */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          {/* Tipo de Movimiento */}
          <select
            aria-label="Filtrar por tipo"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="all">Tipo: Todos</option>
            <option value="sale">Solo Ventas</option>
            <option value="expense">Solo Gastos</option>
          </select>

          {/* Filtro por Concepto */}
          <select
            aria-label="Filtrar por concepto"
            value={filterConcept}
            onChange={(e) => setFilterConcept(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="all">Concepto: Todos ({uniqueConcepts.length})</option>
            {uniqueConcepts.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Filtro por Cliente / Proveedor */}
          <select
            aria-label="Filtrar por cliente o proveedor"
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="all">Cliente/Prov: Todos ({uniqueEntities.length})</option>
            {uniqueEntities.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>

          {/* Filtro por Categoría */}
          <select
            aria-label="Filtrar por categoría"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="all">Categoría: Todas</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Filtro por Usuario */}
          <select
            aria-label="Filtrar por usuario"
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="all">Usuario: Todos</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>

          {/* Filtro por Estado de Revisión */}
          <select
            aria-label="Filtrar por estado de revisión"
            value={filterReviewStatus}
            onChange={(e) => setFilterReviewStatus(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="all">Revisión: Todos</option>
            <option value="sin_asignar">⚪ Sin asignar (Neutral)</option>
            <option value="pendiente">🟡 Pendientes</option>
            <option value="en_revision">🔵 En Revisión</option>
            <option value="resuelto">🟢 Resueltos</option>
          </select>

          {/* Orden */}
          <select
            aria-label="Ordenar registros"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50/70 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="date-desc">Fecha: Más recientes</option>
            <option value="date-asc">Fecha: Más antiguos</option>
            <option value="amount-desc">Monto: Mayor primero</option>
            <option value="amount-asc">Monto: Menor primero</option>
          </select>
        </div>

        {/* Resumen filtrado */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-3 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              Mostrando <strong className="text-slate-800">{filteredRecords.length}</strong> de {records.length} movimientos
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
              >
                Limpiar filtros ({activeFiltersCount})
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-600">
              Ventas: <strong className="text-blue-600">{formatCurrency(totalSalesFiltered, currencySymbol)}</strong>
            </span>
            <span className="text-slate-600">
              Gastos: <strong className="text-rose-600">{formatCurrency(totalExpensesFiltered, currencySymbol)}</strong>
            </span>
            <span className="text-slate-600">
              Balance: <strong className={netFiltered >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{formatCurrency(netFiltered, currencySymbol)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de Registros */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {sortedRecords.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm font-medium">No se encontraron movimientos con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-4 px-5">Fecha</th>
                  <th className="py-4 px-5">Tipo</th>
                  <th className="py-4 px-5">Concepto / Detalle</th>
                  <th className="py-4 px-5">Categoría</th>
                  <th className="py-4 px-5">Cliente / Proveedor</th>
                  <th className="py-4 px-5">Medio de Pago</th>
                  <th className="py-4 px-5">Estado</th>
                  <th className="py-4 px-5">Registrado por</th>
                  <th className="py-4 px-5 text-right">Monto</th>
                  <th className="py-4 px-5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sortedRecords.map((r) => {
                  const paymentLabel = PAYMENT_METHODS.find(pm => pm.id === r.paymentMethod)?.label || r.paymentMethod;
                  const isSale = r.type === 'sale';

                  return (
                    <tr 
                      key={r.id} 
                      onClick={() => onViewRecord && onViewRecord(r)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                      title="Toca para ver la información completa de este registro"
                    >
                      {/* Fecha */}
                      <td className="py-4 px-5 whitespace-nowrap text-slate-700 font-semibold">
                        {formatDisplayDate(r.date, true)}
                      </td>

                      {/* Tipo */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isSale 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isSale ? (
                            <ArrowUpRight className="w-3 h-3 text-blue-600" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{isSale ? 'Venta' : 'Gasto'}</span>
                        </span>
                      </td>

                      {/* Concepto / Descripción */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800">{r.description || '—'}</span>
                          {r.lastEditedAt && (
                            <span 
                              className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60 font-semibold"
                              title={`Modificado por ${r.lastEditedByName || 'Usuario'} el ${new Date(r.lastEditedAt).toLocaleDateString()}`}
                            >
                              <Clock className="w-2.5 h-2.5 text-amber-600" />
                              <span>Editado</span>
                            </span>
                          )}
                        </div>
                        {r.notes && (
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5">{r.notes}</div>
                        )}
                        {r.editReason && (
                          <div className="text-[10px] text-amber-800 italic mt-0.5">
                            Motivo edición: {r.editReason}
                          </div>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {r.category}
                        </span>
                      </td>

                      {/* Cliente o Proveedor */}
                      <td className="py-4 px-5 text-slate-600">
                        {r.entityName ? (
                          <span className="font-semibold text-slate-800">{r.entityName}</span>
                        ) : (
                          <span className="text-slate-300 italic">No especificado</span>
                        )}
                      </td>

                      {/* Método de Pago */}
                      <td className="py-4 px-5 whitespace-nowrap text-slate-500 text-[11px]">
                        {r.paymentMethod === 'direct_transfer' ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              <Repeat className="w-2.5 h-2.5 text-purple-600" />
                              <span>Transferencia Directa</span>
                            </span>
                            {r.linkedEntityName && (
                              <span className="text-[10px] text-purple-600/90 font-medium">
                                {isSale ? `Hacia: ${r.linkedEntityName}` : `Desde: ${r.linkedEntityName}`}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span>{paymentLabel}</span>
                        )}
                      </td>

                      {/* Estado de Revisión */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {r.reviewStatus === 'pendiente' ? (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditRecord ? onEditRecord(r) : onViewRecord && onViewRecord(r);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs"
                            title={`Revisión Pendiente${r.lastReviewedBy ? ` (Última por ${r.lastReviewedBy})` : ''}. Clic para editar`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>🟡 Pendiente</span>
                          </span>
                        ) : r.reviewStatus === 'en_revision' ? (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditRecord ? onEditRecord(r) : onViewRecord && onViewRecord(r);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
                            title={`En Revisión${r.lastReviewedBy ? ` por ${r.lastReviewedBy}` : ''}. Clic para editar`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            <span>🔵 En Revisión</span>
                          </span>
                        ) : r.reviewStatus === 'resuelto' ? (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditRecord ? onEditRecord(r) : onViewRecord && onViewRecord(r);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer shadow-2xs"
                            title={`Resuelto${r.lastReviewedBy ? ` por ${r.lastReviewedBy}` : ''}. Clic para editar`}
                          >
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>🟢 Resuelto</span>
                          </span>
                        ) : (
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditRecord ? onEditRecord(r) : onViewRecord && onViewRecord(r);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer shadow-2xs"
                            title="Sin asignar / Neutral. Clic para editar"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span>⚪ Sin asignar</span>
                          </span>
                        )}
                      </td>

                      {/* Registrado por y Botón de Consulta Rápida */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-semibold">{r.createdByName || 'Operador'}</span>
                          </div>
                          {onOpenInquiry && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenInquiry(r);
                              }}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/70 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                              title={`Consultar a ${r.createdByName || 'Operador'} sobre este movimiento`}
                            >
                              <MessageSquare className="w-2.5 h-2.5" />
                              <span>Consultar a {r.createdByName ? r.createdByName.split(' ')[0] : 'Operador'}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Monto */}
                      <td className="py-4 px-5 text-right whitespace-nowrap font-bold text-sm">
                        <span className={isSale ? 'text-blue-600' : 'text-slate-800'}>
                          {isSale ? '+' : '-'}{formatCurrency(r.amount, currencySymbol)}
                        </span>
                      </td>

                      {/* Acciones: Ver Ficha, Consultar, Editar y Borrar */}
                      <td className="py-4 px-5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {onViewRecord && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onViewRecord(r);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Ver información completa (Ficha detallada)"
                              aria-label="Ver ficha del registro"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {onOpenInquiry && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenInquiry(r);
                              }}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                              title={`Consultar o enviar mensaje a ${r.createdByName || 'Operador'}`}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                          {onEditRecord && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditRecord(r);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Editar este registro"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('¿Seguro que deseas eliminar este registro de la base de datos?')) {
                                  onDeleteRecord(r.id);
                                }
                              }}
                              className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Eliminar registro (Solo Administrador)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
