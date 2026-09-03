import * as XLSX from 'xlsx';
import { FinancialRecord, PAYMENT_METHODS } from '../types';
import { generateWeeklyReport, formatCurrency } from './financeUtils';
import { getISOWeekAndYear } from './dateUtils';

/**
 * Exporta los registros y resúmenes semanales a un archivo Excel (.xlsx)
 */
export function exportToExcel(records: FinancialRecord[], currencySymbol = '$', customFileName?: string) {
  const wb = XLSX.utils.book_new();

  // 1. Hoja de Detalle de Transacciones
  const transactionsData = records.map((r, index) => {
    const paymentLabel = PAYMENT_METHODS.find(p => p.id === r.paymentMethod)?.label || r.paymentMethod;
    const { week, year } = getISOWeekAndYear(new Date(r.date));
    return {
      'N°': index + 1,
      'Fecha': r.date,
      'Semana': `Semana ${week} (${year})`,
      'Tipo': r.type === 'sale' ? 'Venta (Ingreso)' : 'Gasto (Egreso)',
      'Categoría': r.category,
      'Monto': r.amount,
      'Moneda': currencySymbol,
      'Método de Pago': paymentLabel,
      'Concepto / Descripción': r.description || '',
      'Cliente / Proveedor': r.entityName || '',
      'Notas': r.notes || '',
      'Registrado por': r.createdByName || 'Sistema',
      'Fecha de Registro': r.createdAt ? new Date(r.createdAt).toLocaleString('es-ES') : ''
    };
  });

  const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
  
  // Configurar ancho de columnas
  wsTransactions['!cols'] = [
    { wch: 6 },  // N°
    { wch: 12 }, // Fecha
    { wch: 18 }, // Semana
    { wch: 16 }, // Tipo
    { wch: 24 }, // Categoría
    { wch: 14 }, // Monto
    { wch: 8 },  // Moneda
    { wch: 22 }, // Método de Pago
    { wch: 32 }, // Concepto / Descripción
    { wch: 26 }, // Cliente / Proveedor
    { wch: 20 }, // Notas
    { wch: 22 }, // Registrado por
    { wch: 20 }, // Fecha de Registro
  ];

  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Detalle_Transacciones');

  // 2. Hoja de Resumen por Semanas
  const weeksMap = new Map<string, FinancialRecord[]>();
  records.forEach(r => {
    const { weekKey } = getISOWeekAndYear(new Date(r.date));
    if (!weeksMap.has(weekKey)) {
      weeksMap.set(weekKey, []);
    }
    weeksMap.get(weekKey)!.push(r);
  });

  const weeklySummaryData: any[] = [];
  Array.from(weeksMap.entries()).forEach(([weekKey, recs]) => {
    if (recs.length > 0) {
      const report = generateWeeklyReport(records, recs[0].date);
      weeklySummaryData.push({
        'Semana': `Semana ${report.weekNumber} (${report.year})`,
        'Período': report.formattedRange,
        'Total Ventas': report.totalSales,
        'Total Gastos': report.totalExpenses,
        'Flujo Neto': report.netFlow,
        'Margen Ganancia %': `${report.marginPercent.toFixed(1)}%`,
        'Cant. Ventas': report.salesCount,
        'Cant. Gastos': report.expensesCount,
      });
    }
  });

  const wsWeekly = XLSX.utils.json_to_sheet(weeklySummaryData);
  wsWeekly['!cols'] = [
    { wch: 18 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsWeekly, 'Reporte_Semanal');

  // Guardar archivo
  const fileName = customFileName || `Control_Financiero_Ventas_Gastos_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Exporta los registros a un archivo CSV estándar
 */
export function exportToCSV(records: FinancialRecord[], currencySymbol = '$') {
  const headers = [
    'Fecha',
    'Tipo',
    'Categoria',
    'Monto',
    'Moneda',
    'Metodo_Pago',
    'Descripcion',
    'Cliente_Proveedor',
    'Notas'
  ];

  const rows = records.map(r => {
    const paymentLabel = PAYMENT_METHODS.find(p => p.id === r.paymentMethod)?.label || r.paymentMethod;
    return [
      `"${r.date}"`,
      `"${r.type === 'sale' ? 'Venta' : 'Gasto'}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      r.amount.toFixed(2),
      `"${currencySymbol}"`,
      `"${paymentLabel}"`,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${(r.entityName || '').replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Ventas_Gastos_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
