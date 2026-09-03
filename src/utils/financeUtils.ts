import { FinancialRecord, WeeklyReport, CategoryBreakdown, DaySummary } from '../types';
import { getISOWeekAndYear, getWeekRangeForDate, parseDate, getDayShortName } from './dateUtils';

/**
 * Formatea un monto a moneda legible
 */
export function formatCurrency(amount: number, symbol = '$'): string {
  const formattedNumber = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const sign = amount < 0 ? '-' : '';
  return `${sign}${symbol}${formattedNumber}`;
}

/**
 * Genera el reporte semanal para una semana dada
 */
export function generateWeeklyReport(
  records: FinancialRecord[],
  targetDateStr: string,
  previousWeekRecords?: FinancialRecord[]
): WeeklyReport {
  const weekInfo = getWeekRangeForDate(targetDateStr);
  
  // Filtrar registros que caen dentro de esta semana
  const currentWeekRecords = records.filter(r => r.date >= weekInfo.startDate && r.date <= weekInfo.endDate);

  let totalSales = 0;
  let totalExpenses = 0;
  let salesCount = 0;
  let expensesCount = 0;

  const salesByCategory: Record<string, { amount: number; count: number }> = {};
  const expensesByCategory: Record<string, { amount: number; count: number }> = {};

  // Inicializar desglose diario para los 7 días
  const dailyMap: Record<string, { sales: number; expenses: number; salesCount: number; expensesCount: number }> = {};
  weekInfo.days.forEach(day => {
    dailyMap[day] = { sales: 0, expenses: 0, salesCount: 0, expensesCount: 0 };
  });

  currentWeekRecords.forEach(record => {
    const amt = Number(record.amount) || 0;
    if (record.type === 'sale') {
      totalSales += amt;
      salesCount++;
      if (dailyMap[record.date]) {
        dailyMap[record.date].sales += amt;
        dailyMap[record.date].salesCount++;
      }
      if (!salesByCategory[record.category]) {
        salesByCategory[record.category] = { amount: 0, count: 0 };
      }
      salesByCategory[record.category].amount += amt;
      salesByCategory[record.category].count++;
    } else {
      totalExpenses += amt;
      expensesCount++;
      if (dailyMap[record.date]) {
        dailyMap[record.date].expenses += amt;
        dailyMap[record.date].expensesCount++;
      }
      if (!expensesByCategory[record.category]) {
        expensesByCategory[record.category] = { amount: 0, count: 0 };
      }
      expensesByCategory[record.category].amount += amt;
      expensesByCategory[record.category].count++;
    }
  });

  const netFlow = totalSales - totalExpenses;
  const marginPercent = totalSales > 0 ? (netFlow / totalSales) * 100 : 0;

  const dailyBreakdown: DaySummary[] = weekInfo.days.map(dayStr => {
    const data = dailyMap[dayStr] || { sales: 0, expenses: 0, salesCount: 0, expensesCount: 0 };
    const d = parseDate(dayStr);
    return {
      date: dayStr,
      dayName: getDayShortName(dayStr),
      formattedDate: `${d.getDate()}/${d.getMonth() + 1}`,
      sales: data.sales,
      expenses: data.expenses,
      net: data.sales - data.expenses,
      salesCount: data.salesCount,
      expensesCount: data.expensesCount,
    };
  });

  const topExpenseCategories: CategoryBreakdown[] = Object.entries(expensesByCategory)
    .map(([cat, val]) => ({
      category: cat,
      amount: val.amount,
      percentage: totalExpenses > 0 ? (val.amount / totalExpenses) * 100 : 0,
      count: val.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topSaleCategories: CategoryBreakdown[] = Object.entries(salesByCategory)
    .map(([cat, val]) => ({
      category: cat,
      amount: val.amount,
      percentage: totalSales > 0 ? (val.amount / totalSales) * 100 : 0,
      count: val.count,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Comparativa con la semana anterior si existe
  let previousWeekComparison: WeeklyReport['previousWeekComparison'] = undefined;
  if (previousWeekRecords) {
    const prevSales = previousWeekRecords.filter(r => r.type === 'sale').reduce((acc, curr) => acc + curr.amount, 0);
    const prevExpenses = previousWeekRecords.filter(r => r.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const prevNet = prevSales - prevExpenses;

    const calcDiff = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return ((curr - prev) / Math.abs(prev)) * 100;
    };

    previousWeekComparison = {
      salesDiffPercent: calcDiff(totalSales, prevSales),
      expensesDiffPercent: calcDiff(totalExpenses, prevExpenses),
      netDiffPercent: calcDiff(netFlow, prevNet),
    };
  }

  return {
    weekKey: weekInfo.weekKey,
    weekNumber: weekInfo.weekNumber,
    year: weekInfo.year,
    startDate: weekInfo.startDate,
    endDate: weekInfo.endDate,
    formattedRange: weekInfo.formattedRange,
    totalSales,
    totalExpenses,
    netFlow,
    marginPercent,
    salesCount,
    expensesCount,
    dailyBreakdown,
    topExpenseCategories,
    topSaleCategories,
    previousWeekComparison,
  };
}

/**
 * Obtiene lista de todas las semanas únicas presentes en los registros
 */
export function getAvailableWeeks(records: FinancialRecord[]): { weekKey: string; label: string; sampleDate: string }[] {
  const weeksMap = new Map<string, { label: string; sampleDate: string; dateVal: number }>();

  // Asegurar que la semana actual esté siempre presente
  const today = new Date();
  const currentWeekInfo = getWeekRangeForDate(today.toISOString().split('T')[0]);
  weeksMap.set(currentWeekInfo.weekKey, {
    label: `Semana ${currentWeekInfo.weekNumber} (${currentWeekInfo.formattedRange}) - Actual`,
    sampleDate: currentWeekInfo.startDate,
    dateVal: parseDate(currentWeekInfo.startDate).getTime(),
  });

  records.forEach(r => {
    const info = getWeekRangeForDate(r.date);
    if (!weeksMap.has(info.weekKey)) {
      weeksMap.set(info.weekKey, {
        label: `Semana ${info.weekNumber} (${info.formattedRange})`,
        sampleDate: info.startDate,
        dateVal: parseDate(info.startDate).getTime(),
      });
    }
  });

  return Array.from(weeksMap.entries())
    .sort((a, b) => b[1].dateVal - a[1].dateVal)
    .map(([weekKey, data]) => ({
      weekKey,
      label: data.label,
      sampleDate: data.sampleDate,
    }));
}
