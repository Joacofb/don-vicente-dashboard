import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Check, 
  CloudCheck, 
  Clock, 
  Download, 
  ChevronDown, 
  Info, 
  HardDrive,
  Sparkles
} from 'lucide-react';
import { SaveStateInfo, AppUser, FinancialRecord } from '../types';
import { formatRelativeTime, exportFullBackupJSON } from '../utils/storageUtils';
import { SavedItem } from '../data/savedItemsData';

interface SaveStatusWidgetProps {
  lastSaveInfo: SaveStateInfo | null;
  onManualSave: () => void;
  currentUser: AppUser;
  records: FinancialRecord[];
  currencySymbol: string;
  users: AppUser[];
  savedConcepts: SavedItem[];
  savedEntities: SavedItem[];
}

export const SaveStatusWidget: React.FC<SaveStatusWidgetProps> = ({
  lastSaveInfo,
  onManualSave,
  currentUser,
  records,
  currencySymbol,
  users,
  savedConcepts,
  savedEntities,
}) => {
  const [isSavedSuccess, setIsSavedSuccess] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [, setTick] = useState<number>(0);

  // Actualizar el tiempo relativo cada 30 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleTriggerSave = () => {
    onManualSave();
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
    }, 2000);
  };

  const handleDownloadBackup = () => {
    exportFullBackupJSON({
      records,
      currencySymbol,
      users,
      savedConcepts,
      savedEntities,
    });
    setShowDropdown(false);
  };

  // Formato descriptivo del último guardado
  const getSaveDescription = (): { title: string; subtitle: string; isRecent: boolean } => {
    if (!lastSaveInfo) {
      return {
        title: 'Guardado local activo',
        subtitle: 'Sincronizado automáticamente',
        isRecent: true,
      };
    }

    const relative = formatRelativeTime(lastSaveInfo.timestamp);
    const origin = lastSaveInfo.type === 'manual' 
      ? `Manual por ${lastSaveInfo.savedBy || 'Usuario'}` 
      : 'Automático';

    return {
      title: isSavedSuccess ? '¡Guardado con éxito!' : 'Datos Guardados',
      subtitle: `${relative} (${origin})`,
      isRecent: true,
    };
  };

  const desc = getSaveDescription();

  return (
    <div className="relative shrink-0">
      <div className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/80 rounded-2xl p-1 transition-all whitespace-nowrap">
        {/* Botón Principal Guardar */}
        <button
          id="btn-trigger-save"
          type="button"
          onClick={handleTriggerSave}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
            isSavedSuccess
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-700 shadow-2xs border border-slate-200/60'
          }`}
          title="Guardar todos los cambios ahora"
        >
          {isSavedSuccess ? (
            <Check className="w-3.5 h-3.5 text-white animate-in zoom-in shrink-0" />
          ) : (
            <Save className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          )}
          <span>{isSavedSuccess ? '¡Guardado!' : 'Guardar'}</span>
        </button>

        {/* Descripción del Último Guardado */}
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-2 py-1 text-left hidden lg:flex flex-col justify-center cursor-pointer group whitespace-nowrap"
          title="Ver detalles de persistencia y opciones de respaldo"
        >
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
            <span className="text-[11px] font-bold text-slate-700 leading-tight group-hover:text-blue-600 transition-colors whitespace-nowrap">
              {desc.title}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 ml-0.5 shrink-0" />
          </div>
          <span className="text-[10px] text-slate-500 font-medium leading-tight truncate max-w-[140px] xl:max-w-[190px]">
            {desc.subtitle}
          </span>
        </button>
      </div>

      {/* Menú Desplegable con opciones de persistencia */}
      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setShowDropdown(false)} 
          />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-40 text-xs animate-in fade-in zoom-in-95">
            <div className="pb-2 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span>Persistencia de Datos Local</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Tus datos quedan guardados permanentemente en el navegador de este dispositivo.
              </p>
            </div>

            {/* Info del último guardado */}
            {lastSaveInfo && (
              <div className="bg-slate-50 rounded-xl p-2.5 mb-2 border border-slate-200/60 text-[11px] space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-500">Último guardado:</span>
                  <span className="font-semibold text-slate-800">
                    {formatRelativeTime(lastSaveInfo.timestamp)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-500">Tipo de guardado:</span>
                  <span className={`font-semibold ${lastSaveInfo.type === 'manual' ? 'text-blue-600' : 'text-emerald-600'}`}>
                    {lastSaveInfo.type === 'manual' ? 'Manual por usuario' : 'Automático'}
                  </span>
                </div>
                {lastSaveInfo.savedBy && (
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-500">Autorizado por:</span>
                    <span className="font-semibold text-slate-800">{lastSaveInfo.savedBy}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-600">
                  <span className="text-slate-500">Total transacciones:</span>
                  <span className="font-bold text-slate-900">{records.length}</span>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="space-y-1 pt-1">
              <button
                onClick={() => {
                  handleTriggerSave();
                  setShowDropdown(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 text-blue-700 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-blue-600" />
                <span>Forzar guardado ahora</span>
              </button>

              <button
                onClick={handleDownloadBackup}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Descargar copia de seguridad (JSON)</span>
              </button>

              <button
                onClick={() => {
                  setShowInfoModal(true);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600 font-medium flex items-center gap-2 cursor-pointer transition-colors text-[11px]"
              >
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>¿Cómo funciona la persistencia?</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal explicativo de Persistencia */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 text-left space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Persistencia de Datos</h3>
                  <p className="text-xs text-slate-500">¿Cómo se guardan tus registros?</p>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-800">1. Guardado Automático Instantáneo:</strong> Cada vez que agregas una venta, registras un gasto, editas o eliminas un registro, el sistema lo almacena de inmediato en el almacenamiento local permanente de tu navegador (<code className="bg-slate-100 px-1.5 py-0.5 rounded text-blue-700">localStorage</code>).
              </p>
              <p>
                <strong className="text-slate-800">2. Conservación entre sesiones:</strong> Si cierras la pestaña, apagas la computadora o reinicias el navegador, todos tus registros continúan exactamente donde los dejaste.
              </p>
              <p>
                <strong className="text-slate-800">3. Botón Manual de Guardado:</strong> Puedes pulsar el botón "Guardar" en cualquier momento para confirmar expresamente el almacenamiento y dejar constancia de la hora exacta y el usuario que autorizó el guardado.
              </p>
              <p>
                <strong className="text-slate-800">4. Respaldos Externos:</strong> Puedes descargar una copia de seguridad en formato JSON o exportar a Excel en cualquier momento para llevar tus datos a Google Drive, correo o memoria USB.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
