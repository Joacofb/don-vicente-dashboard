import React from 'react';
import { 
  PlusCircle, 
  ListOrdered, 
  BarChart3, 
  TrendingUp, 
  FileSpreadsheet, 
  RotateCcw,
  Sparkles,
  DollarSign,
  Users,
  ShieldCheck,
  UserCheck,
  Lock,
  Upload,
  Bookmark
} from 'lucide-react';
import { FinancialRecord, AppUser } from '../types';
import { formatCurrency } from '../utils/financeUtils';

interface SidebarProps {
  activeTab: 'entry' | 'history' | 'report';
  setActiveTab: (tab: 'entry' | 'history' | 'report') => void;
  records: FinancialRecord[];
  currencySymbol: string;
  setCurrencySymbol: (sym: string) => void;
  onLoadDemoData: () => void;
  onResetData: () => void;
  currentUser: AppUser;
  onOpenUserModal: () => void;
  onOpenImportModal?: () => void;
  onOpenCatalogModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  records,
  currencySymbol,
  setCurrencySymbol,
  onLoadDemoData,
  onResetData,
  currentUser,
  onOpenUserModal,
  onOpenImportModal,
  onOpenCatalogModal,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const totalSales = records.filter(r => r.type === 'sale').reduce((acc, r) => acc + r.amount, 0);
  const totalExpenses = records.filter(r => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);
  const net = totalSales - totalExpenses;

  return (
    <aside className="w-full lg:w-64 bg-slate-900 text-white flex flex-col shrink-0 border-r border-slate-800">
      <div className="p-6 lg:p-8 flex-1 flex flex-col">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 mb-8 lg:mb-10">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-lg shadow-blue-500/30">
            DV
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-white block leading-tight">DON VICENTE</span>
            <span className="text-[11px] font-semibold text-blue-400 tracking-wider uppercase">Dashboard</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-2">
          <button
            id="nav-btn-entry"
            onClick={() => setActiveTab('entry')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
              activeTab === 'entry'
                ? 'bg-white/10 text-blue-400 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
            }`}
          >
            <PlusCircle className={`w-5 h-5 ${activeTab === 'entry' ? 'text-blue-400' : 'text-slate-400'}`} />
            <span className="text-sm">Nueva Entrada</span>
          </button>

          <button
            id="nav-btn-history"
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white/10 text-blue-400 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
            }`}
          >
            <ListOrdered className={`w-5 h-5 ${activeTab === 'history' ? 'text-blue-400' : 'text-slate-400'}`} />
            <span className="text-sm flex-1">Registros</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-bold">
              {records.length}
            </span>
          </button>

          <button
            id="nav-btn-report"
            onClick={() => setActiveTab('report')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all relative cursor-pointer ${
              activeTab === 'report'
                ? 'bg-white/10 text-blue-400 font-semibold shadow-inner'
                : 'text-slate-400 hover:text-white hover:bg-white/5 font-medium'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${activeTab === 'report' ? 'text-blue-400' : 'text-slate-400'}`} />
            <span className="text-sm flex-1">Reportes</span>
            {!isAdmin && (
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-md flex items-center gap-1 font-bold">
                <Lock className="w-2.5 h-2.5" />
                Admin
              </span>
            )}
          </button>

          {/* Enlaces de Utilidad Rápida */}
          <div className="pt-2 space-y-1">
            {onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-blue-400" />
                <span>Importar Excel / CSV</span>
              </button>
            )}
            {onOpenCatalogModal && (
              <button
                onClick={onOpenCatalogModal}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-left text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                <Bookmark className="w-4 h-4 text-indigo-400" />
                <span>Conceptos y Clientes</span>
              </button>
            )}
          </div>
        </nav>

        {/* Currency Selector Pill */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
              Moneda Principal
            </label>
            {!isAdmin && (
              <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Fija
              </span>
            )}
          </div>
          <div className="relative">
            <select
              aria-label="Seleccionar Moneda"
              disabled={!isAdmin}
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              className={`w-full bg-slate-800 border border-slate-700/80 text-white text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 ${
                isAdmin ? 'cursor-pointer' : 'opacity-75 cursor-not-allowed'
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

      </div>
    </aside>
  );
};
