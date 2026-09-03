import * as XLSX from 'xlsx';
import { FinancialRecord, TransactionType, PaymentMethod, DEFAULT_SALE_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../types';
import { formatDateISO } from './dateUtils';

export interface ImportResult {
  records: FinancialRecord[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
  warnings: string[];
  dateRange?: { start: string; end: string };
  totalSalesAmount: number;
  totalExpensesAmount: number;
  discoveredConcepts: string[];
  discoveredEntities: string[];
}

/**
 * Normaliza nombres de encabezados para mapeo flexible
 */
function cleanHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9]/g, ''); // Quitar espacios y caracteres especiales
}

/**
 * Normaliza fechas provenientes de Excel (números de serie, strings de varios formatos o Date)
 */
function normalizeDate(rawDate: any): string | null {
  if (!rawDate) return null;

  // Si ya es un objeto Date
  if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
    return formatDateISO(rawDate);
  }

  // Si es un número serial de Excel (ej. 45123)
  if (typeof rawDate === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const dateObj = new Date(excelEpoch.getTime() + rawDate * 86400000);
    if (!isNaN(dateObj.getTime())) {
      return formatDateISO(dateObj);
    }
  }

  const str = String(rawDate).trim();
  if (!str) return null;

  // Formato ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  // Formato DD/MM/YYYY o DD-MM-YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }

  // Formato YYYY/MM/DD
  const yyyymmdd = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (yyyymmdd) {
    const year = yyyymmdd[1];
    const month = yyyymmdd[2].padStart(2, '0');
    const day = yyyymmdd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Intento con Date.parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return formatDateISO(parsed);
  }

  return null;
}

/**
 * Normaliza montos monetarios desde strings o números
 */
function normalizeAmount(rawAmount: any): number {
  if (typeof rawAmount === 'number') {
    return Math.abs(rawAmount);
  }
  if (!rawAmount) return 0;

  let str = String(rawAmount).trim();
  // Quitar símbolos de moneda, letras y espacios
  str = str.replace(/[$€£S/.,\s]/g, (match, offset, fullStr) => {
    // Preservar separador decimal si es el último punto o coma
    const lastComma = fullStr.lastIndexOf(',');
    const lastDot = fullStr.lastIndexOf('.');
    if (offset === lastComma && lastComma > lastDot) return '.';
    if (offset === lastDot && lastDot > lastComma) return '.';
    return '';
  });

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Math.abs(parsed);
}

/**
 * Normaliza tipo de transacción
 */
function normalizeType(rawType: any, amount?: number): TransactionType {
  const str = String(rawType || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (str.includes('vent') || str.includes('ingres') || str.includes('sale') || str.includes('income') || str.includes('cobro')) {
    return 'sale';
  }
  if (str.includes('gast') || str.includes('egres') || str.includes('expense') || str.includes('compra') || str.includes('pago') || str.includes('cost')) {
    return 'expense';
  }
  // Si no se especifica y el monto es positivo por defecto es venta, salvo indicación
  return 'sale';
}

/**
 * Normaliza método de pago
 */
function normalizePaymentMethod(rawMethod: any): PaymentMethod {
  const str = String(rawMethod || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (str.includes('efect') || str.includes('cash')) return 'cash';
  if (str.includes('transf') || str.includes('banco') || str.includes('wire')) return 'transfer';
  if (str.includes('tarjet') || str.includes('card') || str.includes('pos') || str.includes('debit') || str.includes('credit card')) return 'card';
  if (str.includes('credito') || str.includes('cuenta corriente') || str.includes('fiado')) return 'credit';
  return 'other';
}

/**
 * Procesa un archivo Excel o CSV y retorna registros financieros listos para importar
 */
export async function parseImportFile(
  file: File,
  currentUserId: string,
  currentUserName: string
): Promise<ImportResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, {
    type: 'array',
    cellDates: true,
    cellText: false,
  });

  // Elegir la mejor hoja (buscar 'Detalle_Transacciones' o la primera con filas)
  let selectedSheetName = workbook.SheetNames[0];
  const preferredSheet = workbook.SheetNames.find(s => 
    s.toLowerCase().includes('detalle') || 
    s.toLowerCase().includes('transaccion') || 
    s.toLowerCase().includes('registro') ||
    s.toLowerCase().includes('movimiento')
  );
  if (preferredSheet) {
    selectedSheetName = preferredSheet;
  }

  const sheet = workbook.Sheets[selectedSheetName];
  if (!sheet) {
    throw new Error('El archivo no contiene hojas con datos válidos.');
  }

  // Convertir a matriz de objetos con encabezados
  const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, {
    defval: '',
    raw: false,
    blankrows: false,
  });

  if (rawRows.length === 0) {
    throw new Error('La hoja seleccionada está vacía. Verifica que contenga filas con datos.');
  }

  // Identificar nombres de columnas disponibles
  const sampleRow = rawRows[0];
  const originalKeys = Object.keys(sampleRow);
  const cleanKeyMap = new Map<string, string>(); // cleanedKey -> originalKey

  originalKeys.forEach(k => {
    cleanKeyMap.set(cleanHeader(k), k);
  });

  // Buscadores de campos clave
  const findOriginalKey = (candidates: string[]): string | undefined => {
    for (const c of candidates) {
      const cleanCandidate = cleanHeader(c);
      for (const [cleaned, orig] of cleanKeyMap.entries()) {
        if (cleaned === cleanCandidate || cleaned.includes(cleanCandidate)) {
          return orig;
        }
      }
    }
    return undefined;
  };

  const keyDate = findOriginalKey(['fecha', 'date', 'dia', 'fecharegistro', 'fecha_registro']);
  const keyType = findOriginalKey(['tipo', 'type', 'movimiento', 'tipomovimiento', 'tipo_transaccion']);
  const keyCategory = findOriginalKey(['categoria', 'rubro', 'clasificacion', 'category']);
  const keyAmount = findOriginalKey(['monto', 'amount', 'importe', 'valor', 'total', 'precio']);
  const keyDescription = findOriginalKey(['descripcion', 'concepto', 'description', 'detalle', 'motivo', 'glosa']);
  const keyEntity = findOriginalKey(['cliente', 'proveedor', 'clienteproveedor', 'pagador', 'receptor', 'entidad', 'entity', 'tercero', 'empresa']);
  const keyPayment = findOriginalKey(['metodo', 'metododepago', 'metodopago', 'formapago', 'mediopago', 'payment']);
  const keyNotes = findOriginalKey(['notas', 'observaciones', 'comentarios', 'notes']);
  const keyUser = findOriginalKey(['usuario', 'user', 'registradopor', 'operador', 'createdby']);

  const validRecords: FinancialRecord[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  let totalSalesAmount = 0;
  let totalExpensesAmount = 0;
  const discoveredConceptsSet = new Set<string>();
  const discoveredEntitiesSet = new Set<string>();

  const todayStr = formatDateISO(new Date());

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // Considerando fila de encabezados como 1

    // 1. Extraer y validar Fecha
    const rawDateVal = keyDate ? row[keyDate] : undefined;
    const date = normalizeDate(rawDateVal) || todayStr;

    // 2. Extraer Monto
    const rawAmountVal = keyAmount ? row[keyAmount] : undefined;
    const amount = normalizeAmount(rawAmountVal);

    if (amount <= 0) {
      warnings.push(`Fila ${rowNum}: Monto inválido o en cero (${rawAmountVal || 'vacío'}). Se omite.`);
      return;
    }

    // 3. Extraer Tipo
    const rawTypeVal = keyType ? row[keyType] : undefined;
    const type = normalizeType(rawTypeVal);

    // 4. Extraer Categoría
    let category = keyCategory ? String(row[keyCategory] || '').trim() : '';
    if (!category) {
      category = type === 'sale' ? DEFAULT_SALE_CATEGORIES[0] : DEFAULT_EXPENSE_CATEGORIES[0];
    }

    // 5. Concepto / Descripción
    const description = keyDescription ? String(row[keyDescription] || '').trim() : '';
    if (description) {
      discoveredConceptsSet.add(description);
    }

    // 6. Cliente / Proveedor
    const entityName = keyEntity ? String(row[keyEntity] || '').trim() : '';
    if (entityName) {
      discoveredEntitiesSet.add(entityName);
    }

    // 7. Método de Pago
    const rawPaymentVal = keyPayment ? row[keyPayment] : undefined;
    const paymentMethod = normalizePaymentMethod(rawPaymentVal);

    // 8. Notas
    const notes = keyNotes ? String(row[keyNotes] || '').trim() : undefined;

    // 9. Usuario
    const userVal = keyUser ? String(row[keyUser] || '').trim() : '';
    const createdByName = userVal || currentUserName;

    const record: FinancialRecord = {
      id: `import-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      date,
      type,
      category,
      amount,
      description: description || (type === 'sale' ? 'Venta importada' : 'Gasto importado'),
      paymentMethod,
      entityName: entityName || undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      createdBy: currentUserId,
      createdByName,
    };

    if (type === 'sale') {
      totalSalesAmount += amount;
    } else {
      totalExpensesAmount += amount;
    }

    validRecords.push(record);
  });

  if (validRecords.length === 0) {
    throw new Error('No se encontraron registros con formato válido ni montos positivos para importar.');
  }

  // Ordenar cronológicamente descendente
  validRecords.sort((a, b) => b.date.localeCompare(a.date));

  const start = validRecords[validRecords.length - 1].date;
  const end = validRecords[0].date;

  return {
    records: validRecords,
    totalRows: rawRows.length,
    validRows: validRecords.length,
    invalidRows: rawRows.length - validRecords.length,
    errors,
    warnings,
    dateRange: { start, end },
    totalSalesAmount,
    totalExpensesAmount,
    discoveredConcepts: Array.from(discoveredConceptsSet),
    discoveredEntities: Array.from(discoveredEntitiesSet),
  };
}

/**
 * Genera y descarga una plantilla vacía de ejemplo en Excel (.xlsx) lista para completar
 */
export function downloadExcelTemplate(currencySymbol = '$') {
  const wb = XLSX.utils.book_new();

  const templateData = [
    {
      'Fecha': '2026-08-01',
      'Tipo': 'Venta',
      'Categoría': 'Venta de Productos',
      'Monto': 15000.00,
      'Moneda': currencySymbol,
      'Método de Pago': 'Transferencia Bancaria',
      'Concepto / Descripción': 'Venta mayorista mercadería lote #4',
      'Cliente / Proveedor': 'Distribuidora San Martín',
      'Notas': 'Factura A-0043',
      'Registrado por': 'Joaquín (Administrador)'
    },
    {
      'Fecha': '2026-08-02',
      'Tipo': 'Gasto',
      'Categoría': 'Materia Prima / Mercadería',
      'Monto': 6200.50,
      'Moneda': currencySymbol,
      'Método de Pago': 'Efectivo',
      'Concepto / Descripción': 'Compra de insumos y cajas',
      'Cliente / Proveedor': 'Papelera Central',
      'Notas': 'Comprobante recibo #982',
      'Registrado por': 'Operador 1 (Caja)'
    },
    {
      'Fecha': '2026-08-03',
      'Tipo': 'Venta',
      'Categoría': 'Servicios Prestados',
      'Monto': 8400.00,
      'Moneda': currencySymbol,
      'Método de Pago': 'Tarjeta (Débito/Crédito)',
      'Concepto / Descripción': 'Servicio de mantenimiento mensual',
      'Cliente / Proveedor': 'Empresa Alfa S.A.',
      'Notas': '',
      'Registrado por': 'Operador 2 (Auxiliar)'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  ws['!cols'] = [
    { wch: 14 }, // Fecha
    { wch: 12 }, // Tipo
    { wch: 26 }, // Categoría
    { wch: 14 }, // Monto
    { wch: 8 },  // Moneda
    { wch: 24 }, // Método de Pago
    { wch: 36 }, // Concepto / Descripción
    { wch: 28 }, // Cliente / Proveedor
    { wch: 20 }, // Notas
    { wch: 24 }, // Registrado por
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla_Importacion');
  XLSX.writeFile(wb, 'Plantilla_Importar_Ventas_Gastos.xlsx');
}
