import { AppUser } from '../types';

export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-admin',
    name: 'Joaquín (Administrador)',
    role: 'admin',
    roleLabel: 'Administrador General',
    avatarColor: 'bg-blue-600',
    description: 'Control total: Gestión de usuarios, eliminación, reportes avanzados y exportación a Excel.',
    pin: '1234',
  },
  {
    id: 'user-op1',
    name: 'Operador 1 (Caja)',
    role: 'operator',
    roleLabel: 'Operador de Caja',
    avatarColor: 'bg-emerald-600',
    description: 'Permiso para ingresar ventas/gastos diarios y consultar el historial de movimientos.',
    pin: '',
  },
  {
    id: 'user-op2',
    name: 'Operador 2 (Auxiliar)',
    role: 'operator',
    roleLabel: 'Operador Auxiliar',
    avatarColor: 'bg-indigo-600',
    description: 'Permiso para ingresar ventas/gastos diarios y consultar el historial de movimientos.',
    pin: '',
  },
];

export const USER_STORAGE_KEY = 'fin_control_users_v2';
export const CURRENT_USER_STORAGE_KEY = 'fin_control_current_user_v2';

export function getStoredUsers(): AppUser[] {
  try {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading users:', e);
  }
  return DEFAULT_USERS;
}

export function saveStoredUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users:', e);
  }
}

export function getStoredCurrentUserId(): string {
  try {
    const saved = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (saved) return saved;
  } catch (e) {
    console.error('Error loading current user:', e);
  }
  return DEFAULT_USERS[0].id;
}

export function saveStoredCurrentUserId(userId: string): void {
  try {
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, userId);
  } catch (e) {
    console.error('Error saving current user:', e);
  }
}
