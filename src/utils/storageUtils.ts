import { FinancialRecord, AppUser, SaveStateInfo } from '../types';
import { SavedItem } from '../data/savedItemsData';

export const LOCAL_STORAGE_KEY_LAST_SAVED = 'fin_control_last_saved_v1';

/**
 * Obtiene la información del último guardado realizado
 */
export function getStoredLastSaveInfo(): SaveStateInfo | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_SAVED);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error al recuperar información de último guardado:', err);
  }
  return null;
}

/**
 * Guarda en localStorage los metadatos del guardado
 */
export function saveStoredLastSaveInfo(info: SaveStateInfo): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_LAST_SAVED, JSON.stringify(info));
  } catch (err) {
    console.error('Error al almacenar información de último guardado:', err);
  }
}

/**
 * Formatea una fecha ISO en tiempo relativo amigable en español
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recientemente';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 15) return 'Hace unos instantes';
    if (diffSecs < 60) return `Hace ${diffSecs} segundos`;
    if (diffMins === 1) return 'Hace 1 minuto';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    // Si es hoy, mostrar hora
    const isToday = now.toDateString() === date.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Hoy a las ${timeStr}`;
    }

    // Ayer
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (yesterday.toDateString() === date.toDateString()) {
      return `Ayer a las ${timeStr}`;
    }

    return `${date.toLocaleDateString([], { day: '2-digit', month: '2-digit' })} a las ${timeStr}`;
  } catch {
    return 'Recientemente';
  }
}

/**
 * Descarga una copia de seguridad completa del sistema en formato JSON
 */
export function exportFullBackupJSON(data: {
  records: FinancialRecord[];
  currencySymbol: string;
  users: AppUser[];
  savedConcepts: SavedItem[];
  savedEntities: SavedItem[];
}): void {
  const payload = {
    appName: 'DON VICENTE Dashboard',
    backupDate: new Date().toISOString(),
    version: '1.0',
    totalRecords: data.records.length,
    currencySymbol: data.currencySymbol,
    records: data.records,
    users: data.users,
    savedConcepts: data.savedConcepts,
    savedEntities: data.savedEntities,
  };

  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(payload, null, 2))}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute(
    'download',
    `DON_VICENTE_Backup_${new Date().toISOString().split('T')[0]}_${Date.now().toString().slice(-4)}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
