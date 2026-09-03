import React from 'react';
import { 
  TrendingUp, 
  Lightbulb, 
  HelpCircle, 
  ShieldCheck, 
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { FinancialRecord } from '../types';
import { formatCurrency } from '../utils/financeUtils';
import { getWeekRangeForDate, formatDateISO } from '../utils/dateUtils';

interface QuickInsightsBannerProps {
  records?: FinancialRecord[];
  currencySymbol: string;
}

export const QuickInsightsBanner: React.FC<QuickInsightsBannerProps> = ({
  records = [],
  currencySymbol,
}) => {
  const safeRecords = records || [];
  const todayStr = formatDateISO(new Date());
  const currentWeek = getWeekRangeForDate(todayStr);

  const currentWeekRecords = safeRecords.filter(
    r => r && r.date >= currentWeek.startDate && r.date <= currentWeek.endDate
  );

  const totalSalesWeek = currentWeekRecords
    .filter(r => r.type === 'sale')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpensesWeek = currentWeekRecords
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const netWeek = totalSalesWeek - totalExpensesWeek;
  const daysActive = new Set(currentWeekRecords.map(r => r.date)).size || 1;
  const avgDailySales = totalSalesWeek / daysActive;

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
      {/* Patrón de fondo sutil */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Lightbulb className="w-4 h-4" />
            <span>Base de Registro y Evaluación Financiera</span>
          </div>
          <h3 className="text-base font-bold text-slate-100">
            Estructura activa para captura y análisis de flujo de caja
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Puedes cargar ventas y gastos diarios al instante. Las evaluaciones semanales se generan en tiempo real y todos los datos se descargan estructurados en formato compatible con Google Sheets o Excel para análisis posteriores.
          </p>
        </div>

        {/* Mini métricas de resumen */}
        <div className="flex items-center gap-3 w-full md:w-auto bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl">
          <div className="text-center px-3 border-r border-slate-700/60">
            <div className="text-[10px] uppercase font-bold text-slate-400">Promedio Día</div>
            <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
              {formatCurrency(avgDailySales, currencySymbol)}
            </div>
          </div>
          <div className="text-center px-3">
            <div className="text-[10px] uppercase font-bold text-slate-400">Semana Actual</div>
            <div className={`text-sm font-extrabold mt-0.5 ${netWeek >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(netWeek, currencySymbol)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
