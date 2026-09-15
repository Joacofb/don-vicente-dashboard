import React from 'react';
import { 
  X, 
  Calendar, 
  Tag, 
  User, 
  Building2, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Repeat, 
  Clock, 
  FileText, 
  History, 
  MessageSquare, 
  Pencil, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  Check, 
  Send
} from 'lucide-react';
import { FinancialRecord, AppUser, RecordMessage, ReviewStatus, PAYMENT_METHODS } from '../types';
import { formatCurrency } from '../utils/financeUtils';
import { formatDisplayDate } from '../utils/dateUtils';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FinancialRecord | null;
  currentUser: AppUser;
  users: AppUser[];
  currencySymbol: string;
  messages?: RecordMessage[];
  onEditRecord?: (record: FinancialRecord) => void;
  onOpenInquiry?: (record: FinancialRecord) => void;
  onUpdateReviewStatus?: (recordId: string, status: ReviewStatus) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  currentUser,
  users: _users,
  currencySymbol,
  messages = [],
  onEditRecord,
  onOpenInquiry,
  onUpdateReviewStatus,
}) => {
  if (!isOpen || !record) return null;

  const isSale = record.type === 'sale';
  const paymentMethodInfo = PAYMENT_METHODS.find(pm => pm.id === record.paymentMethod);
  const paymentLabel = paymentMethodInfo?.label || record.paymentMethod;

  // Filtrar los mensajes vinculados a este registro
  const recordMessages = messages.filter(m => m.recordId === record.id);

  // Estado de revisión actual
  const currentStatus: ReviewStatus = record.reviewStatus || 'sin_asignar';

  const handleStatusChange = (newStatus: ReviewStatus) => {
    if (onUpdateReviewStatus && record) {
      onUpdateReviewStatus(record.id, newStatus);
    }
  };

  const formatFullTimestamp = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-detail-title"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Encabezado Superior con Identidad del Tipo y Monto */}
        <div className={`px-6 py-5 ${isSale ? 'bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white' : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white'} flex items-start justify-between gap-4`}>
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              isSale 
                ? 'bg-blue-500/30 text-white border border-blue-400/40' 
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {isSale ? (
                <ArrowUpRight className="w-6 h-6" />
              ) : (
                <ArrowDownRight className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                  isSale ? 'bg-blue-400/20 text-blue-200 border border-blue-400/30' : 'bg-rose-400/20 text-rose-200 border border-rose-400/30'
                }`}>
                  {isSale ? 'Ingreso / Venta' : 'Gasto / Egreso'}
                </span>
                {record.paymentMethod === 'direct_transfer' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-400/20 text-purple-200 border border-purple-400/30 flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    <span>Transferencia Directa</span>
                  </span>
                )}
              </div>
              <h2 id="modal-detail-title" className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {record.description || record.category}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] font-semibold text-slate-300 block">Monto Registrado</span>
              <span className={`text-2xl font-black ${isSale ? 'text-emerald-300' : 'text-rose-300'}`}>
                {isSale ? '+' : '-'}{formatCurrency(record.amount, currencySymbol)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Monto visible en móviles */}
        <div className="sm:hidden px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">Monto total:</span>
          <span className={`text-xl font-black ${isSale ? 'text-blue-600' : 'text-rose-600'}`}>
            {isSale ? '+' : '-'}{formatCurrency(record.amount, currencySymbol)}
          </span>
        </div>

        {/* Contenido con Scroll */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700">

          {/* SECTOR 1: ESTADO DE REVISIÓN Y CAMBIO RÁPIDO */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Estado de Revisión:
                </span>
                {currentStatus === 'sin_asignar' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200/80 text-slate-700 border border-slate-300">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span>⚪ Sin asignar (Neutral)</span>
                  </span>
                )}
                {currentStatus === 'pendiente' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>🟡 Pendiente</span>
                  </span>
                )}
                {currentStatus === 'en_revision' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>🔵 En Revisión</span>
                  </span>
                )}
                {currentStatus === 'resuelto' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>🟢 Resuelto</span>
                  </span>
                )}
              </div>

              {record.lastReviewedBy && (
                <span className="text-[11px] font-medium text-slate-500">
                  Última revisión: <strong className="text-slate-700">{record.lastReviewedBy}</strong> {record.lastReviewedAt ? `(${formatFullTimestamp(record.lastReviewedAt)})` : ''}
                </span>
              )}
            </div>

            {/* Selector de cambio rápido de estado */}
            <div className="pt-2 border-t border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                Cambiar estado rápidamente:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('sin_asignar')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    currentStatus === 'sin_asignar'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  <span>⚪ Sin asignar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('pendiente')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    currentStatus === 'pendiente'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>🟡 Pendiente</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('en_revision')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    currentStatus === 'en_revision'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white hover:bg-blue-50 text-blue-800 border-blue-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>🔵 En Revisión</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusChange('resuelto')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                    currentStatus === 'resuelto'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>🟢 Resuelto</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTOR 2: DETALLES DE LA TRANSACCIÓN (GRID) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fecha del movimiento */}
            <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Fecha Operativa</span>
                <span className="text-sm font-bold text-slate-800">{formatDisplayDate(record.date, true)}</span>
                <span className="text-xs text-slate-500 block mt-0.5">{record.date}</span>
              </div>
            </div>

            {/* Categoría */}
            <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Categoría</span>
                <span className="text-sm font-bold text-slate-800">{record.category}</span>
              </div>
            </div>

            {/* Cliente o Proveedor */}
            <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="w-full">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isSale ? 'Cliente / Origen' : 'Proveedor / Destinatario'}
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {record.entityName || 'No especificado'}
                </span>
                {record.linkedEntityName && (
                  <div className="mt-1 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200 font-medium">
                    {isSale ? `Contraparte (Proveedor): ${record.linkedEntityName}` : `Contraparte (Cliente): ${record.linkedEntityName}`}
                  </div>
                )}
              </div>
            </div>

            {/* Método de Pago */}
            <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Medio de Pago</span>
                <span className="text-sm font-bold text-slate-800">{paymentLabel}</span>
              </div>
            </div>
          </div>

          {/* SECTOR 3: REGISTRADO POR Y TIMESTAMPS */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
                  {record.createdByName ? record.createdByName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-semibold">Registrado originalmente por:</span>
                  <span className="font-bold text-slate-800">{record.createdByName || 'Operador'}</span>
                </div>
              </div>

              {record.createdAt && (
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block font-semibold">Fecha y hora de alta:</span>
                  <span className="font-semibold text-slate-700">{formatFullTimestamp(record.createdAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* SECTOR 4: OBSERVACIONES / NOTAS ADICIONALES */}
          {record.notes && (
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/80">
              <div className="flex items-center gap-2 mb-1 text-blue-900 font-bold text-xs">
                <FileText className="w-4 h-4 text-blue-700" />
                <span>Observaciones y Notas Adicionales</span>
              </div>
              <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {record.notes}
              </p>
            </div>
          )}

          {/* SECTOR 5: HISTORIAL DE AUDITORÍA Y EDICIÓN */}
          {record.editCount && record.editCount > 0 ? (
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-xs">
              <div className="flex items-center gap-2 mb-1.5 text-amber-900 font-bold">
                <History className="w-4 h-4 text-amber-700" />
                <span>Historial de Modificaciones ({record.editCount} {record.editCount === 1 ? 'edición' : 'ediciones'})</span>
              </div>
              <div className="space-y-1 text-slate-700">
                <p>
                  Última modificación por: <strong className="text-slate-900">{record.lastEditedByName || 'Usuario'}</strong>
                  {record.lastEditedAt && <span> el {formatFullTimestamp(record.lastEditedAt)}</span>}
                </p>
                {record.editReason && (
                  <p className="text-amber-800 italic bg-amber-100/60 px-2.5 py-1 rounded-lg border border-amber-200 mt-1">
                    Motivo declarado: &ldquo;{record.editReason}&rdquo;
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {/* SECTOR 6: CONSULTAS / MENSAJES VINCULADOS */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold text-slate-800">
                  Consultas y Mensajes Vinculados ({recordMessages.length})
                </span>
              </div>

              {onOpenInquiry && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenInquiry(record);
                  }}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  <span>{recordMessages.length > 0 ? 'Responder / Nueva Consulta' : 'Consultar sobre este registro'}</span>
                </button>
              )}
            </div>

            {recordMessages.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No hay consultas registradas para este movimiento. Puedes iniciar una consulta directa a un operador o administrador con el botón superior.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recordMessages.map(msg => {
                  const isSentByCurrent = msg.senderId === currentUser.id;
                  return (
                    <div 
                      key={msg.id}
                      className={`p-3 rounded-xl border text-xs ${
                        isSentByCurrent
                          ? 'bg-blue-50/70 border-blue-200/80 ml-4'
                          : 'bg-white border-slate-200 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-slate-800">
                          {isSentByCurrent ? 'Tú' : msg.senderName} 
                          <span className="text-slate-400 font-normal"> para </span> 
                          {msg.recipientName}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatFullTimestamp(msg.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap">{msg.messageText}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Pie de Acciones del Modal */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onOpenInquiry && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInquiry(record);
                }}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Consultar</span>
              </button>
            )}

            {onEditRecord && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditRecord(record);
                }}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
              >
                <Pencil className="w-4 h-4 text-blue-600" />
                <span>Editar Registro</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer active:scale-95 shadow-xs ml-auto"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
