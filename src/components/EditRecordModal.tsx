import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Save, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  Tag, 
  User, 
  CreditCard, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  Eye,
  EyeOff,
  Clock,
  History,
  CheckCircle2,
  Building2,
  Sparkles
} from 'lucide-react';
import { 
  FinancialRecord, 
  TransactionType, 
  PaymentMethod, 
  AppUser, 
  DEFAULT_SALE_CATEGORIES, 
  DEFAULT_EXPENSE_CATEGORIES, 
  PAYMENT_METHODS 
} from '../types';
import { SavedItem } from '../data/savedItemsData';
import { formatDisplayDate } from '../utils/dateUtils';
import { formatCurrency } from '../utils/financeUtils';

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FinancialRecord | null;
  onSave: (updatedRecord: FinancialRecord) => void;
  currentUser: AppUser;
  users: AppUser[];
  currencySymbol: string;
  savedConcepts?: SavedItem[];
  savedEntities?: SavedItem[];
  onRecordConcept?: (name: string, type: TransactionType) => void;
  onRecordEntity?: (name: string, type: TransactionType) => void;
}

export const EditRecordModal: React.FC<EditRecordModalProps> = ({
  isOpen,
  onClose,
  record,
  onSave,
  currentUser,
  users = [],
  currencySymbol,
  savedConcepts = [],
  savedEntities = [],
  onRecordConcept,
  onRecordEntity,
}) => {
  if (!isOpen || !record) return null;

  const [type, setType] = useState<TransactionType>(record.type);
  const [date, setDate] = useState<string>(record.date);
  const [amount, setAmount] = useState<string>(record.amount.toString());
  const [category, setCategory] = useState<string>(record.category);
  const [description, setDescription] = useState<string>(record.description || '');
  const [entityName, setEntityName] = useState<string>(record.entityName || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(record.paymentMethod);
  const [notes, setNotes] = useState<string>(record.notes || '');
  const [editReason, setEditReason] = useState<string>(record.editReason || '');

  // Estados de Seguridad y PIN
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);

  // Sincronizar estado cuando cambia el registro seleccionado
  useEffect(() => {
    if (record) {
      setType(record.type);
      setDate(record.date);
      setAmount(record.amount.toString());
      setCategory(record.category);
      setDescription(record.description || '');
      setEntityName(record.entityName || '');
      setPaymentMethod(record.paymentMethod);
      setNotes(record.notes || '');
      setEditReason('');
      setPinInput('');
      setPinError('');
      setFormError('');
      setIsSavedSuccess(false);
    }
  }, [record]);

  // Manejar cambio de tipo y actualizar categoría sugerida si es necesario
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'sale' && !DEFAULT_SALE_CATEGORIES.includes(category)) {
      setCategory(DEFAULT_SALE_CATEGORIES[0]);
    } else if (newType === 'expense' && !DEFAULT_EXPENSE_CATEGORIES.includes(category)) {
      setCategory(DEFAULT_EXPENSE_CATEGORIES[0]);
    }
  };

  // Detección de Cambios en Datos Sensibles (Monto, Fecha, Tipo)
  const parsedAmount = parseFloat(amount) || 0;
  const isAmountChanged = parsedAmount !== record.amount;
  const isDateChanged = date !== record.date;
  const isTypeChanged = type !== record.type;
  const hasSensitiveChanges = isAmountChanged || isDateChanged || isTypeChanged;

  // Categorías según el tipo activo
  const availableCategories = type === 'sale' ? DEFAULT_SALE_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES;

  // Filtrar sugerencias de catálogos
  const conceptSuggestions = useMemo(() => {
    const list = savedConcepts.filter(c => c.type === type || c.type === 'both');
    if (!description.trim()) return list.slice(0, 5);
    return list.filter(c => c.name.toLowerCase().includes(description.toLowerCase())).slice(0, 5);
  }, [savedConcepts, type, description]);

  const entitySuggestions = useMemo(() => {
    const list = savedEntities.filter(e => e.type === type || e.type === 'both');
    if (!entityName.trim()) return list.slice(0, 5);
    return list.filter(e => e.name.toLowerCase().includes(entityName.toLowerCase())).slice(0, 5);
  }, [savedEntities, type, entityName]);

  // Validar PIN de seguridad
  const validatePin = (): boolean => {
    if (!hasSensitiveChanges) return true;

    const trimmedPin = pinInput.trim();
    if (!trimmedPin) {
      setPinError('Debes ingresar tu código PIN de seguridad para confirmar cambios en el monto, fecha o tipo.');
      return false;
    }

    // Buscar PIN del usuario actual o del Administrador
    const adminUser = users.find(u => u.role === 'admin');
    const validPins: string[] = [];

    if (currentUser.pin && currentUser.pin.trim()) {
      validPins.push(currentUser.pin.trim());
    }
    if (adminUser?.pin && adminUser.pin.trim()) {
      validPins.push(adminUser.pin.trim());
    }
    // PIN por defecto del sistema
    validPins.push('1234');

    if (validPins.includes(trimmedPin)) {
      setPinError('');
      return true;
    } else {
      setPinError('PIN de seguridad incorrecto. Verifica tu código e intenta nuevamente.');
      return false;
    }
  };

  // Guardar Cambios
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setPinError('');

    if (parsedAmount <= 0) {
      setFormError('El monto ingresado debe ser un número mayor a cero.');
      return;
    }

    if (!date) {
      setFormError('Debes seleccionar una fecha válida.');
      return;
    }

    if (!category.trim()) {
      setFormError('Debes seleccionar una categoría.');
      return;
    }

    // Si hay cambios sensibles, validar PIN
    if (hasSensitiveChanges) {
      const isPinValid = validatePin();
      if (!isPinValid) return;
    }

    const updatedRecord: FinancialRecord = {
      ...record,
      type,
      date,
      amount: parsedAmount,
      category: category.trim(),
      description: description.trim(),
      entityName: entityName.trim() || undefined,
      paymentMethod,
      notes: notes.trim() || undefined,
      lastEditedAt: new Date().toISOString(),
      lastEditedBy: currentUser.id,
      lastEditedByName: currentUser.name,
      editCount: (record.editCount || 0) + 1,
      editReason: editReason.trim() || undefined,
    };

    // Registrar en catálogo si es nuevo
    if (description.trim() && onRecordConcept) {
      onRecordConcept(description.trim(), type);
    }
    if (entityName.trim() && onRecordEntity) {
      onRecordEntity(entityName.trim(), type);
    }

    onSave(updatedRecord);
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado del Modal */}
        <div className="px-6 sm:px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Editar Registro Financiero</h2>
                <span className="text-[10px] font-mono bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                  ID: {record.id.slice(-6)}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Creado originalmente por <strong className="text-slate-700">{record.createdByName || 'Operador'}</strong> el {formatDisplayDate(record.createdAt ? record.createdAt.split('T')[0] : record.date)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Historial previo si ya fue editado */}
        {record.lastEditedAt && (
          <div className="bg-amber-50/70 border-b border-amber-200/60 px-6 sm:px-8 py-2 text-[11px] text-amber-900 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              Última modificación realizada por <strong>{record.lastEditedByName || 'Usuario'}</strong> el {new Date(record.lastEditedAt).toLocaleDateString()} a las {new Date(record.lastEditedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (Total ediciones: {record.editCount || 1})
            </span>
          </div>
        )}

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSave} className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          
          {/* Selector de Tipo (Ingreso vs Gasto) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Tipo de Movimiento</span>
              {isTypeChanged && (
                <span className="text-amber-600 text-[10px] font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Cambio sensible
                </span>
              )}
            </label>
            <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTypeChange('sale')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'sale'
                    ? 'bg-white shadow-xs text-emerald-700 border border-emerald-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${type === 'sale' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
                <span>Ingreso / Venta</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'expense'
                    ? 'bg-white shadow-xs text-rose-700 border border-rose-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium'
                }`}
              >
                <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 ${type === 'expense' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-500'}`}>
                  <ArrowDownRight className="w-3.5 h-3.5" />
                </div>
                <span>Gasto / Salida</span>
              </button>
            </div>
          </div>

          {/* Fila: Monto y Fecha (Datos Clave Sensibles) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Monto */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  <span>Monto Total ({currencySymbol}) *</span>
                </span>
                {isAmountChanged && (
                  <span className="text-amber-600 text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Cambio sensible
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-base font-bold outline-none transition-all ${
                    isAmountChanged 
                      ? 'border-amber-400 bg-amber-50/30 focus:ring-2 focus:ring-amber-400 text-slate-900' 
                      : 'border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 text-slate-900'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {isAmountChanged && (
                <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                  <span>Anterior: <strong>{formatCurrency(record.amount, currencySymbol)}</strong></span>
                  <span className={parsedAmount > record.amount ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                    Diferencia: {parsedAmount >= record.amount ? '+' : ''}{formatCurrency(parsedAmount - record.amount, currencySymbol)}
                  </span>
                </div>
              )}
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Fecha del Registro *</span>
                </span>
                {isDateChanged && (
                  <span className="text-amber-600 text-[10px] font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Cambio sensible
                  </span>
                )}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                  isDateChanged 
                    ? 'border-amber-400 bg-amber-50/30 focus:ring-2 focus:ring-amber-400 text-slate-900' 
                    : 'border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 text-slate-900'
                }`}
              />
              {isDateChanged && (
                <p className="text-[11px] text-slate-500 px-1">
                  Fecha original: <strong>{formatDisplayDate(record.date)}</strong>
                </p>
              )}
            </div>

          </div>

          {/* Fila: Concepto y Cliente/Proveedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Concepto / Descripción */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Concepto / Detalle</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Cambio de aceite, Pintura, Repuestos..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {conceptSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {conceptSuggestions.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setDescription(item.name)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-md transition-colors cursor-pointer"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cliente o Proveedor */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{type === 'sale' ? 'Cliente / Comprador' : 'Proveedor / Vendedor'}</span>
              </label>
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder={type === 'sale' ? 'Nombre del cliente...' : 'Nombre del comercio o proveedor...'}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
              {entitySuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {entitySuggestions.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEntityName(item.name)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-md transition-colors cursor-pointer"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Fila: Categoría y Medio de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Categoría */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                <span>Categoría *</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Medio de Pago */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Medio de Pago</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                {PAYMENT_METHODS.map(pm => (
                  <option key={pm.id} value={pm.id}>{pm.label}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Notas Adicionales y Motivo de la Edición */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Observaciones / Notas
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Detalles complementarios..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Motivo de la Edición (Auditoría)
              </label>
              <input
                type="text"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Ej: Corrección de importe, fecha errónea..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* SECCIÓN DE SEGURIDAD: VERIFICACIÓN CON CÓDIGO PIN */}
          {hasSensitiveChanges && (
            <div className="p-4 sm:p-5 bg-amber-50/90 border border-amber-300/80 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-amber-900">
                <div className="w-7 h-7 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold">Autorización de Seguridad Requerida</h4>
                  <p className="text-[11px] text-amber-800">
                    Se detectaron cambios en campos sensibles (monto, fecha o tipo de movimiento).
                  </p>
                </div>
              </div>

              {/* Resumen Comparativo */}
              <div className="bg-white/80 rounded-xl p-3 border border-amber-200/80 text-xs space-y-1.5">
                {isAmountChanged && (
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Monto anterior: <strong>{formatCurrency(record.amount, currencySymbol)}</strong></span>
                    <span>➔</span>
                    <span className="font-bold text-blue-700">Nuevo: {formatCurrency(parsedAmount, currencySymbol)}</span>
                  </div>
                )}
                {isDateChanged && (
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Fecha anterior: <strong>{formatDisplayDate(record.date)}</strong></span>
                    <span>➔</span>
                    <span className="font-bold text-blue-700">Nueva: {formatDisplayDate(date)}</span>
                  </div>
                )}
                {isTypeChanged && (
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Tipo anterior: <strong>{record.type === 'sale' ? 'Ingreso / Venta' : 'Gasto'}</strong></span>
                    <span>➔</span>
                    <span className="font-bold text-blue-700">Nuevo: {type === 'sale' ? 'Ingreso / Venta' : 'Gasto'}</span>
                  </div>
                )}
              </div>

              {/* Campo de Entrada de PIN */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-amber-900 flex items-center justify-between">
                  <span>Ingresa tu Código PIN para confirmar la edición:</span>
                  <span className="text-[10px] text-amber-700 font-normal">PIN por defecto: 1234</span>
                </label>
                
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:max-w-xs">
                    <input
                      type={showPin ? "text" : "password"}
                      maxLength={6}
                      autoFocus
                      required={hasSensitiveChanges}
                      placeholder="Ingresa PIN..."
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        setPinError('');
                      }}
                      className="w-full pl-4 pr-10 py-2 text-sm font-bold tracking-widest rounded-xl border border-amber-300 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {pinError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {isSavedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Registro actualizado exitosamente.</span>
            </div>
          )}

          {/* Pie de Página del Modal */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSavedSuccess}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Modificación</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
