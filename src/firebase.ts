import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { isSupported, getAnalytics, Analytics } from 'firebase/analytics';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocFromServer,
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { FinancialRecord, AppUser, RecordMessage } from './types';

// Configuración de Firebase para Don Vicente
export const config = {
  apiKey: firebaseConfig.apiKey || "AIzaSyCxx0T_-mXo5JNB1YGooBhgdWOJfHt1yyw",
  authDomain: firebaseConfig.authDomain || "donvicente-dash.firebaseapp.com",
  projectId: firebaseConfig.projectId || "donvicente-dash",
  storageBucket: firebaseConfig.storageBucket || "donvicente-dash.firebasestorage.app",
  messagingSenderId: firebaseConfig.messagingSenderId || "1041229556354",
  appId: firebaseConfig.appId || "1:1041229556354:web:08dd490411729f0a44a29b",
  measurementId: firebaseConfig.measurementId || "G-44JGYMMKMV"
};

// Inicialización de Firebase
export const app = getApps().length === 0 ? initializeApp(config) : getApp();

// Inicialización de Analytics (con soporte seguro en navegador)
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        console.warn('Firebase Analytics no pudo inicializarse en este entorno:', err);
      }
    }
  }).catch(err => {
    console.debug('Firebase Analytics no soportado en este entorno:', err);
  });
}

// Inicialización de Firestore (base de datos default de donvicente-dash)
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
 * Asegura que exista una sesión activa en Firebase Auth (auth.currentUser != null).
 * Si no está iniciada, intenta autenticación anónima o espera a la inicialización.
 */
let authInitPromise: Promise<User | null> | null = null;
export async function ensureFirebaseAuth(): Promise<User | null> {
  if (auth.currentUser) {
    return auth.currentUser;
  }
  if (!authInitPromise) {
    authInitPromise = (async () => {
      try {
        const cred = await signInAnonymously(auth);
        return cred.user;
      } catch (err) {
        console.warn('Firebase Auth: no se pudo establecer sesión automática anónima:', err);
        return auth.currentUser;
      } finally {
        authInitPromise = null;
      }
    })();
  }
  return authInitPromise;
}

// Tipos requeridos para manejo de errores de Firestore
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Manejador estándar de errores de Firestore para diagnóstico y seguridad
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Valida la conexión inicial a Firestore con getDocFromServer
 */
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration: client is offline.");
      return false;
    }
    return true;
  }
}

/**
 * Obtiene todos los registros guardados en Firestore
 */
export async function fetchRecordsFromFirestore(): Promise<FinancialRecord[]> {
  const path = 'records';
  try {
    const snapshot = await getDocs(collection(db, path));
    const records: FinancialRecord[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as FinancialRecord;
      records.push({
        ...data,
        id: data.id || docSnap.id
      });
    });
    // Ordenar por fecha descendente y fecha de creación descendente
    return records.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Sanitiza recursivamente cualquier objeto eliminando propiedades con valor `undefined`,
 * evitando errores de validación en el SDK de Firestore.
 */
function deepSanitize<T>(data: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Guarda un registro individual en Firestore (creación o sobreescritura)
 */
export async function saveRecordToFirestore(record: FinancialRecord): Promise<void> {
  const path = `records/${record.id}`;
  if (!auth.currentUser) {
    await ensureFirebaseAuth().catch(() => null);
  }
  try {
    // Sanitizar campos undefined que Firestore rechaza profundamente
    const sanitizedRecord = deepSanitize(record);

    await setDoc(doc(db, 'records', record.id), sanitizedRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Actualiza un registro existente en Firestore de forma parcial y segura sin sobreescribir el resto del documento
 */
export async function updateRecordInFirestore(recordId: string, updates: Partial<FinancialRecord>): Promise<void> {
  const path = `records/${recordId}`;
  if (!auth.currentUser) {
    await ensureFirebaseAuth().catch(() => null);
  }
  try {
    const sanitizedUpdates = deepSanitize(updates);
    await updateDoc(doc(db, 'records', recordId), sanitizedUpdates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Elimina un registro de Firestore
 */
export async function deleteRecordFromFirestore(recordId: string): Promise<void> {
  const path = `records/${recordId}`;
  if (!auth.currentUser) {
    await ensureFirebaseAuth().catch(() => null);
  }
  try {
    await deleteDoc(doc(db, 'records', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Guarda un lote masivo de registros en Firestore (útil para importación o datos iniciales)
 */
export async function batchSaveRecordsToFirestore(recordsList: FinancialRecord[]): Promise<void> {
  const path = 'records';
  if (!auth.currentUser) {
    await ensureFirebaseAuth().catch(() => null);
  }
  try {
    // Firestore writeBatch admite hasta 500 operaciones por lote
    const chunkSize = 400;
    for (let i = 0; i < recordsList.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = recordsList.slice(i, i + chunkSize);
      for (const rec of chunk) {
        const sanitized = Object.entries(rec).reduce<Record<string, unknown>>((acc, [key, val]) => {
          if (val !== undefined) {
            acc[key] = val;
          }
          return acc;
        }, {});
        batch.set(doc(db, 'records', rec.id), sanitized);
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Reemplaza completamente los registros en Firestore con un nuevo conjunto de datos.
 * Elimina los registros anteriores que ya no existen en el nuevo archivo y guarda los nuevos,
 * evitando estados intermedios y asegurando que la colección quede exactamente sincronizada.
 */
export async function replaceRecordsInFirestore(newRecords: FinancialRecord[]): Promise<void> {
  const path = 'records';
  if (!auth.currentUser) {
    await ensureFirebaseAuth().catch(() => null);
  }
  try {
    // 1. Obtener los IDs de todos los documentos actualmente en Firestore
    const existingSnapshot = await getDocs(collection(db, 'records'));
    const existingIds: string[] = [];
    existingSnapshot.forEach(docSnap => {
      existingIds.push(docSnap.id);
    });

    const newIds = new Set(newRecords.map(r => r.id));
    const idsToDelete = existingIds.filter(id => !newIds.has(id));

    // Sanitizar los nuevos registros
    const sanitizedNewRecords = newRecords.map(rec => ({
      id: rec.id,
      data: Object.entries(rec).reduce<Record<string, unknown>>((acc, [key, val]) => {
        if (val !== undefined) {
          acc[key] = val;
        }
        return acc;
      }, {})
    }));

    // Si el total de operaciones (eliminar + insertar) es <= 400,
    // se ejecuta en un único lote atómico.
    const totalOps = idsToDelete.length + sanitizedNewRecords.length;

    if (totalOps <= 400) {
      const batch = writeBatch(db);
      // Primero insertamos/actualizamos los nuevos para que la colección nunca quede vacía
      for (const item of sanitizedNewRecords) {
        batch.set(doc(db, 'records', item.id), item.data);
      }
      // Luego eliminamos los anteriores que no están en el nuevo archivo
      for (const id of idsToDelete) {
        batch.delete(doc(db, 'records', id));
      }
      await batch.commit();
    } else {
      // Para conjuntos grandes, primero guardamos los nuevos en lotes
      const chunkSize = 400;
      for (let i = 0; i < sanitizedNewRecords.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = sanitizedNewRecords.slice(i, i + chunkSize);
        for (const item of chunk) {
          batch.set(doc(db, 'records', item.id), item.data);
        }
        await batch.commit();
      }

      // Luego eliminamos en lotes los registros anteriores
      for (let i = 0; i < idsToDelete.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = idsToDelete.slice(i, i + chunkSize);
        for (const id of chunk) {
          batch.delete(doc(db, 'records', id));
        }
        await batch.commit();
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Elimina de forma permanente todos los registros de la colección 'records' en Firestore.
 * Permite reiniciar la base de datos a cero (0 registros) para pruebas limpias.
 */
export async function clearAllRecordsFromFirestore(): Promise<void> {
  const path = 'records';
  if (!auth.currentUser) {
    await ensureFirebaseAuth().catch(() => null);
  }
  try {
    const existingSnapshot = await getDocs(collection(db, 'records'));
    const docIds: string[] = [];
    existingSnapshot.forEach(docSnap => {
      docIds.push(docSnap.id);
    });

    if (docIds.length === 0) {
      return;
    }

    const chunkSize = 400;
    for (let i = 0; i < docIds.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = docIds.slice(i, i + chunkSize);
      for (const id of chunk) {
        batch.delete(doc(db, 'records', id));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

/**
 * Suscripción en tiempo real a los registros de Firestore
 */
export function subscribeToRecords(
  onUpdate: (records: FinancialRecord[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = 'records';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const records: FinancialRecord[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as FinancialRecord;
          records.push({
            ...data,
            id: data.id || docSnap.id
          });
        });
        // Ordenar por fecha descendente
        records.sort((a, b) => {
          if (a.date !== b.date) {
            return b.date.localeCompare(a.date);
          }
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });
        onUpdate(records);
      },
      (error) => {
        console.warn('Suscripción Firestore: estado o permiso:', error?.message || error);
        if (onError) {
          onError(error);
        }
      }
    );
  } catch (err) {
    console.warn('Error al iniciar onSnapshot en Firestore:', err);
    if (onError) {
      onError(err);
    }
    return () => {};
  }
}

/**
 * Obtiene todos los usuarios registrados en Firestore
 */
export async function fetchUsersFromFirestore(): Promise<AppUser[]> {
  const path = 'users';
  try {
    const snapshot = await getDocs(collection(db, path));
    const users: AppUser[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as AppUser;
      users.push({
        ...data,
        id: data.id || docSnap.id
      });
    });
    return users;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

/**
 * Guarda o actualiza un usuario en Firestore.
 * Verifica si el usuario está autenticado con auth.currentUser antes de intentar escribir en Firestore.
 */
export async function saveUserToFirestore(user: AppUser): Promise<void> {
  const path = `users/${user.id}`;
  
  // 1. Si no hay sesión activa en auth.currentUser, intentar autenticar
  if (!auth.currentUser) {
    await ensureFirebaseAuth();
  }

  // 2. Verificar explícitamente auth.currentUser antes de intentar escribir en Firestore
  if (!auth.currentUser) {
    console.warn(`[saveUserToFirestore] auth.currentUser es null. Omitiendo escritura en Firestore para el usuario "${user.name}". El usuario se conservará en persistencia local.`);
    return;
  }

  try {
    const sanitized = Object.entries(user).reduce<Record<string, unknown>>((acc, [key, val]) => {
      if (val !== undefined) {
        acc[key] = val;
      }
      return acc;
    }, {});
    await setDoc(doc(db, 'users', user.id), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Elimina un usuario de Firestore.
 * Verifica si el usuario está autenticado con auth.currentUser antes de intentar eliminar.
 */
export async function deleteUserFromFirestore(userId: string): Promise<void> {
  const path = `users/${userId}`;

  // 1. Si no hay sesión activa en auth.currentUser, intentar autenticar
  if (!auth.currentUser) {
    await ensureFirebaseAuth();
  }

  // 2. Verificar explícitamente auth.currentUser antes de intentar eliminar en Firestore
  if (!auth.currentUser) {
    console.warn(`[deleteUserFromFirestore] auth.currentUser es null. Omitiendo eliminación en Firestore para "${userId}". Se conservará eliminado localmente.`);
    return;
  }

  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Inicializa usuarios predeterminados si la colección en Firestore está vacía.
 * Verifica si el usuario está autenticado con auth.currentUser antes de intentar escribir.
 */
export async function initializeDefaultUsersInFirestore(defaultUsers: AppUser[]): Promise<void> {
  const path = 'users';

  // 1. Si no hay sesión activa en auth.currentUser, intentar autenticar
  if (!auth.currentUser) {
    await ensureFirebaseAuth();
  }

  // 2. Verificar explícitamente auth.currentUser antes de intentar escribir en Firestore
  if (!auth.currentUser) {
    console.warn('[initializeDefaultUsersInFirestore] auth.currentUser es null. Omitiendo inicialización remota en Firestore.');
    return;
  }

  try {
    const batch = writeBatch(db);
    for (const u of defaultUsers) {
      const sanitized = Object.entries(u).reduce<Record<string, unknown>>((acc, [key, val]) => {
        if (val !== undefined) {
          acc[key] = val;
        }
        return acc;
      }, {});
      batch.set(doc(db, 'users', u.id), sanitized);
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Suscripción en tiempo real a la colección de usuarios en Firestore
 */
export function subscribeToUsers(
  onUpdate: (users: AppUser[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = 'users';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const usersList: AppUser[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as AppUser;
          usersList.push({
            ...data,
            id: data.id || docSnap.id
          });
        });
        // Si hay usuarios en Firestore, ordenar poniendo admin primero y luego por nombre
        usersList.sort((a, b) => {
          if (a.role === 'admin' && b.role !== 'admin') return -1;
          if (a.role !== 'admin' && b.role === 'admin') return 1;
          return a.name.localeCompare(b.name);
        });
        onUpdate(usersList);
      },
      (error) => {
        console.warn('Suscripción Firestore Users: estado o permiso:', error?.message || error);
        if (onError) {
          onError(error);
        }
      }
    );
  } catch (err) {
    console.warn('Error al iniciar onSnapshot de usuarios en Firestore:', err);
    if (onError) {
      onError(err);
    }
    return () => {};
  }
}

/**
 * Guarda simultáneamente en un único lote atómico (writeBatch) una transacción de transferencia directa:
 * 1. Un registro de INGRESO a nombre del Cliente.
 * 2. Un registro de EGRESO a nombre del Proveedor.
 * Ambos vinculados con medio de pago 'direct_transfer', garantizando que el balance de caja sea $0 neto.
 */
export async function saveDirectTransferToFirestore(
  saleRecord: FinancialRecord,
  expenseRecord: FinancialRecord
): Promise<void> {
  const path = 'records';
  if (!auth.currentUser) {
    await ensureFirebaseAuth().catch(() => null);
  }
  try {
    const batch = writeBatch(db);

    const saleRef = doc(db, 'records', saleRecord.id);
    const expRef = doc(db, 'records', expenseRecord.id);

    batch.set(saleRef, deepSanitize(saleRecord));
    batch.set(expRef, deepSanitize(expenseRecord));

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Guarda un mensaje interno o consulta vinculado a un registro financiero en Firestore
 */
export async function saveRecordMessageToFirestore(message: RecordMessage): Promise<void> {
  const path = `record_messages/${message.id}`;
  if (!auth.currentUser) {
    await ensureFirebaseAuth().catch(() => null);
  }
  try {
    const messageRef = doc(db, 'record_messages', message.id);
    const sanitized = deepSanitize(message);
    await setDoc(messageRef, sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Marca un mensaje interno como leído en Firestore
 */
export async function markMessageAsReadInFirestore(messageId: string): Promise<void> {
  const path = `record_messages/${messageId}`;
  if (!auth.currentUser) {
    await ensureFirebaseAuth().catch(() => null);
  }
  try {
    const messageRef = doc(db, 'record_messages', messageId);
    await updateDoc(messageRef, { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Marca como leídos todos los mensajes asociados a un registro específico
 */
export async function markRecordMessagesAsReadInFirestore(recordId: string, recipientId?: string): Promise<void> {
  const path = 'record_messages';
  if (!auth.currentUser) {
    await ensureFirebaseAuth().catch(() => null);
  }
  try {
    const q = query(
      collection(db, 'record_messages'),
      where('recordId', '==', recordId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!recipientId || data.recipientId === recipientId) {
        batch.update(docSnap.ref, { read: true });
      }
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Suscripción en tiempo real a los mensajes internos vinculados a registros en Firestore
 */
export function subscribeToRecordMessages(
  onUpdate: (messages: RecordMessage[]) => void,
  onError?: (error: unknown) => void
): () => void {
  const path = 'record_messages';
  try {
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const messages: RecordMessage[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as RecordMessage;
          messages.push({
            ...data,
            id: data.id || docSnap.id
          });
        });
        // Ordenar con los más recientes primero
        messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onUpdate(messages);
      },
      (error) => {
        console.warn('Suscripción Firestore RecordMessages:', error?.message || error);
        if (onError) {
          onError(error);
        }
      }
    );
  } catch (err) {
    console.warn('Error al iniciar onSnapshot de mensajes en Firestore:', err);
    if (onError) {
      onError(err);
    }
    return () => {};
  }
}

