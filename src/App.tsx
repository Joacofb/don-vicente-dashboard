/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { FinancialRecord, AppUser, SaveStateInfo, RecordMessage, DirectTransferPayload, ReviewStatus } from './types';
import { getInitialDemoRecords } from './data/initialData';
import { 
  DEFAULT_USERS, 
  getStoredUsers, 
  saveStoredUsers, 
  getStoredCurrentUserId, 
  saveStoredCurrentUserId 
} from './data/usersData';
import { 
  DEFAULT_SAVED_CONCEPTS,
  DEFAULT_SAVED_ENTITIES,
  SavedItem,
  getStoredConcepts, 
  saveStoredConcepts, 
  getStoredEntities, 
  saveStoredEntities,
  recordConceptUsage, 
  recordEntityUsage 
} from './data/savedItemsData';
import { Header } from './components/Header';
import { DataEntryForm } from './components/DataEntryForm';
import { DailyLogTable } from './components/DailyLogTable';
import { WeeklyReportView } from './components/WeeklyReportView';
import { QuickInsightsBanner } from './components/QuickInsightsBanner';
import { UserManagementModal } from './components/UserManagementModal';
import { DataImportModal } from './components/DataImportModal';
import { SavedCatalogModal } from './components/SavedCatalogModal';
import { EditRecordModal } from './components/EditRecordModal';
import { RecordDetailModal } from './components/RecordDetailModal';
import { LoginScreen } from './components/LoginScreen';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { RecordInquiryModal } from './components/RecordInquiryModal';
import { MessagesInboxModal } from './components/MessagesInboxModal';
import { getStoredLastSaveInfo, saveStoredLastSaveInfo } from './utils/storageUtils';
import { formatCurrency } from './utils/financeUtils';
import { 
  testConnection, 
  saveRecordToFirestore, 
  updateRecordInFirestore, 
  deleteRecordFromFirestore, 
  batchSaveRecordsToFirestore, 
  replaceRecordsInFirestore,
  clearAllRecordsFromFirestore,
  subscribeToRecords,
  saveUserToFirestore,
  deleteUserFromFirestore,
  initializeDefaultUsersInFirestore,
  subscribeToUsers,
  ensureFirebaseAuth,
  saveDirectTransferToFirestore,
  saveRecordMessageToFirestore,
  markMessageAsReadInFirestore,
  markRecordMessagesAsReadInFirestore,
  subscribeToRecordMessages
} from './firebase';
import { X } from 'lucide-react';

const LOCAL_STORAGE_KEY_RECORDS = 'fin_control_records_v1';
const LOCAL_STORAGE_KEY_CURRENCY = 'fin_control_currency_v1';
const LOCAL_STORAGE_KEY_INITIALIZED = 'fin_control_has_seeded_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'report'>('entry');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Referencias para control de importación y sincronización
  const isImportingRef = useRef<boolean>(false);
  const hasInitializedRecordsRef = useRef<boolean>(false);

  // Estado de Autenticación de Inicio de Sesión
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Estados de Usuarios y Permisos
  const [users, setUsers] = useState<AppUser[]>(DEFAULT_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>(DEFAULT_USERS[0].id);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);

  // Estado de Último Guardado / Persistencia
  const [lastSaveInfo, setLastSaveInfo] = useState<SaveStateInfo | null>(null);

  // Estados de Catálogo Reutilizable
  const [savedConcepts, setSavedConcepts] = useState<SavedItem[]>(DEFAULT_SAVED_CONCEPTS);
  const [savedEntities, setSavedEntities] = useState<SavedItem[]>(DEFAULT_SAVED_ENTITIES);

  // Estados de Modales de Importación, Catálogo, Edición y Reinicio
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  // Estados para Modal de Ficha Detallada de Registro (Lectura completa sin editar)
  const [selectedDetailRecord, setSelectedDetailRecord] = useState<FinancialRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const handleOpenDetailModal = (record: FinancialRecord) => {
    setSelectedDetailRecord(record);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDetailRecord(null);
  };

  // Estados de Mensajes Internos y Consultas
  const [messages, setMessages] = useState<RecordMessage[]>([]);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState<boolean>(false);
  const [inquiryRecord, setInquiryRecord] = useState<FinancialRecord | null>(null);
  const [inquiryTargetUserId, setInquiryTargetUserId] = useState<string | undefined>(undefined);
  const [isInboxModalOpen, setIsInboxModalOpen] = useState<boolean>(false);

  // Notificación Toast flotante
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Cargar datos persistentes e inicializar sincronización en tiempo real con Firebase Firestore
  useEffect(() => {
    // 1. Probar conexión e inicializar sesión en Firebase Auth
    testConnection().catch(console.error);
    ensureFirebaseAuth().catch(console.warn);

    // 2. Cargar configuraciones auxiliares locales
    try {
      const savedCurrency = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENCY);
      if (savedCurrency) {
        setCurrencySymbol(savedCurrency);
      }

      // Cargar usuarios
      const loadedUsers = getStoredUsers();
      setUsers(loadedUsers);
      const loadedCurrentUserId = getStoredCurrentUserId();
      setCurrentUserId(loadedCurrentUserId);

      // Cargar catálogos
      const loadedConcepts = getStoredConcepts();
      setSavedConcepts(loadedConcepts);
      const loadedEntities = getStoredEntities();
      setSavedEntities(loadedEntities);

      // Cargar caché local de registros inmediatamente mientras conecta Firestore
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY_RECORDS);
      const hasSeededBefore = localStorage.getItem(LOCAL_STORAGE_KEY_INITIALIZED) === 'true';
      let loadedAny = false;
      if (cached !== null) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setRecords(parsed);
            loadedAny = true;
          }
        } catch {}
      }
      
      // Solo si la app NUNCA antes se inicializó en este dispositivo y no hay datos en caché
      if (!loadedAny && !hasSeededBefore) {
        localStorage.setItem(LOCAL_STORAGE_KEY_INITIALIZED, 'true');
        setRecords(getInitialDemoRecords());
      }

      const loadedSaveInfo = getStoredLastSaveInfo();
      if (loadedSaveInfo) {
        setLastSaveInfo(loadedSaveInfo);
      }
    } catch (err) {
      console.error('Error cargando datos locales:', err);
    } finally {
      // Garantizar que la interfaz nunca quede en blanco o bloqueada
      setIsLoaded(true);
    }

    // 3. Suscripción en vivo a la colección de Firestore (Registros)
    const unsubscribeRecords = subscribeToRecords(
      (cloudRecords) => {
        // Si estamos en medio de un proceso de importación o reinicio masivo, ignorar el snapshot intermedio
        if (isImportingRef.current) {
          return;
        }

        if (cloudRecords && cloudRecords.length > 0) {
          hasInitializedRecordsRef.current = true;
          setRecords(cloudRecords);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(cloudRecords));
          } catch {}

          const info: SaveStateInfo = {
            timestamp: new Date().toISOString(),
            savedBy: 'Firebase Firestore (Nube)',
            type: 'auto',
            recordsCount: cloudRecords.length,
          };
          setLastSaveInfo(info);
          saveStoredLastSaveInfo(info);
        } else if (cloudRecords && cloudRecords.length === 0) {
          hasInitializedRecordsRef.current = true;
          const hasSeeded = localStorage.getItem(LOCAL_STORAGE_KEY_INITIALIZED) === 'true';
          if (!hasSeeded) {
            // Primera vez absoluta en una base de datos virgen
            localStorage.setItem(LOCAL_STORAGE_KEY_INITIALIZED, 'true');
            const initialList = getInitialDemoRecords();
            setRecords(initialList);
            batchSaveRecordsToFirestore(initialList).catch(err => {
              console.warn('Inicialización de Firestore con demo:', err);
            });
          } else {
            // La base de datos está en 0 registros (legítimamente vacía o reiniciada a cero)
            setRecords([]);
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, '[]');
            } catch {}
            const info: SaveStateInfo = {
              timestamp: new Date().toISOString(),
              savedBy: 'Firebase Firestore (0 registros)',
              type: 'auto',
              recordsCount: 0,
            };
            setLastSaveInfo(info);
            saveStoredLastSaveInfo(info);
          }
        }
      },
      (error) => {
        console.warn('Conexión de registros en modo local (Firestore pendiente o sin permisos):', error);
      }
    );

    // 4. Suscripción en vivo a la colección de Firestore (Usuarios)
    const unsubscribeUsers = subscribeToUsers(
      (cloudUsers) => {
        if (cloudUsers && cloudUsers.length > 0) {
          setUsers(cloudUsers);
          saveStoredUsers(cloudUsers);
        } else if (cloudUsers && cloudUsers.length === 0) {
          // Si Firestore está vacío de usuarios, registrar los usuarios iniciales
          initializeDefaultUsersInFirestore(DEFAULT_USERS).catch(err => {
            console.warn('Inicialización de usuarios en Firestore:', err);
          });
        }
      },
      (error) => {
        console.warn('Conexión de usuarios en modo local:', error);
      }
    );

    // 5. Suscripción en vivo a los mensajes internos vinculados a registros
    const unsubscribeMessages = subscribeToRecordMessages(
      (cloudMessages) => {
        setMessages(cloudMessages);
      },
      (error) => {
        console.warn('Conexión de mensajes en modo local:', error);
      }
    );

    return () => {
      unsubscribeRecords();
      unsubscribeUsers();
      unsubscribeMessages();
    };
  }, []);

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || DEFAULT_USERS[0];

  // Cantidad de mensajes no leídos para el usuario activo
  const unreadMessagesCount = messages.filter(
    (m) => m.recipientId === currentUser.id && !m.read
  ).length;

  // Iniciar sesión desde la pantalla de autenticación
  const handleAuthenticate = (user: AppUser) => {
    setCurrentUserId(user.id);
    saveStoredCurrentUserId(user.id);
    setIsAuthenticated(true);
    ensureFirebaseAuth().catch(console.warn);
  };

  // Bloquear sesión o cerrar turno
  const handleLockSession = () => {
    setIsAuthenticated(false);
  };

  // Cambiar usuario con validación de PIN si aplica
  const handleSwitchUser = (userId: string, pinAttempt?: string): { success: boolean; message?: string } => {
    const target = users.find(u => u.id === userId);
    if (!target) return { success: false, message: 'Usuario no encontrado.' };

    // Si el usuario destino es Admin y tiene PIN configurado, y el usuario actual no es admin
    if (target.role === 'admin' && target.pin && target.pin.trim().length > 0 && currentUser.id !== target.id) {
      if (!pinAttempt || pinAttempt.trim() !== target.pin.trim()) {
        return { success: false, message: 'PIN incorrecto. Ingresa el PIN asignado al Administrador.' };
      }
    }

    setCurrentUserId(target.id);
    saveStoredCurrentUserId(target.id);
    return { success: true };
  };

  // Actualizar datos/nombres de los usuarios
  const handleUpdateUsers = async (updatedUsers: AppUser[]) => {
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);
    try {
      await initializeDefaultUsersInFirestore(updatedUsers);
    } catch (err) {
      console.warn('Error sincronizando usuarios en Firestore:', err);
    }
  };

  // Crear o actualizar un usuario individual en Firestore y estado local
  const handleSaveUser = async (userToSave: AppUser) => {
    const existingIndex = users.findIndex(u => u.id === userToSave.id);
    let updatedUsers: AppUser[];
    if (existingIndex >= 0) {
      updatedUsers = [...users];
      updatedUsers[existingIndex] = userToSave;
    } else {
      updatedUsers = [...users, userToSave];
    }
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    // Si el usuario editado es el que está en sesión, refrescar
    if (currentUserId === userToSave.id) {
      setCurrentUserId(userToSave.id);
    }

    await saveUserToFirestore(userToSave);
  };

  // Eliminar un usuario en Firestore y estado local
  const handleDeleteUser = async (userIdToDelete: string) => {
    const updatedUsers = users.filter(u => u.id !== userIdToDelete);
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);

    // Si se eliminó el usuario seleccionado, cambiar al admin
    if (currentUserId === userIdToDelete) {
      const fallback = updatedUsers.find(u => u.role === 'admin') || updatedUsers[0];
      if (fallback) {
        setCurrentUserId(fallback.id);
        saveStoredCurrentUserId(fallback.id);
      }
    }

    await deleteUserFromFirestore(userIdToDelete);
  };

  // Actualizar catálogos
  const handleUpdateConcepts = (items: SavedItem[]) => {
    setSavedConcepts(items);
    saveStoredConcepts(items);
  };

  const handleUpdateEntities = (items: SavedItem[]) => {
    setSavedEntities(items);
    saveStoredEntities(items);
  };

  const handleRecordConcept = (name: string, type: 'sale' | 'expense') => {
    const updated = recordConceptUsage(name, type);
    setSavedConcepts(updated);
  };

  const handleRecordEntity = (name: string, type: 'sale' | 'expense') => {
    const updated = recordEntityUsage(name, type);
    setSavedEntities(updated);
  };

  // Guardar cambios en records con actualización de metadatos de persistencia
  const updateRecords = (newRecords: FinancialRecord[], saveType: 'auto' | 'manual' = 'auto') => {
    setRecords(newRecords);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(newRecords));
      const info: SaveStateInfo = {
        timestamp: new Date().toISOString(),
        savedBy: currentUser.name,
        type: saveType,
        recordsCount: newRecords.length,
      };
      setLastSaveInfo(info);
      saveStoredLastSaveInfo(info);
    } catch (err) {
      console.error('Error saving records:', err);
    }
  };

  // Guardado manual explícito ejecutado por el usuario con sincronización a Firestore
  const handleManualSave = async () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(records));
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENCY, currencySymbol);
      saveStoredUsers(users);
      saveStoredConcepts(savedConcepts);
      saveStoredEntities(savedEntities);

      // Guardar masivamente en Firestore
      await batchSaveRecordsToFirestore(records);
      await initializeDefaultUsersInFirestore(users);

      const info: SaveStateInfo = {
        timestamp: new Date().toISOString(),
        savedBy: `${currentUser.name} (Sincronizado con Firestore)`,
        type: 'manual',
        recordsCount: records.length,
      };
      setLastSaveInfo(info);
      saveStoredLastSaveInfo(info);
    } catch (err) {
      console.error('Error during manual save to Firestore:', err);
    }
  };

  // Guardar moneda
  const handleCurrencyChange = (sym: string) => {
    setCurrencySymbol(sym);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENCY, sym);
    } catch (err) {
      console.error('Error saving currency:', err);
    }
  };

  // Agregar nuevo movimiento guardándolo de inmediato en Firestore
  const handleAddRecord = async (data: Omit<FinancialRecord, 'id' | 'createdAt'>) => {
    const newRecord: FinancialRecord = {
      ...data,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy || currentUser.id,
      createdByName: data.createdByName || currentUser.name,
    };
    const updated = [newRecord, ...records];
    updateRecords(updated);

    try {
      await saveRecordToFirestore(newRecord);
    } catch (err) {
      console.error('Error al guardar registro en Firestore:', err);
    }

    // Guardar concepto y cliente en catálogos reutilizables
    if (newRecord.description && newRecord.description.trim()) {
      handleRecordConcept(newRecord.description.trim(), newRecord.type);
    }
    if (newRecord.entityName && newRecord.entityName.trim()) {
      handleRecordEntity(newRecord.entityName.trim(), newRecord.type);
    }
  };

  // Registrar Transferencia Directa (Cliente -> Proveedor): crea 1 Ingreso y 1 Gasto vinculados en Firestore
  const handleAddDirectTransfer = async (payload: DirectTransferPayload) => {
    const transferGroupId = `trans-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const saleId = `rec-${Date.now()}-sale`;
    const expenseId = `rec-${Date.now()}-exp`;

    const saleRecord: FinancialRecord = {
      id: saleId,
      type: 'sale',
      date: payload.date,
      amount: payload.amount,
      category: 'Cobro de Factura',
      description: payload.concept || `Transferencia directa desde ${payload.clientName}`,
      paymentMethod: 'direct_transfer',
      entityName: payload.clientName,
      linkedEntityName: payload.providerName,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      transferGroupId,
      transferRole: 'origin_sale',
      linkedRecordId: expenseId,
      reviewStatus: 'sin_asignar',
    };

    const expenseRecord: FinancialRecord = {
      id: expenseId,
      type: 'expense',
      date: payload.date,
      amount: payload.amount,
      category: 'Materia Prima / Mercadería',
      description: payload.concept || `Transferencia directa hacia ${payload.providerName}`,
      paymentMethod: 'direct_transfer',
      entityName: payload.providerName,
      linkedEntityName: payload.clientName,
      notes: payload.notes,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      transferGroupId,
      transferRole: 'destination_expense',
      linkedRecordId: saleId,
      reviewStatus: 'sin_asignar',
    };

    const updated = [saleRecord, expenseRecord, ...records];
    updateRecords(updated);

    try {
      await saveDirectTransferToFirestore(saleRecord, expenseRecord);
    } catch (err) {
      console.error('Error al guardar transferencia directa en Firestore:', err);
    }

    // Registrar en catálogos reutilizables
    if (payload.concept && payload.concept.trim()) {
      handleRecordConcept(payload.concept.trim(), 'sale');
    }
    if (payload.clientName && payload.clientName.trim()) {
      handleRecordEntity(payload.clientName.trim(), 'sale');
    }
    if (payload.providerName && payload.providerName.trim()) {
      handleRecordEntity(payload.providerName.trim(), 'expense');
    }

    setToastNotification({
      type: 'success',
      message: `Transferencia directa por ${formatCurrency(payload.amount, currencySymbol)} guardada (2 movimientos enlazados, balance neto $0).`,
    });
  };

  // Abrir modal de consulta sobre un registro
  const handleOpenInquiry = (record: FinancialRecord, targetUserId?: string) => {
    setInquiryRecord(record);
    setInquiryTargetUserId(targetUserId);
    setIsInquiryModalOpen(true);
  };

  // Enviar mensaje o consulta sobre un registro a Firestore
  const handleSendMessage = async (msgData: Omit<RecordMessage, 'id' | 'createdAt' | 'read'>) => {
    const newMessage: RecordMessage = {
      ...msgData,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };

    try {
      await saveRecordMessageToFirestore(newMessage);

      // Si el mensaje está vinculado a un registro, actualizar su estado a 'pendiente' si estaba sin asignar o resuelto
      if (msgData.recordId) {
        const targetRec = records.find(r => r.id === msgData.recordId);
        if (targetRec && targetRec.reviewStatus !== 'pendiente' && targetRec.reviewStatus !== 'en_revision') {
          handleUpdateRecordReviewStatus(msgData.recordId, 'pendiente');
        }
      }

      setToastNotification({
        type: 'success',
        message: 'Consulta enviada exitosamente.',
      });
    } catch (err) {
      console.error('Error al enviar consulta a Firestore:', err);
      setToastNotification({
        type: 'error',
        message: 'Error al enviar la consulta a Firestore.',
      });
      throw err;
    }
  };

  // Marcar mensaje como leído
  const handleMarkMessageAsRead = async (messageId: string) => {
    try {
      await markMessageAsReadInFirestore(messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, read: true } : m))
      );
    } catch (err) {
      console.error('Error al marcar mensaje como leído:', err);
    }
  };

  // Marcar todos los mensajes asociados a un registro como leídos
  const handleMarkRecordMessagesAsRead = async (recordId: string) => {
    try {
      await markRecordMessagesAsReadInFirestore(recordId);
      setMessages((prev) =>
        prev.map((m) => (m.recordId === recordId ? { ...m, read: true } : m))
      );
    } catch (err) {
      console.error('Error al marcar mensajes del registro como leídos:', err);
    }
  };

  // Actualizar estado de revisión de un registro (desde consultas o tabla)
  const handleUpdateRecordReviewStatus = async (recordId: string, status: ReviewStatus) => {
    const target = records.find(r => r.id === recordId);
    if (!target) return;

    const nowISO = new Date().toISOString();
    const updatedRecord: FinancialRecord = {
      ...target,
      reviewStatus: status,
      lastReviewedBy: currentUser.name,
      lastReviewedAt: nowISO,
    };

    const updated = records.map(r => r.id === recordId ? updatedRecord : r);
    updateRecords(updated);

    // Si el modal de detalle está abierto con este registro, actualizarlo
    if (selectedDetailRecord && selectedDetailRecord.id === recordId) {
      setSelectedDetailRecord(updatedRecord);
    }

    if (status === 'resuelto') {
      handleMarkRecordMessagesAsRead(recordId);
    }

    try {
      await updateRecordInFirestore(recordId, {
        reviewStatus: status,
        lastReviewedBy: currentUser.name,
        lastReviewedAt: nowISO,
      });
      setToastNotification({
        type: 'success',
        message: `Estado de revisión actualizado a "${
          status === 'resuelto' 
            ? 'Resuelto' 
            : status === 'en_revision' 
            ? 'En Revisión' 
            : status === 'pendiente' 
            ? 'Pendiente' 
            : 'Sin asignar'
        }"`,
      });
    } catch (err) {
      console.error('Error al actualizar estado de revisión en Firestore:', err);
    }
  };

  // Importar registros masivos (desde Excel o CSV) y sincronizar con Firestore
  const handleImportRecords = async (
    newRecords: FinancialRecord[], 
    mode: 'merge' | 'replace',
    _discoveredConcepts: string[] = [],
    _discoveredEntities: string[] = []
  ): Promise<void> => {
    isImportingRef.current = true;
    try {
      // Asignar el creador si no viene especificado
      const processed = newRecords.map(r => ({
        ...r,
        createdBy: r.createdBy || currentUser.id,
        createdByName: r.createdByName || currentUser.name,
      }));

      let updatedList: FinancialRecord[];
      if (mode === 'replace') {
        updatedList = processed;
        updateRecords(updatedList, 'manual');
        await replaceRecordsInFirestore(updatedList);
      } else {
        updatedList = [...processed, ...records];
        updateRecords(updatedList, 'manual');
        // Guardar únicamente los nuevos registros ingresados
        await batchSaveRecordsToFirestore(processed);
      }

      // Auto-poblar catálogos reutilizables con los nuevos conceptos y clientes importados
      processed.forEach(r => {
        if (r.description && r.description.trim()) {
          recordConceptUsage(r.description.trim(), r.type);
        }
        if (r.entityName && r.entityName.trim()) {
          recordEntityUsage(r.entityName.trim(), r.type);
        }
      });

      setSavedConcepts(getStoredConcepts());
      setSavedEntities(getStoredEntities());

      const info: SaveStateInfo = {
        timestamp: new Date().toISOString(),
        savedBy: `${currentUser.name} (${mode === 'replace' ? 'Reemplazo' : 'Fusión'} importada a Firestore)`,
        type: 'manual',
        recordsCount: updatedList.length,
      };
      setLastSaveInfo(info);
      saveStoredLastSaveInfo(info);
    } catch (err) {
      console.error('Error durante la sincronización de importación en Firestore:', err);
      throw err;
    } finally {
      setTimeout(() => {
        isImportingRef.current = false;
      }, 500);
    }
  };

  // Eliminar un movimiento (Solo Admin) de Firestore
  const handleDeleteRecord = async (id: string) => {
    if (currentUser.role !== 'admin') {
      alert('Solo el Administrador tiene permiso para eliminar registros.');
      return;
    }
    const updated = records.filter(r => r.id !== id);
    updateRecords(updated);

    // Si el registro eliminado estaba abierto en el modal de detalle, cerrarlo
    if (selectedDetailRecord?.id === id) {
      setIsDetailModalOpen(false);
      setSelectedDetailRecord(null);
    }

    try {
      await deleteRecordFromFirestore(id);
    } catch (err) {
      console.error('Error al eliminar registro de Firestore:', err);
    }
  };

  // Abrir modal de edición
  const handleOpenEditModal = (record: FinancialRecord) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  // Guardar registro editado en Firestore
  const handleSaveEditedRecord = async (updatedRecord: FinancialRecord) => {
    const updated = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    updateRecords(updated);
    setIsEditModalOpen(false);
    setEditingRecord(null);

    // Si el registro editado estaba abierto en el modal de detalle, actualizarlo
    if (selectedDetailRecord && selectedDetailRecord.id === updatedRecord.id) {
      setSelectedDetailRecord(updatedRecord);
    }

    // Si el registro se marcó como 'resuelto', marcar también los mensajes asociados como leídos
    if (updatedRecord.reviewStatus === 'resuelto') {
      handleMarkRecordMessagesAsRead(updatedRecord.id);
    }

    try {
      await updateRecordInFirestore(updatedRecord.id, updatedRecord);
      setToastNotification({
        type: 'success',
        message: 'Registro financiero actualizado exitosamente.',
      });
    } catch (err) {
      console.error('Error al actualizar registro en Firestore:', err);
      setToastNotification({
        type: 'error',
        message: 'Error al actualizar el registro en Firestore.',
      });
    }
  };

  // Cargar datos demo en Firestore
  const handleLoadDemoData = async () => {
    if (currentUser.role !== 'admin') {
      setToastNotification({
        type: 'error',
        message: 'Solo el Administrador puede recargar los datos demo.',
      });
      return;
    }
    const demo = getInitialDemoRecords();
    localStorage.setItem(LOCAL_STORAGE_KEY_INITIALIZED, 'true');
    updateRecords(demo, 'manual');
    try {
      await replaceRecordsInFirestore(demo);
      setToastNotification({
        type: 'success',
        message: `Se cargaron ${demo.length} movimientos de demostración en Firestore.`,
      });
    } catch (err) {
      console.error('Error al cargar datos demo en Firestore:', err);
      setToastNotification({
        type: 'error',
        message: 'Error al sincronizar datos de demostración en Firestore.',
      });
    }
  };

  // Abrir modal de confirmación para reiniciar datos a cero (funciona sin bloqueos de iframe)
  const handleResetData = () => {
    setIsResetModalOpen(true);
  };

  // Ejecución definitiva del reinicio a cero en Firebase Firestore y caché local
  const handleConfirmReset = async () => {
    if (currentUser.role !== 'admin') {
      throw new Error('Solo el Administrador tiene autorización para reiniciar la base de datos.');
    }
    isImportingRef.current = true;
    try {
      // 1. Eliminar permanentemente todos los registros en Firestore
      await clearAllRecordsFromFirestore();

      // 2. Marcar que la base ya fue inicializada para que no reinyecte datos de prueba al refrescar
      localStorage.setItem(LOCAL_STORAGE_KEY_INITIALIZED, 'true');

      // 3. Limpiar estado reactivo y memoria local
      updateRecords([], 'manual');

      const info: SaveStateInfo = {
        timestamp: new Date().toISOString(),
        savedBy: `${currentUser.name} (Base de datos reiniciada a cero)`,
        type: 'manual',
        recordsCount: 0,
      };
      setLastSaveInfo(info);
      saveStoredLastSaveInfo(info);

      setToastNotification({
        type: 'success',
        message: 'Base de datos reiniciada a cero. Todos los movimientos fueron eliminados permanentemente.',
      });
    } catch (err) {
      console.error('Error al reiniciar base de datos a cero en Firestore:', err);
      throw err;
    } finally {
      setTimeout(() => {
        isImportingRef.current = false;
      }, 600);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 text-sm font-medium">
        Cargando base de datos financiera...
      </div>
    );
  }

  // Pantalla de autenticación cada vez que se abre la aplicación o se bloquea la sesión
  if (!isAuthenticated) {
    return (
      <LoginScreen
        users={users}
        onAuthenticate={handleAuthenticate}
        lastActiveUserId={currentUserId}
        totalRecordsCount={records.length}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900 selection:bg-blue-500 selection:text-white">
      
      {/* Cabecera Superior con Menú Desplegable Oscuro DON VICENTE y Botones Orgánicos */}
      <Header
        records={records}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currencySymbol={currencySymbol}
        setCurrencySymbol={handleCurrencyChange}
        onResetData={handleResetData}
        onLoadDemoData={handleLoadDemoData}
        currentUser={currentUser}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenCatalogModal={() => setIsCatalogModalOpen(true)}
        lastSaveInfo={lastSaveInfo}
        onManualSave={handleManualSave}
        onLockSession={handleLockSession}
        users={users}
        savedConcepts={savedConcepts}
        savedEntities={savedEntities}
        unreadMessagesCount={unreadMessagesCount}
        onOpenMessagesInbox={() => setIsInboxModalOpen(true)}
      />

      {/* Contenedor de Contenido Principal a Pantalla Completa */}
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
          
          {/* Banner de Información Rápida y Estado */}
          <QuickInsightsBanner 
            records={records} 
            currencySymbol={currencySymbol} 
          />

          {/* Vista Activa */}
          {activeTab === 'entry' && (
            <DataEntryForm
              onAddRecord={handleAddRecord}
              onAddDirectTransfer={handleAddDirectTransfer}
              onOpenInquiry={handleOpenInquiry}
              onViewRecord={handleOpenDetailModal}
              currencySymbol={currencySymbol}
              recentRecords={records}
              onDeleteRecord={handleDeleteRecord}
              onEditRecord={handleOpenEditModal}
              currentUser={currentUser}
              savedConcepts={savedConcepts}
              savedEntities={savedEntities}
              onRecordConcept={handleRecordConcept}
              onRecordEntity={handleRecordEntity}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onOpenCatalogModal={() => setIsCatalogModalOpen(true)}
            />
          )}

          {activeTab === 'history' && (
            <DailyLogTable
              records={records}
              currencySymbol={currencySymbol}
              onDeleteRecord={handleDeleteRecord}
              onEditRecord={handleOpenEditModal}
              onViewRecord={handleOpenDetailModal}
              currentUser={currentUser}
              users={users}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onOpenInquiry={handleOpenInquiry}
            />
          )}

          {activeTab === 'report' && (
            <WeeklyReportView
              records={records}
              currencySymbol={currencySymbol}
              currentUser={currentUser}
              onOpenUserModal={() => setIsUserModalOpen(true)}
              users={users}
            />
          )}
        </main>

      {/* Modal de Gestión y Cambio de Usuarios */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onUpdateUsers={handleUpdateUsers}
        onSaveUser={handleSaveUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* Modal de Importación de Datos (Excel / CSV) */}
      <DataImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportRecords}
        currentUser={currentUser}
        currencySymbol={currencySymbol}
        existingCount={records.length}
      />

      {/* Modal de Catálogos Guardados y Reutilizables */}
      <SavedCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        savedConcepts={savedConcepts}
        savedEntities={savedEntities}
        onUpdateConcepts={handleUpdateConcepts}
        onUpdateEntities={handleUpdateEntities}
      />

      {/* Modal de Edición de Registro con Validación de Seguridad PIN */}
      <EditRecordModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingRecord(null);
        }}
        record={editingRecord}
        onSave={handleSaveEditedRecord}
        currentUser={currentUser}
        users={users}
        currencySymbol={currencySymbol}
        savedConcepts={savedConcepts}
        savedEntities={savedEntities}
        onRecordConcept={handleRecordConcept}
        onRecordEntity={handleRecordEntity}
        messages={messages}
        onMarkMessagesAsRead={handleMarkRecordMessagesAsRead}
      />

      {/* Modal Seguro de Confirmación para Reiniciar a Cero */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={handleConfirmReset}
        recordsCount={records.length}
        isAdmin={currentUser.role === 'admin'}
      />

      {/* Modal de Consulta o Mensaje sobre Registro */}
      <RecordInquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => {
          setIsInquiryModalOpen(false);
          setInquiryRecord(null);
          setInquiryTargetUserId(undefined);
        }}
        record={inquiryRecord}
        currentUser={currentUser}
        users={users}
        messages={messages}
        onSendMessage={handleSendMessage}
        currencySymbol={currencySymbol}
        preselectedRecipientId={inquiryTargetUserId}
        onEditRecord={handleOpenEditModal}
        onUpdateReviewStatus={handleUpdateRecordReviewStatus}
      />

      {/* Modal de Bandeja de Mensajes Internos */}
      <MessagesInboxModal
        isOpen={isInboxModalOpen}
        onClose={() => setIsInboxModalOpen(false)}
        currentUser={currentUser}
        messages={messages}
        records={records}
        onMarkAsRead={handleMarkMessageAsRead}
        onOpenInquiryForRecord={(rec, targetId) => {
          setInquiryRecord(rec);
          setInquiryTargetUserId(targetId);
          setIsInquiryModalOpen(true);
        }}
        onEditRecord={handleOpenEditModal}
        onViewRecord={handleOpenDetailModal}
        currencySymbol={currencySymbol}
      />

      {/* Modal de Ficha Completa del Registro (Información Detallada, Historial y Consultas) */}
      <RecordDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
        record={selectedDetailRecord}
        currentUser={currentUser}
        users={users}
        currencySymbol={currencySymbol}
        messages={messages}
        onEditRecord={handleOpenEditModal}
        onOpenInquiry={handleOpenInquiry}
        onUpdateReviewStatus={handleUpdateRecordReviewStatus}
      />

      {/* Notificación Toast Flotante */}
      {toastNotification && (
        <div 
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900/95 backdrop-blur-xs text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700/60 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div 
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              toastNotification.type === 'error' 
                ? 'bg-rose-500' 
                : toastNotification.type === 'info'
                ? 'bg-blue-400'
                : 'bg-emerald-400'
            }`} 
          />
          <span className="text-xs font-medium leading-relaxed">{toastNotification.message}</span>
          <button
            onClick={() => setToastNotification(null)}
            aria-label="Cerrar notificación"
            className="ml-auto text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
