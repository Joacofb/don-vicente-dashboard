import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => Promise<void>;
  recordsCount: number;
  isAdmin: boolean;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  recordsCount,
  isAdmin,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [confirmedCheck, setConfirmedCheck] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!isAdmin || isProcessing) return;
    setIsProcessing(true);
    setErrorMessage('');
    try {
      await onConfirmReset();
      setIsProcessing(false);
      onClose();
    } catch (err: unknown) {
      console.error('Error al reiniciar base de datos:', err);
      const msg = err instanceof Error ? err.message : 'Error desconocido al limpiar Firestore';
      setErrorMessage(`No se pudo completar el reinicio: ${msg}`);
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) {
          onClose();
        }
      }}
    >
      <div 
        id="modal-reset-confirm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-reset-title"
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header con acento de advertencia */}
        <div className="bg-rose-50/80 border-b border-rose-100 p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-reset-title" className="text-base font-bold text-slate-900">
                Reiniciar Base de Datos a Cero
              </h2>
              <p className="text-xs text-rose-600 font-medium">
                Eliminación permanente de movimientos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Cerrar modal"
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-6 space-y-4">
          {!isAdmin ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Acceso restringido</p>
                <p>Solo el usuario con rol de <strong>Administrador</strong> puede reiniciar la base de datos.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  Esta operación eliminará de forma permanente los{' '}
                  <strong className="text-slate-900 font-bold bg-rose-100/60 px-1.5 py-0.5 rounded text-rose-700">
                    {recordsCount} {recordsCount === 1 ? 'registro' : 'registros'}
                  </strong>{' '}
                  actuales (ventas y gastos) tanto de la memoria local como de la base de datos en la nube (Firebase Firestore).
                </p>
                <p className="text-slate-500">
                  La tabla quedará en <strong className="text-slate-800 font-semibold">0 movimientos</strong> para que puedas comenzar tus pruebas limpias desde cero. Los usuarios y catálogos se conservarán intactos.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="checkbox-confirm-wipe"
                  checked={confirmedCheck}
                  onChange={(e) => setConfirmedCheck(e.target.checked)}
                  disabled={isProcessing}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer h-4 w-4"
                />
                <label 
                  htmlFor="checkbox-confirm-wipe"
                  className="text-xs text-slate-700 font-medium cursor-pointer select-none"
                >
                  Entiendo que esta acción es definitiva e irreversible. Deseo borrar todos los movimientos ahora.
                </label>
              </div>

              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer con botones de acción */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
          >
            {isAdmin ? 'Cancelar' : 'Cerrar'}
          </button>

          {isAdmin && (
            <button
              id="btn-confirm-reset-zero"
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing || !confirmedCheck}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-all shadow-sm flex items-center gap-2 ${
                isProcessing || !confirmedCheck
                  ? 'bg-rose-300 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 cursor-pointer active:scale-98'
              }`}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Eliminando en Firestore...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Todo y Reiniciar a Cero</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
