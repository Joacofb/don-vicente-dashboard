import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  X, 
  Check, 
  Lock, 
  AlertCircle,
  Edit3,
  Plus,
  Trash2,
  Cloud,
  Loader2,
  UserPlus
} from 'lucide-react';
import { AppUser } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  currentUser: AppUser;
  onSwitchUser: (userId: string, pinAttempt?: string) => { success: boolean; message?: string };
  onUpdateUsers: (updatedUsers: AppUser[]) => void;
  onSaveUser?: (user: AppUser) => Promise<void> | void;
  onDeleteUser?: (userId: string) => Promise<void> | void;
}

const AVATAR_COLORS = [
  { label: 'Azul', value: 'bg-blue-600' },
  { label: 'Esmeralda', value: 'bg-emerald-600' },
  { label: 'Índigo', value: 'bg-indigo-600' },
  { label: 'Violeta', value: 'bg-purple-600' },
  { label: 'Ámbar', value: 'bg-amber-600' },
  { label: 'Rosa', value: 'bg-rose-600' },
  { label: 'Cian', value: 'bg-teal-600' },
  { label: 'Pizarra', value: 'bg-slate-700' },
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSwitchUser,
  onSaveUser,
  onDeleteUser,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Estados para formulario de Crear/Editar Usuario
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null); // null = nuevo usuario
  const [formName, setFormName] = useState<string>('');
  const [formRole, setFormRole] = useState<'admin' | 'operator'>('operator');
  const [formRoleLabel, setFormRoleLabel] = useState<string>('');
  const [formAvatarColor, setFormAvatarColor] = useState<string>('bg-blue-600');
  const [formPin, setFormPin] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetUser = users.find(u => u.id === selectedUserId) || users[0];
  const requiresPin = targetUser.role === 'admin' && targetUser.pin && targetUser.pin.trim().length > 0 && currentUser.id !== targetUser.id;

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleSelectUserToSwitch = (user: AppUser) => {
    setSelectedUserId(user.id);
    setPinInput('');
    setPinError('');
  };

  const handleConfirmSwitch = () => {
    const result = onSwitchUser(selectedUserId, pinInput);
    if (result.success) {
      onClose();
    } else {
      setPinError(result.message || 'PIN de seguridad incorrecto.');
    }
  };

  const handleOpenCreateForm = () => {
    setEditingUserId(null);
    setFormName('');
    setFormRole('operator');
    setFormRoleLabel('Operador de Turno');
    setFormAvatarColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)].value);
    setFormPin('');
    setFormDescription('Registro diario de ventas y gastos en caja.');
    setIsFormOpen(true);
    setDeleteConfirmId(null);
  };

  const handleOpenEditForm = (user: AppUser, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormRole(user.role);
    setFormRoleLabel(user.roleLabel);
    setFormAvatarColor(user.avatarColor || 'bg-blue-600');
    setFormPin(user.pin || '');
    setFormDescription(user.description || '');
    setIsFormOpen(true);
    setDeleteConfirmId(null);
  };

  const handleRoleChange = (newRole: 'admin' | 'operator') => {
    setFormRole(newRole);
    if (newRole === 'admin' && formRoleLabel === 'Operador de Turno') {
      setFormRoleLabel('Administrador General');
    } else if (newRole === 'operator' && formRoleLabel === 'Administrador General') {
      setFormRoleLabel('Operador de Turno');
    }
  };

  const handleSaveUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showFeedback('error', 'El nombre del usuario es obligatorio.');
      return;
    }

    setIsSaving(true);

    const initials = formName.trim().slice(0, 2).toUpperCase();
    const userPayload: AppUser = {
      id: editingUserId ? editingUserId : `user-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: formName.trim(),
      role: formRole,
      roleLabel: formRoleLabel.trim() || (formRole === 'admin' ? 'Administrador' : 'Operador'),
      avatarColor: formAvatarColor,
      avatar: initials,
      description: formDescription.trim(),
      pin: formPin.trim(),
      createdAt: editingUserId ? (users.find(u => u.id === editingUserId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    try {
      if (onSaveUser) {
        await onSaveUser(userPayload);
      }
      setIsFormOpen(false);
      showFeedback('success', editingUserId ? `Usuario "${userPayload.name}" actualizado en la base de datos.` : `Usuario "${userPayload.name}" creado y registrado en la base de datos.`);
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      showFeedback('error', 'No se pudo guardar el usuario en la base de datos.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUserClick = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (userId === currentUser.id) {
      showFeedback('error', 'No puedes eliminar la cuenta con la que tienes la sesión activa.');
      return;
    }

    const adminCount = users.filter(u => u.role === 'admin').length;
    const target = users.find(u => u.id === userId);
    if (target?.role === 'admin' && adminCount <= 1) {
      showFeedback('error', 'No se puede eliminar el único administrador del sistema.');
      return;
    }

    if (deleteConfirmId !== userId) {
      setDeleteConfirmId(userId);
      return;
    }

    setIsSaving(true);
    try {
      if (onDeleteUser) {
        await onDeleteUser(userId);
      }
      setDeleteConfirmId(null);
      if (selectedUserId === userId) {
        setSelectedUserId(currentUser.id);
      }
      showFeedback('success', 'Usuario eliminado de la base de datos.');
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      showFeedback('error', 'Ocurrió un error al eliminar el usuario.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Gestión de Usuarios y Base de Datos</h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                  <Cloud className="w-3 h-3 text-blue-600" />
                  Firestore Activo
                </span>
              </div>
              <p className="text-xs text-slate-500">Crea, edita y asigna roles con sincronización en la nube</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          
          {/* Mensajes de retroalimentación */}
          {feedbackMessage && (
            <div className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 border animate-in fade-in duration-150 ${
              feedbackMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {feedbackMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {/* Alerta de Modo de Acceso Actual */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
            currentUser.role === 'admin' 
              ? 'bg-blue-50/70 border-blue-200 text-blue-900' 
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}>
            {currentUser.role === 'admin' ? (
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            ) : (
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <p className="font-bold">
                Sesión actual: <span className="underline">{currentUser.name}</span> ({currentUser.roleLabel})
              </p>
              <p className="text-slate-600 mt-0.5">
                {currentUser.role === 'admin' 
                  ? 'Tienes permisos de Administrador: puedes crear nuevos usuarios, editar los existentes, gestionar PINs y permisos.' 
                  : 'Modo Operador: Puedes seleccionar tu cuenta para cambiar de turno. Solo los administradores pueden añadir o modificar usuarios.'}
              </p>
            </div>
          </div>

          {/* Formulario para Crear / Editar Usuario */}
          {isFormOpen ? (
            <form onSubmit={handleSaveUserForm} className="space-y-4 bg-slate-50 p-5 sm:p-6 rounded-2xl border border-slate-200 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    {editingUserId ? 'Editar Usuario en la Base de Datos' : 'Registrar Nuevo Usuario en la Base de Datos'}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">Guardado en Firestore</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nombre completo o alias *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ej: Marcelo Torres"
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>

                {/* Rol */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Rol del sistema *</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as 'admin' | 'operator')}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="operator">Operador (Entrada de datos y caja)</option>
                    <option value="admin">Administrador (Control total y reportes)</option>
                  </select>
                </div>

                {/* Cargo / Puesto Visible */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Etiqueta visible de cargo</label>
                  <input
                    type="text"
                    value={formRoleLabel}
                    onChange={(e) => setFormRoleLabel(e.target.value)}
                    placeholder="Ej: Encargado Turno Noche, Cajero, etc."
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>

                {/* PIN de Seguridad */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                    <span>PIN de Acceso (4 a 6 dígitos numéricos)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder={formRole === 'admin' ? 'Ej: 1234 (Recomendado)' : 'Opcional (Dejar en blanco para acceso directo)'}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
              </div>

              {/* Selector de Color del Avatar */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-slate-700">Color distintivo del avatar</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {AVATAR_COLORS.map(col => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setFormAvatarColor(col.value)}
                      className={`w-7 h-7 rounded-xl ${col.value} transition-transform flex items-center justify-center text-white ${
                        formAvatarColor === col.value ? 'ring-2 ring-offset-2 ring-blue-600 scale-110 shadow-sm' : 'opacity-80 hover:opacity-100'
                      }`}
                      title={col.label}
                    >
                      {formAvatarColor === col.value && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  ))}
                  <div className="ml-2 flex items-center gap-2 text-xs text-slate-500">
                    <div className={`w-6 h-6 rounded-lg ${formAvatarColor} text-white flex items-center justify-center font-bold text-xs`}>
                      {formName.trim().slice(0, 2).toUpperCase() || 'AV'}
                    </div>
                    <span>Vista previa</span>
                  </div>
                </div>
              </div>

              {/* Descripción de funciones */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Descripción o notas de función</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Ej: Encargado de recepción y cobros durante el turno de la tarde"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>

              {/* Botones del Formulario */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingUserId ? 'Actualizar Usuario' : 'Registrar en Base de Datos'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Lista de Usuarios Registrados en Base de Datos */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <span>Usuarios Registrados</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                    {users.length}
                  </span>
                </h3>

                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={handleOpenCreateForm}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nuevo Usuario</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {users.map((user) => {
                  const isSelected = selectedUserId === user.id;
                  const isCurrent = currentUser.id === user.id;
                  const isDeleting = deleteConfirmId === user.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUserToSwitch(user)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-2xl ${user.avatarColor || 'bg-blue-600'} text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0`}>
                          {user.avatar || user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-900">{user.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              user.role === 'admin' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {user.roleLabel}
                            </span>
                            {user.pin && user.pin.trim().length > 0 && (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-0.5" title="Protegido por PIN">
                                <Lock className="w-2.5 h-2.5" />
                                PIN
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                Sesión Activa
                              </span>
                            )}
                          </div>
                          
                          {user.description && (
                            <p className="text-xs text-slate-500 mt-1">{user.description}</p>
                          )}

                          {/* Permisos visuales */}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 flex-wrap">
                            <span className="text-emerald-700 flex items-center gap-1 font-medium">
                              ✓ Entrada de Datos
                            </span>
                            <span className="text-emerald-700 flex items-center gap-1 font-medium">
                              ✓ Consulta Historial
                            </span>
                            {user.role === 'admin' ? (
                              <>
                                <span className="text-blue-700 flex items-center gap-1 font-medium">
                                  ✓ Eliminar Registros
                                </span>
                                <span className="text-blue-700 flex items-center gap-1 font-medium">
                                  ✓ Informes & Balances
                                </span>
                                <span className="text-blue-700 flex items-center gap-1 font-medium">
                                  ✓ Gestión de Usuarios
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-1 italic">
                                ✕ Sin permiso de eliminación ni gestión
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Acciones de Edición y Selección */}
                      <div className="shrink-0 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {currentUser.role === 'admin' && (
                          <div className="flex items-center gap-1">
                            {/* Botón Editar */}
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditForm(user, e)}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                              title={`Editar datos de ${user.name}`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Botón Eliminar */}
                            {users.length > 1 && !isCurrent && (
                              <button
                                type="button"
                                onClick={(e) => handleDeleteUserClick(user.id, e)}
                                className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                                  isDeleting 
                                    ? 'bg-rose-600 text-white hover:bg-rose-700 px-2.5 shadow-sm' 
                                    : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                }`}
                                title={isDeleting ? 'Haz clic de nuevo para confirmar eliminación' : 'Eliminar usuario de la base de datos'}
                              >
                                <Trash2 className="w-4 h-4" />
                                {isDeleting && <span>¿Confirmar?</span>}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Indicador de Selección para Cambio de Turno */}
                        <div 
                          onClick={() => handleSelectUserToSwitch(user)}
                          className={`w-6 h-6 rounded-full border flex items-center justify-center cursor-pointer transition-colors ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 hover:border-slate-400'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Solicitud de PIN si se selecciona Admin desde un Operador */}
          {!isFormOpen && requiresPin && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Se requiere PIN para cambiar a la cuenta Administrador</span>
              </div>
              <p className="text-[11px] text-amber-700">
                Ingresa el PIN de seguridad asignado a esta cuenta para cambiar de turno.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  maxLength={6}
                  placeholder="PIN..."
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmSwitch();
                  }}
                  className="px-3 py-2 text-sm font-bold tracking-widest rounded-xl border border-amber-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white w-36 text-center"
                />
              </div>
            </div>
          )}

          {pinError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Cerrar
          </button>

          {!isFormOpen && (
            <button
              id="btn-confirm-switch-user"
              onClick={handleConfirmSwitch}
              disabled={selectedUserId === currentUser.id}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Operar como {targetUser.name}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
