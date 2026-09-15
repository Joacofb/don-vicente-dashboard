import React, { useState, useEffect } from 'react';
import { 
  X, 
  Send, 
  MessageSquare, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Tag, 
  User, 
  Building2, 
  Clock, 
  CheckCheck,
  AlertCircle,
  ExternalLink,
  Check
} from 'lucide-react';
import { FinancialRecord, AppUser, RecordMessage, ReviewStatus } from '../types';
import { formatCurrency } from '../utils/financeUtils';
import { formatDisplayDate } from '../utils/dateUtils';

interface RecordInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: FinancialRecord | null;
  currentUser: AppUser;
  users: AppUser[];
  messages: RecordMessage[];
  onSendMessage: (msg: Omit<RecordMessage, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  currencySymbol: string;
  preselectedRecipientId?: string;
  onEditRecord?: (record: FinancialRecord) => void;
  onUpdateReviewStatus?: (recordId: string, status: ReviewStatus) => void;
}

export const RecordInquiryModal: React.FC<RecordInquiryModalProps> = ({
  isOpen,
  onClose,
  record,
  currentUser,
  users,
  messages,
  onSendMessage,
  currencySymbol,
  preselectedRecipientId,
  onEditRecord,
  onUpdateReviewStatus,
}) => {
  const [messageText, setMessageText] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inicializar destinatario basado en el creador del registro o en el prop
  useEffect(() => {
    if (!isOpen || !record) return;

    if (preselectedRecipientId && preselectedRecipientId !== currentUser.id) {
      setSelectedRecipientId(preselectedRecipientId);
      return;
    }

    // Si el registro fue creado por otro usuario, pre-seleccionarlo
    if (record.createdBy && record.createdBy !== currentUser.id) {
      setSelectedRecipientId(record.createdBy);
    } else {
      // Si fue creado por el usuario actual o no tiene creador explícito, seleccionar al primer usuario distinto
      const otherUser = users.find(u => u.id !== currentUser.id);
      setSelectedRecipientId(otherUser ? otherUser.id : '');
    }
  }, [isOpen, record, currentUser.id, users, preselectedRecipientId]);

  if (!isOpen || !record) return null;

  // Filtrar el hilo de mensajes relacionados con este registro específico
  const recordThread = messages
    .filter(m => m.recordId === record.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const selectedRecipient = users.find(u => u.id === selectedRecipientId);
  const isSale = record.type === 'sale';

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    if (!selectedRecipientId) {
      setErrorMessage('Por favor selecciona el destinatario del mensaje.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);

    try {
      const recipient = users.find(u => u.id === selectedRecipientId);
      await onSendMessage({
        recordId: record.id,
        senderId: currentUser.id,
        senderName: currentUser.name,
        recipientId: selectedRecipientId,
        recipientName: recipient?.name || 'Usuario',
        messageText: messageText.trim(),
        recordSummary: {
          concept: record.description || record.category || 'Movimiento',
          amount: record.amount || 0,
          date: record.date,
          type: record.type,
          ...(record.entityName ? { entityName: record.entityName } : {}),
        }
      });

      // Si el registro estaba en estado resuelto o sin asignar, marcarlo automáticamente como 'pendiente'
      if (onUpdateReviewStatus && (!record.reviewStatus || record.reviewStatus !== 'pendiente')) {
        onUpdateReviewStatus(record.id, 'pendiente');
      }

      setMessageText('');
    } catch (err: unknown) {
      const errorStr = err instanceof Error ? err.message : 'Error al enviar el mensaje.';
      setErrorMessage(errorStr);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-inquiry-title"
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 id="modal-inquiry-title" className="text-base font-bold text-white tracking-tight">
                Consulta sobre Registro
              </h3>
              <p className="text-xs text-slate-400">
                Comunicación directa entre operadores vinculada a la transacción
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ficha Resumen del Registro Consultado */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isSale 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {isSale ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{isSale ? 'Ingreso / Venta' : 'Gasto / Egreso'}</span>
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDisplayDate(record.date)}
                </span>
              </div>
              <span className={`text-base font-bold ${isSale ? 'text-blue-600' : 'text-slate-900'}`}>
                {isSale ? '+' : '-'}{formatCurrency(record.amount, currencySymbol)}
              </span>
            </div>

            <p className="text-sm font-bold text-slate-800 mb-1">
              {record.description || record.category}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-slate-400" />
                {record.category}
              </span>
              {record.entityName && (
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  {record.entityName}
                </span>
              )}
              <span className="flex items-center gap-1 text-slate-600 ml-auto">
                <User className="w-3 h-3 text-slate-400" />
                Registrado por: <strong className="text-slate-800">{record.createdByName || 'Operador'}</strong>
              </span>
            </div>

            {/* Barra de Estado de Revisión y Enlace de Edición */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Revisión:
                </span>
                {record.reviewStatus === 'pendiente' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    🟡 Pendiente
                  </span>
                ) : record.reviewStatus === 'en_revision' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    🔵 En Revisión
                  </span>
                ) : record.reviewStatus === 'resuelto' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                    🟢 Resuelto
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    ⚪ Sin asignar
                  </span>
                )}
                {record.lastReviewedBy && (
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    (por {record.lastReviewedBy})
                  </span>
                )}
              </div>

              {onEditRecord && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditRecord(record);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                  title="Abrir formulario completo para editar este registro"
                >
                  <ExternalLink className="w-3 h-3 text-blue-600" />
                  <span>Ver / Editar Registro</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selector de Destinatario */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between gap-3">
          <label className="text-xs font-semibold text-slate-600 shrink-0">
            Destinatario:
          </label>
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <select
              value={selectedRecipientId}
              onChange={(e) => setSelectedRecipientId(e.target.value)}
              className="w-full text-xs font-semibold py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            >
              {users.map(u => (
                <option key={u.id} value={u.id} disabled={u.id === currentUser.id}>
                  {u.name} ({u.roleLabel}) {u.id === currentUser.id ? '— (Tú)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hilo de Mensajes Anteriores sobre este Registro */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50 min-h-[160px] max-h-[260px]">
          {recordThread.length === 0 ? (
            <div className="text-center py-6 text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No hay mensajes previos sobre este registro.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Escribe a continuación para iniciar una consulta con {selectedRecipient?.name || 'el operador'}.
              </p>
            </div>
          ) : (
            recordThread.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[10px] font-bold text-slate-500">
                      {isMine ? 'Tú' : msg.senderName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
                    isMine 
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs' 
                      : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-xs'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.messageText}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Formulario para escribir y enviar nuevo mensaje */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200">
          {errorMessage && (
            <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder={`Escribe tu consulta a ${selectedRecipient?.name || 'otro operador'}...`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-xs text-slate-800 placeholder:text-slate-400"
              disabled={isSending}
            />
            <button
              type="submit"
              disabled={isSending || !messageText.trim()}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Enviando...' : 'Enviar'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
