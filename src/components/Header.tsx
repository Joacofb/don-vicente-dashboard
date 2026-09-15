import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  RotateCcw, 
  Sparkles, 
  ChevronDown, 
  Users, 
  ShieldCheck, 
  Lock, 
  Upload, 
  Bookmark, 
  LogOut,
  PlusCircle,
  ListOrdered,
  BarChart3,
  Save,
  Check,
  HardDrive,
  Info,
  Layers,
  MessageSquare
} from 'lucide-react';
import { exportToExcel, exportToCSV } from '../utils/exportUtils';
import { FinancialRecord, AppUser, SaveStateInfo } from '../types';
import { getTodayString, formatDisplayDate } from '../utils/dateUtils';
import { formatRelativeTime, exportFullBackupJSON } from '../utils/storageUtils';
import { SavedItem } from '../data/savedItemsData';

interface HeaderProps {
  records: FinancialRecord[];
  activeTab: 'entry' | 'history' | 'report';
  setActiveTab: (tab: 'entry' | 'history' | 'report') => void;
  currencySymbol: string;
  setCurrencySymbol: (sym: string) => void;
  onResetData: () => void;
  onLoadDemoData: () => void;
  currentUser: AppUser;
  onOpenUserModal: () => void;
  onOpenImportModal?: () => void;
  onOpenCatalogModal?: () => void;
  lastSaveInfo: SaveStateInfo | null;
  onManualSave: () => void;
  onLockSession: () => void;
  users: AppUser[];
  savedConcepts: SavedItem[];
  savedEntities: SavedItem[];
  unreadMessagesCount?: number;
  onOpenMessagesInbox?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  records,
  activeTab,
  setActiveTab,
  currencySymbol,
  setCurrencySymbol,
  onResetData,
  onLoadDemoData,
  currentUser,
  onOpenUserModal,
  onOpenImportModal,
  onOpenCatalogModal,
  lastSaveInfo,
  onManualSave,
  onLockSession,
  users,
  savedConcepts,
  savedEntities,
  unreadMessagesCount = 0,
  onOpenMessagesInbox,
}) => {
  // Estados para los menús desplegables orgánicos
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [, setTick] = useState(0);

  // Actualizar el tiempo relativo del estado de persistencia
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = currentUser.role === 'admin';

  // Cerrar todos los menús
  const closeAllDropdowns = () => {
    setIsBrandMenuOpen(false);
    setShowSaveDropdown(false);
    setShowExportDropdown(false);
    setShowUserDropdown(false);
  };

  // Disparar guardado manual con feedback visual
  const handleTriggerSave = () => {
    onManualSave();
    setIsSavedSuccess(true);
    setTimeout(() => {
      setIsSavedSuccess(false);
    }, 2000);
  };

  // Descargar respaldo JSON completo
  const handleDownloadBackup = () => {
    exportFullBackupJSON({
      records,
      currencySymbol,
      users,
      savedConcepts,
      savedEntities,
    });
    closeAllDropdowns();
  };

  // Datos de la página actual para la nota superior
  const getActiveTabInfo = () => {
    switch (activeTab) {
      case 'entry':
        return { name: 'Nueva Entrada', icon: PlusCircle };
      case 'history':
        return { name: 'Registros', icon: ListOrdered };
      case 'report':
        return { name: 'Reportes', icon: BarChart3 };
      default:
        return { name: 'Panel', icon: Layers };
    }
  };

  const currentTab = getActiveTabInfo();
  const ActiveTabIcon = currentTab.icon;

  return (
    <>
      <header className="h-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-30 shadow-2xs">
        
        {/* ========================================================================= */}
        {/* SECCIÓN IZQUIERDA: Menú Desplegable DON VICENTE + "DASHBOARD" • Fecha • Nota */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          
          {/* Menú Desplegable Oscuro de DON VICENTE */}
          <div className="relative shrink-0">
            <button
              id="btn-brand-menu"
              onClick={() => {
                const next = !isBrandMenuOpen;
                closeAllDropdowns();
                setIsBrandMenuOpen(next);
              }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/10 border border-slate-800 transition-all cursor-pointer group active:scale-98 whitespace-nowrap"
              title="Menú desplegable principal DON VICENTE"
            >
              <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center font-black text-xs text-white shadow-xs shrink-0">
                DV
              </div>
              <div className="text-left hidden xs:block sm:block">
                <span className="font-extrabold tracking-tight text-white block text-xs leading-none">DON VICENTE</span>
                <span className="text-[9px] font-semibold text-blue-400 tracking-wider uppercase block leading-tight">Menú</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 shrink-0 ${isBrandMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Oscuro Navy con todas las opciones y módulos */}
            {isBrandMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={closeAllDropdowns} />
                <div className="absolute left-0 mt-2 w-76 sm:w-80 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 p-3 z-40 animate-in fade-in zoom-in-95 text-xs">
                  
                  {/* Encabezado del menú de marca */}
                  <div className="flex items-center gap-3 p-2 mb-2 border-b border-slate-800">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-md shadow-blue-500/30 shrink-0">
                      DV
                    </div>
                    <div>
                      <span className="text-sm font-extrabold tracking-tight text-white block leading-tight">DON VICENTE</span>
                      <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase">Dashboard Financiero</span>
                    </div>
                  </div>

                  {/* Módulos de Navegación */}
                  <div className="space-y-1">
                    <button
                      id="brand-nav-entry"
                      onClick={() => {
                        setActiveTab('entry');
                        closeAllDropdowns();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        activeTab === 'entry'
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80 font-medium'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-xs">Nueva Entrada</span>
                      {activeTab === 'entry' && (
                        <span className="text-[10px] bg-blue-700 text-blue-100 px-1.5 py-0.5 rounded font-semibold">
                          Activo
                        </span>
                      )}
                    </button>

                    <button
                      id="brand-nav-history"
                      onClick={() => {
                        setActiveTab('history');
                        closeAllDropdowns();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        activeTab === 'history'
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80 font-medium'
                      }`}
                    >
                      <ListOrdered className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-xs">Registros e Historial</span>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
                        {records.length}
                      </span>
                    </button>

                    <button
                      id="brand-nav-report"
                      onClick={() => {
                        setActiveTab('report');
                        closeAllDropdowns();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        activeTab === 'report'
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80 font-medium'
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-xs">Reportes Semanales</span>
                      {!isAdmin ? (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Admin
                        </span>
                      ) : (
                        activeTab === 'report' && (
                          <span className="text-[10px] bg-blue-700 text-blue-100 px-1.5 py-0.5 rounded font-semibold">
                            Activo
                          </span>
                        )
                      )}
                    </button>
                  </div>

                  {/* Herramientas Rápidas */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                      Herramientas Rápidas
                    </span>
                    <div className="space-y-0.5">
                      {onOpenCatalogModal && (
                        <button
                          onClick={() => {
                            onOpenCatalogModal();
                            closeAllDropdowns();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
                        >
                          <Bookmark className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span>Conceptos y Clientes frecuentes</span>
                        </button>
                      )}
                      {onOpenImportModal && (
                        <button
                          onClick={() => {
                            onOpenImportModal();
                            closeAllDropdowns();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          <span>Importar archivo Excel / CSV</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selector de Moneda */}
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800">
                    <div className="flex items-center justify-between mb-1.5 px-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Moneda Principal
                      </span>
                      {!isAdmin && (
                        <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Fija
                        </span>
                      )}
                    </div>
                    <select
                      aria-label="Moneda del sistema"
                      disabled={!isAdmin}
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      className={`w-full bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-3 py-2 outline-none ${
                        isAdmin ? 'cursor-pointer hover:border-slate-600' : 'opacity-70 cursor-not-allowed'
                      }`}
                    >
                      <option value="$">$ (Dólar / Peso)</option>
                      <option value="€">€ (Euro)</option>
                      <option value="S/.">S/. (Sol)</option>
                      <option value="Q">Q (Quetzal)</option>
                      <option value="Bs">Bs (Boliviano)</option>
                      <option value="R$">R$ (Real)</option>
                    </select>
                  </div>

                </div>
              </>
            )}
          </div>

          {/* Título Estricto Requerido: "DASHBOARD" + Fecha + Nota de la Página */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-wrap">
            <span className="text-sm sm:text-base font-black text-slate-900 tracking-wider uppercase whitespace-nowrap">
              DASHBOARD
            </span>
            <span className="text-slate-300 select-none hidden xs:inline">•</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 whitespace-nowrap hidden xs:inline">
              {formatDisplayDate(getTodayString(), true)}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200/70 text-slate-700 border border-slate-200/90 whitespace-nowrap transition-colors">
              <ActiveTabIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{currentTab.name}</span>
            </span>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* SECCIÓN DERECHA: 3 Botones Desplegables Orgánicos (Guardar, Archivos, Usuario) */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">

          {/* 1. BOTÓN DESPLEGABLE: Opciones de Guardado */}
          <div className="relative shrink-0">
            <button
              id="btn-dropdown-save"
              onClick={() => {
                const next = !showSaveDropdown;
                closeAllDropdowns();
                setShowSaveDropdown(next);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border active:scale-98 ${
                isSavedSuccess
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
              }`}
              title="Opciones de guardado y persistencia"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${isSavedSuccess ? 'bg-emerald-500 animate-ping' : 'bg-emerald-500'}`} />
              {isSavedSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <Save className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              )}
              <span className="hidden sm:inline">{isSavedSuccess ? '¡Guardado!' : 'Guardar'}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${showSaveDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSaveDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={closeAllDropdowns} />
                <div className="absolute right-0 mt-2 w-76 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-40 animate-in fade-in zoom-in-95 text-xs">
                  
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-800 font-bold">
                      <HardDrive className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Opciones de Guardado</span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Firestore Cloud
                    </span>
                  </div>

                  {/* Tarjeta con detalles de persistencia */}
                  {lastSaveInfo && (
                    <div className="bg-slate-50 rounded-xl p-2.5 mb-2.5 border border-slate-200/70 text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-500">Último guardado:</span>
                        <span className="font-semibold text-slate-800">
                          {formatRelativeTime(lastSaveInfo.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-500">Tipo:</span>
                        <span className={`font-semibold ${lastSaveInfo.type === 'manual' ? 'text-blue-600' : 'text-emerald-600'}`}>
                          {lastSaveInfo.type === 'manual' ? 'Manual por usuario' : 'Automático'}
                        </span>
                      </div>
                      {lastSaveInfo.savedBy && (
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-500">Autor:</span>
                          <span className="font-semibold text-slate-800">{lastSaveInfo.savedBy}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-slate-500">Total movimientos:</span>
                        <span className="font-bold text-slate-900">{records.length}</span>
                      </div>
                    </div>
                  )}

                  {/* Acciones del menú de guardado */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        handleTriggerSave();
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Save className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Guardar todo ahora</span>
                    </button>

                    <button
                      onClick={handleDownloadBackup}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Descargar copia de seguridad (.json)</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowInfoModal(true);
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-500 font-medium flex items-center gap-2 cursor-pointer transition-colors text-[11px]"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>¿Cómo funciona la persistencia?</span>
                    </button>
                  </div>

                </div>
              </>
            )}
          </div>

          {/* 2. BOTÓN DESPLEGABLE: Exportación e Importación de Archivos */}
          <div className="relative shrink-0">
            <button
              id="btn-dropdown-export"
              onClick={() => {
                const next = !showExportDropdown;
                closeAllDropdowns();
                setShowExportDropdown(next);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-98"
              title="Opciones de exportación e importación de archivos"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Exportar / Importar</span>
              <span className="sm:hidden">Archivos</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${showExportDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showExportDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={closeAllDropdowns} />
                <div className="absolute right-0 mt-2 w-76 sm:w-84 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-40 animate-in fade-in zoom-in-95 text-xs">
                  
                  {/* Encabezado */}
                  <div className="px-2 py-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Archivos y Datos</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Excel, CSV y Catálogos</span>
                  </div>

                  {/* Sección Exportación */}
                  <div className="mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                      Exportar Información
                    </span>
                    {isAdmin ? (
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            exportToExcel(records, currencySymbol);
                            closeAllDropdowns();
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold leading-none">Exportar a Excel (.xlsx)</span>
                            <span className="text-[10px] text-slate-400 font-normal">Formato oficial con fórmulas y diseño</span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            exportToCSV(records);
                            closeAllDropdowns();
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-800 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <Download className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold leading-none">Exportar a CSV (Sheets)</span>
                            <span className="text-[10px] text-slate-400 font-normal">Compatible con Google Sheets y Calc</span>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-[11px] flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>Exportación reservada para Administrador</span>
                      </div>
                    )}
                  </div>

                  {/* Sección Entrada y Catálogo */}
                  <div className="pt-2 border-t border-slate-100 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                      Carga y Herramientas
                    </span>
                    <div className="space-y-1">
                      {onOpenImportModal && (
                        <button
                          onClick={() => {
                            onOpenImportModal();
                            closeAllDropdowns();
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold leading-none">Importar archivo Excel / CSV</span>
                            <span className="text-[10px] text-slate-400 font-normal">Cargar movimientos desde archivo externo</span>
                          </div>
                        </button>
                      )}

                      {onOpenCatalogModal && (
                        <button
                          onClick={() => {
                            onOpenCatalogModal();
                            closeAllDropdowns();
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-slate-100 text-slate-700 font-medium flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                            <Bookmark className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold leading-none">Conceptos y Clientes</span>
                            <span className="text-[10px] text-slate-400 font-normal">Gestionar textos y entidades de autocompletado</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sección Mantenimiento (Solo Administrador) */}
                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                        Mantenimiento
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => {
                            onLoadDemoData();
                            closeAllDropdowns();
                          }}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="text-[11px] truncate">Cargar Demo</span>
                        </button>

                        <button
                          id="btn-reset-to-zero"
                          onClick={() => {
                            closeAllDropdowns();
                            onResetData();
                          }}
                          title="Reiniciar base de datos a cero (borrar todos los movimientos)"
                          className="p-2 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] truncate">Reiniciar a Cero</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}
          </div>

          {/* BOTÓN: Mensajería Interna de Registros */}
          {onOpenMessagesInbox && (
            <div className="relative shrink-0">
              <button
                id="btn-open-messages"
                onClick={() => {
                  closeAllDropdowns();
                  onOpenMessagesInbox();
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-semibold shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-98 ${
                  unreadMessagesCount > 0
                    ? 'bg-blue-50/80 hover:bg-blue-100/80 border-blue-300 text-blue-800 ring-2 ring-blue-100'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                }`}
                title="Mensajería interna y consultas entre operadores"
              >
                <div className="relative">
                  <MessageSquare className={`w-4 h-4 ${unreadMessagesCount > 0 ? 'text-blue-600' : 'text-slate-500'}`} />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-ping" />
                  )}
                </div>
                <span className="hidden md:inline">Mensajes</span>
                {unreadMessagesCount > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-2xs">
                    {unreadMessagesCount}
                  </span>
                ) : null}
              </button>
            </div>
          )}

          {/* 3. BOTÓN DESPLEGABLE: Usuario Activo y Sesión */}
          <div className="relative shrink-0">
            <button
              id="btn-dropdown-user"
              onClick={() => {
                const next = !showUserDropdown;
                closeAllDropdowns();
                setShowUserDropdown(next);
              }}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer whitespace-nowrap active:scale-98"
              title="Cuenta de usuario activa y control de turno"
            >
              <div className={`w-6 h-6 rounded-lg ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}>
                {currentUser.avatar || currentUser.name.charAt(0)}
              </div>
              <span className="font-bold text-slate-800 truncate max-w-[90px] sm:max-w-[120px] hidden xs:inline">
                {currentUser.name}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold hidden sm:inline-block ${
                isAdmin ? 'bg-blue-50 text-blue-700 border border-blue-200/60' : 'bg-slate-100 text-slate-600'
              }`}>
                {isAdmin ? 'Admin' : 'Operador'}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${showUserDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showUserDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={closeAllDropdowns} />
                <div className="absolute right-0 mt-2 w-68 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-40 animate-in fade-in zoom-in-95 text-xs">
                  
                  {/* Tarjeta de Usuario */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 mb-2 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0`}>
                      {currentUser.avatar || currentUser.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 block truncate text-xs leading-tight">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {isAdmin ? 'Administrador General' : 'Operador de Turno'}
                      </span>
                    </div>
                  </div>

                  {/* Acciones de Cuenta */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        onOpenUserModal();
                        closeAllDropdowns();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Users className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Cambiar de usuario / Cuentas</span>
                    </button>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          closeAllDropdowns();
                          onLockSession();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>Bloquear pantalla / Cerrar sesión</span>
                      </button>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>

        </div>

      </header>

      {/* ========================================================================= */}
      {/* MODAL INFORMATIVO DE PERSISTENCIA */}
      {/* ========================================================================= */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div 
            className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 text-left space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Persistencia de Datos</h3>
                  <p className="text-xs text-slate-500">Almacenamiento seguro en tu navegador</p>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                <strong className="text-slate-800">1. Guardado Automático Instantáneo:</strong> Cada vez que registras una venta, agregas un gasto, editas o eliminas una transacción, se guarda inmediatamente en el almacenamiento seguro de tu navegador.
              </p>
              <p>
                <strong className="text-slate-800">2. Seguridad al cerrar o recargar:</strong> Puedes cerrar la ventana, recargar la página o reiniciar la computadora; todos los movimientos permanecen intactos en este equipo.
              </p>
              <p>
                <strong className="text-slate-800">3. Botón Manual de Guardado:</strong> Puedes pulsar el botón "Guardar" para registrar de forma explícita el usuario y la hora exacta de la confirmación.
              </p>
              <p>
                <strong className="text-slate-800">4. Respaldos Externos:</strong> Te recomendamos descargar periódicamente copias en formato JSON o libros Excel para resguardar tus datos en Google Drive o unidades USB.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
