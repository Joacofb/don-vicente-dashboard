/**
 * Utilidades para manejo de fechas y semanas ISO
 */

const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_FULL_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];
const MONTHS_FULL_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 */
export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parsea string YYYY-MM-DD a objeto Date local
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formatea objeto Date a YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea fecha para mostrar (e.g., "Lun, 12 Oct 2026")
 */
export function formatDisplayDate(dateStr: string, includeYear = true): string {
  if (!dateStr) return '';
  const d = parseDate(dateStr);
  const dayName = DAYS_ES[d.getDay()];
  const dayNum = d.getDate();
  const monthName = MONTHS_ES[d.getMonth()];
  const year = d.getFullYear();
  return includeYear
    ? `${dayName}, ${dayNum} ${monthName} ${year}`
    : `${dayName}, ${dayNum} ${monthName}`;
}

/**
 * Obtiene el número de semana ISO y el año correspondiente
 */
export function getISOWeekAndYear(date: Date): { week: number; year: number; weekKey: string } {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // 0 = Lunes, 6 = Domingo
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  const year = new Date(firstThursday).getFullYear();
  const weekKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;
  return { week: weekNumber, year, weekKey };
}

/**
 * Obtiene el rango de fechas (Lunes a Domingo) para una fecha dada
 */
export function getWeekRangeForDate(dateStr: string): {
  startDate: string;
  endDate: string;
  formattedRange: string;
  weekNumber: number;
  year: number;
  weekKey: string;
  days: string[]; // 7 fechas YYYY-MM-DD
} {
  const d = parseDate(dateStr);
  const dayOfWeek = (d.getDay() + 6) % 7; // 0 para lunes, 6 para domingo
  
  const monday = new Date(d);
  monday.setDate(d.getDate() - dayOfWeek);
  
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    days.push(formatDateISO(dayDate));
  }

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startIso = formatDateISO(monday);
  const endIso = formatDateISO(sunday);
  const { week, year, weekKey } = getISOWeekAndYear(d);

  const startDay = monday.getDate();
  const startMonth = MONTHS_ES[monday.getMonth()];
  const endDay = sunday.getDate();
  const endMonth = MONTHS_ES[sunday.getMonth()];
  const formattedRange = `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;

  return {
    startDate: startIso,
    endDate: endIso,
    formattedRange,
    weekNumber: week,
    year,
    weekKey,
    days
  };
}

/**
 * Obtiene el nombre corto del día (Lun, Mar, etc.)
 */
export function getDayShortName(dateStr: string): string {
  const d = parseDate(dateStr);
  return DAYS_ES[d.getDay()];
}

export function getDayFullName(dateStr: string): string {
  const d = parseDate(dateStr);
  return DAYS_FULL_ES[d.getDay()];
}
