import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  RotateCcw, 
  Sparkles, 
  ChevronDown, 
  Calendar, 
  Layers,
  Users,
  ShieldCheck,
  UserCheck,
  Lock,
  Upload,
  Bookmark
} from 'lucide-react';
import { exportToExcel, exportToCSV } from '../utils/exportUtils';
import { FinancialRecord, AppUser } from '../types';
import { getTodayString, formatDisplayDate } from '../utils/dateUtils';

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
}

export const Header: React.FC<HeaderProps> = ({
  records,
  activeTab,
  currencySymbol,
  onResetData,
  onLoadDemoData,
  currentUser,
  onOpenUserModal,
  onOpenImportModal,
  onOpenCatalogModal,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  const getTitle = () => {
    switch (activeTab) {
      case 'entry':
        return 'Dashboard de Entrada';
      case 'history':
        return 'Historial de Movimientos';
      case 'report':
        return 'Reportes Semanales';
      default:
        return 'Control de Ventas y Gastos';
    }
  };

  const getSubtitle = () => {
    switch (activeTab) {
      case 'entry':
        return `Registros diarios sincronizables • ${formatDisplayDate(getTodayString(), false)}`;
      case 'history':
        return `${records.length} transacciones registradas`;
      case 'report':
        return 'Análisis de flujo financiero y balances';
      default:
        return '';
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
          {getTitle()}
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-500 hidden sm:block">
          {getSubtitle()}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Chip de Usuario Activo en Cabecera */}
        <button
          id="btn-header-user-profile"
          onClick={onOpenUserModal}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors text-left cursor-pointer group"
          title="Cambiar o configurar usuarios"
        >
          <div className={`w-7 h-7 rounded-lg ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-xs shadow-xs`}>
            {currentUser.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 leading-none group-hover:text-blue-600 transition-colors">
                {currentUser.name}
              </span>
              {isAdmin ? (
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {isAdmin ? 'Admin (Acceso Total)' : 'Operador (Entrada/Consulta)'}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
        </button>

        {/* Herramientas de Datos (Cargar Demo / Limpiar) - Exclusivo para Administrador */}
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setShowToolsMenu(!showToolsMenu)}
              className="p-2.5 sm:px-3 sm:py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Opciones de datos"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="hidden lg:inline">Opciones</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {showToolsMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowToolsMenu(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-40 text-xs">
                  {onOpenImportModal && (
                    <button
                      onClick={() => {
                        onOpenImportModal();
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-blue-600" />
                      Importar datos Excel/CSV
                    </button>
                  )}
                  {onOpenCatalogModal && (
                    <button
                      onClick={() => {
                        onOpenCatalogModal();
                        setShowToolsMenu(false);
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4 text-indigo-600" />
                      Catálogo de conceptos y clientes
                    </button>
                  )}
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => {
                      onLoadDemoData();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    Cargar datos de ejemplo
                  </button>
                  <button
                    onClick={() => {
                      onResetData();
                      setShowToolsMenu(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 font-medium flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-500" />
                    Borrar todos los datos
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Botón Principal: Sincronizar / Exportar a Excel (Solo Admin tiene permisos de exportación de libro completo) */}
        {isAdmin ? (
          <div className="relative">
            <button
              id="btn-export-excel"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-blue-600 text-white px-4 sm:px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 text-xs sm:text-sm active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel / Sheets</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-40 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-800">Descargar Formato</p>
                    <p className="text-[11px] text-slate-500">Listo para Excel o Google Sheets</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      exportToExcel(records, currencySymbol);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2.5 mt-1 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-semibold flex items-center gap-2.5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-slate-900 font-bold">Libro Excel (.xlsx)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Hojas con resumen y registros</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      exportToCSV(records);
                      setShowExportMenu(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50 text-slate-700 hover:text-blue-800 font-semibold flex items-center gap-2.5 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block text-slate-900 font-bold">Archivo CSV (.csv)</span>
                      <span className="text-[10px] text-slate-500 font-normal">Compatible con hojas de cálculo</span>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Modo Operador Activo</span>
          </div>
        )}
      </div>
    </header>
  );
};
