/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FinancialRecord, AppUser } from './types';
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
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DataEntryForm } from './components/DataEntryForm';
import { DailyLogTable } from './components/DailyLogTable';
import { WeeklyReportView } from './components/WeeklyReportView';
import { QuickInsightsBanner } from './components/QuickInsightsBanner';
import { UserManagementModal } from './components/UserManagementModal';
import { DataImportModal } from './components/DataImportModal';
import { SavedCatalogModal } from './components/SavedCatalogModal';
import { EditRecordModal } from './components/EditRecordModal';

const LOCAL_STORAGE_KEY_RECORDS = 'fin_control_records_v1';
const LOCAL_STORAGE_KEY_CURRENCY = 'fin_control_currency_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'report'>('entry');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Estados de Usuarios y Permisos
  const [users, setUsers] = useState<AppUser[]>(DEFAULT_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>(DEFAULT_USERS[0].id);
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);

  // Estados de Catálogo Reutilizable
  const [savedConcepts, setSavedConcepts] = useState<SavedItem[]>(DEFAULT_SAVED_CONCEPTS);
  const [savedEntities, setSavedEntities] = useState<SavedItem[]>(DEFAULT_SAVED_ENTITIES);

  // Estados de Modales de Importación, Catálogo y Edición
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<FinancialRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Cargar datos persistentes
  useEffect(() => {
    try {
      const savedRecords = localStorage.getItem(LOCAL_STORAGE_KEY_RECORDS);
      const savedCurrency = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENCY);

      if (savedCurrency) {
        setCurrencySymbol(savedCurrency);
      }

      if (savedRecords) {
        const parsed = JSON.parse(savedRecords);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecords(parsed);
        } else {
          const initial = getInitialDemoRecords();
          setRecords(initial);
          localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(initial));
        }
      } else {
        const initial = getInitialDemoRecords();
        setRecords(initial);
        localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(initial));
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
    } catch (err) {
      console.error('Error loading records from localStorage:', err);
      setRecords(getInitialDemoRecords());
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const currentUser = users.find(u => u.id === currentUserId) || users[0] || DEFAULT_USERS[0];

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
  const handleUpdateUsers = (updatedUsers: AppUser[]) => {
    setUsers(updatedUsers);
    saveStoredUsers(updatedUsers);
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

  // Guardar cambios en records
  const updateRecords = (newRecords: FinancialRecord[]) => {
    setRecords(newRecords);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_RECORDS, JSON.stringify(newRecords));
    } catch (err) {
      console.error('Error saving records:', err);
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

  // Agregar nuevo movimiento
  const handleAddRecord = (data: Omit<FinancialRecord, 'id' | 'createdAt'>) => {
    const newRecord: FinancialRecord = {
      ...data,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy || currentUser.id,
      createdByName: data.createdByName || currentUser.name,
    };
    const updated = [newRecord, ...records];
    updateRecords(updated);

    // Guardar concepto y cliente en catálogos reutilizables
    if (newRecord.description && newRecord.description.trim()) {
      handleRecordConcept(newRecord.description.trim(), newRecord.type);
    }
    if (newRecord.entityName && newRecord.entityName.trim()) {
      handleRecordEntity(newRecord.entityName.trim(), newRecord.type);
    }
  };

  // Importar registros masivos (desde Excel o CSV)
  const handleImportRecords = (
    newRecords: FinancialRecord[], 
    mode: 'merge' | 'replace',
    _discoveredConcepts: string[] = [],
    _discoveredEntities: string[] = []
  ) => {
    // Asignar el creador si no viene especificado
    const processed = newRecords.map(r => ({
      ...r,
      createdBy: r.createdBy || currentUser.id,
      createdByName: r.createdByName || currentUser.name,
    }));

    let updatedList: FinancialRecord[];
    if (mode === 'replace') {
      updatedList = processed;
    } else {
      updatedList = [...processed, ...records];
    }

    updateRecords(updatedList);

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
  };

  // Eliminar un movimiento (Solo Admin)
  const handleDeleteRecord = (id: string) => {
    if (currentUser.role !== 'admin') {
      alert('Solo el Administrador tiene permiso para eliminar registros.');
      return;
    }
    const updated = records.filter(r => r.id !== id);
    updateRecords(updated);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (record: FinancialRecord) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  // Guardar registro editado
  const handleSaveEditedRecord = (updatedRecord: FinancialRecord) => {
    const updated = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
    updateRecords(updated);
    setIsEditModalOpen(false);
    setEditingRecord(null);
  };

  // Cargar datos demo
  const handleLoadDemoData = () => {
    if (currentUser.role !== 'admin') {
      alert('Solo el Administrador puede recargar los datos demo.');
      return;
    }
    const demo = getInitialDemoRecords();
    updateRecords(demo);
  };

  // Limpiar todos los datos
  const handleResetData = () => {
    if (currentUser.role !== 'admin') {
      alert('Solo el Administrador puede reiniciar la base de datos.');
      return;
    }
    if (window.confirm('¿Seguro que deseas reiniciar y borrar todos los movimientos registrados?')) {
      updateRecords([]);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm font-medium">
        Cargando base de datos financiera...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans text-slate-900 selection:bg-blue-500 selection:text-white">
      
      {/* Sidebar Oscuro Navy del Diseño "Sleek" */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        records={records}
        currencySymbol={currencySymbol}
        setCurrencySymbol={handleCurrencyChange}
        onLoadDemoData={handleLoadDemoData}
        onResetData={handleResetData}
        currentUser={currentUser}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenCatalogModal={() => setIsCatalogModalOpen(true)}
      />

      {/* Área Principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Cabecera Superior */}
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
        />

        {/* Contenedor de Contenido */}
        <main className="p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8 flex-1">
          
          {/* Banner de Información Rápida y Estado */}
          <QuickInsightsBanner 
            records={records} 
            currencySymbol={currencySymbol} 
          />

          {/* Vista Activa */}
          {activeTab === 'entry' && (
            <DataEntryForm
              onAddRecord={handleAddRecord}
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
              currentUser={currentUser}
              users={users}
              onOpenImportModal={() => setIsImportModalOpen(true)}
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
      </div>

      {/* Modal de Gestión y Cambio de Usuarios */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        onUpdateUsers={handleUpdateUsers}
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
      />

    </div>
  );
}
