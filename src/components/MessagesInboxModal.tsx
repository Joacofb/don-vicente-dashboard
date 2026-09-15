import React, { useState } from 'react';
import { 
  X, 
  MessageSquare, 
  CheckCheck, 
  Clock, 
  Reply, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Tag, 
  Building2, 
  Inbox, 
  Send,
  Check,
  Eye,
  Edit3
} from 'lucide-react';
import { RecordMessage, FinancialRecord, AppUser } from '../types';
import { formatCurrency } from '../utils/financeUtils';
import { formatDisplayDate } from '../utils/dateUtils';

interface MessagesInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  messages: RecordMessage[];
  records: FinancialRecord[];
  onMarkAsRead: (messageId: string) => Promise<void>;
  onOpenInquiryForRecord: (record: FinancialRecord, targetUserId?: string) => void;
  onEditRecord: (record: FinancialRecord) => void;
  onViewRecord?: (record: FinancialRecord) => void;
  currencySymbol: string;
}

export const MessagesInboxModal: React.FC<MessagesInboxModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  messages,
  records,
  onMarkAsRead,
  onOpenInquiryForRecord,
  onEditRecord,
  onViewRecord,
  currencySymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'received' | 'sent' | 'all'>('received');
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtrar según la pestaña activa
  const receivedMessages = messages.filter(m => m.recipientId === currentUser.id);
  const sentMessages = messages.filter(m => m.senderId === currentUser.id);

  const displayedMessages = activeTab === 'received' 
    ? receivedMessages 
    : activeTab === 'sent' 
    ? sentMessages 
    : messages;

  const unreadCount = receivedMessages.filter(m => !m.read).length;

  const handleMarkRead = async (messageId: string) => {
    setProcessingId(messageId);
    try {
      await onMarkAsRead(messageId);
    } catch (err) {
      console.error('Error al marcar mensaje como leído:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReply = (msg: RecordMessage) => {
    // Buscar el registro referenciado
    const targetRecord = records.find(r => r.id === msg.recordId);
    if (targetRecord) {
      // Si fue recibido, responder al remitente
      const replyToUserId = msg.senderId === currentUser.id ? msg.recipientId : msg.senderId;
      onClose();
      onOpenInquiryForRecord(targetRecord, replyToUserId);
    } else if (msg.recordSummary) {
      // Si el registro histórico fue archivado, construir un objeto temporal para la vista
      const fallbackRecord: FinancialRecord = {
        id: msg.recordId,
        type: msg.recordSummary.type,
        date: msg.recordSummary.date,
        amount: msg.recordSummary.amount,
        category: 'Movimiento Referenciado',
        description: msg.recordSummary.concept,
        paymentMethod: 'other',
        entityName: msg.recordSummary.entityName,
        createdAt: msg.createdAt,
        createdBy: msg.senderId,
        createdByName: msg.senderName,
      };
      const replyToUserId = msg.senderId === currentUser.id ? msg.recipientId : msg.senderId;
      onClose();
      onOpenInquiryForRecord(fallbackRecord, replyToUserId);
    }
  };

  const handleViewRecordDetail = (msg: RecordMessage) => {
    const targetRecord = records.find(r => r.id === msg.recordId);
    if (targetRecord) {
      onClose();
      if (onViewRecord) {
        onViewRecord(targetRecord);
      } else {
        onEditRecord(targetRecord);
      }
    } else if (msg.recordSummary) {
      const fallbackRecord: FinancialRecord = {
        id: msg.recordId,
        type: msg.recordSummary.type,
        date: msg.recordSummary.date,
        amount: msg.recordSummary.amount,
        category: 'Movimiento Referenciado',
        description: msg.recordSummary.concept,
        paymentMethod: 'other',
        entityName: msg.recordSummary.entityName,
        createdAt: msg.createdAt,
        createdBy: msg.senderId,
        createdByName: msg.senderName,
        reviewStatus: 'sin_asignar',
      };
      onClose();
      if (onViewRecord) {
        onViewRecord(fallbackRecord);
      } else {
        onEditRecord(fallbackRecord);
      }
    }
  };

  const handleViewOrEditRecord = (msg: RecordMessage) => {
    const targetRecord = records.find(r => r.id === msg.recordId);
    if (targetRecord) {
      onClose();
      onEditRecord(targetRecord);
    } else if (msg.recordSummary) {
      const fallbackRecord: FinancialRecord = {
        id: msg.recordId,
        type: msg.recordSummary.type,
        date: msg.recordSummary.date,
        amount: msg.recordSummary.amount,
        category: 'Movimiento Referenciado',
        description: msg.recordSummary.concept,
        paymentMethod: 'other',
        entityName: msg.recordSummary.entityName,
        createdAt: msg.createdAt,
        createdBy: msg.senderId,
        createdByName: msg.senderName,
        reviewStatus: 'sin_asignar',
      };
      onClose();
      onEditRecord(fallbackRecord);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-inbox-title"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Cabecera Principal */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center relative">
              <MessageSquare className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-slate-900" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="modal-inbox-title" className="text-base font-bold text-white tracking-tight">
                  Mensajería Interna de Registros
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                    {unreadCount} sin leer
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Consultas y comunicaciones cruzadas sobre movimientos financieros
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Cerrar bandeja"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas de Filtro */}
        <div className="px-6 pt-3 pb-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('received')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'received'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Recibidos</span>
            {unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviados ({sentMessages.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <span>Todos ({messages.length})</span>
          </button>
        </div>

        {/* Lista de Mensajes */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/70">
          {displayedMessages.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
              <p className="text-sm font-semibold text-slate-600">No hay mensajes en esta bandeja</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Puedes iniciar una consulta desde el historial o la tabla de movimientos haciendo clic en "Consultar al creador".
              </p>
            </div>
          ) : (
            displayedMessages.map((msg) => {
              const isReceived = msg.recipientId === currentUser.id;
              const isUnread = isReceived && !msg.read;
              const linkedRecord = records.find(r => r.id === msg.recordId);
              const summary = linkedRecord ? {
                concept: linkedRecord.description || linkedRecord.category,
                amount: linkedRecord.amount,
                date: linkedRecord.date,
                type: linkedRecord.type,
                entityName: linkedRecord.entityName
              } : msg.recordSummary;

              return (
                <div 
                  key={msg.id}
                  className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
                    isUnread 
                      ? 'border-blue-300 ring-2 ring-blue-100 bg-blue-50/20' 
                      : 'border-slate-200'
                  }`}
                >
                  {/* Encabezado del mensaje */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${isUnread ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`} />
                      <div>
                        <span className="text-xs font-bold text-slate-800">
                          {isReceived ? `De: ${msg.senderName}` : `Para: ${msg.recipientName}`}
                        </span>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          <span>
                            {new Date(msg.createdAt).toLocaleString([], { 
                              day: '2-digit', 
                              month: '2-digit', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isUnread && (
                        <button
                          onClick={() => handleMarkRead(msg.id)}
                          disabled={processingId === msg.id}
                          className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Marcar este mensaje como leído"
                        >
                          <Check className="w-3 h-3" />
                          <span>Marcar leído</span>
                        </button>
                      )}
                      {msg.read && isReceived && (
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-0.5">
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                          <span>Leído</span>
                        </span>
                      )}
                      <button
                        onClick={() => handleReply(msg)}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Responder a este mensaje"
                      >
                        <Reply className="w-3 h-3" />
                        <span>Responder</span>
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo del mensaje */}
                  <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 mb-3 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {msg.messageText}
                  </div>

                  {/* Ficha contextual del registro referenciado */}
                  {summary && (
                    <div className="bg-slate-100/70 rounded-xl p-2.5 border border-slate-200/60 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          summary.type === 'sale' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-rose-100 text-rose-700'
                        }`}>
                          {summary.type === 'sale' ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                          <span>{summary.type === 'sale' ? 'Venta' : 'Gasto'}</span>
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {summary.concept}
                        </span>
                        {summary.entityName && (
                          <span className="text-[11px] text-slate-500 hidden sm:inline truncate">
                            ({summary.entityName})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-bold ${summary.type === 'sale' ? 'text-blue-600' : 'text-slate-900'}`}>
                          {formatCurrency(summary.amount, currencySymbol)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDisplayDate(summary.date)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Acceso Directo al Registro y Estado de Revisión */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Revisión:
                      </span>
                      {linkedRecord?.reviewStatus === 'pendiente' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          🟡 Pendiente
                        </span>
                      ) : linkedRecord?.reviewStatus === 'en_revision' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          🔵 En Revisión
                        </span>
                      ) : linkedRecord?.reviewStatus === 'resuelto' ? (
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
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewRecordDetail(msg)}
                        className="px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                        title="Ver toda la información completa del registro en un modal"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ver Ficha</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleViewOrEditRecord(msg)}
                        className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                        title="Abrir formulario detallado para editar este registro"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie del modal */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
