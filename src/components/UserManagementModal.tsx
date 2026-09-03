import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  UserCheck, 
  KeyRound, 
  X, 
  Check, 
  Lock, 
  Unlock, 
  AlertCircle,
  Edit3,
  Sparkles
} from 'lucide-react';
import { AppUser } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  currentUser: AppUser;
  onSwitchUser: (userId: string, pinAttempt?: string) => { success: boolean; message?: string };
  onUpdateUsers: (updatedUsers: AppUser[]) => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUser,
  onSwitchUser,
  onUpdateUsers,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isEditingNames, setIsEditingNames] = useState<boolean>(false);
  const [editedUsers, setEditedUsers] = useState<AppUser[]>(users);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const targetUser = users.find(u => u.id === selectedUserId) || users[0];
  const requiresPin = targetUser.role === 'admin' && targetUser.pin && targetUser.pin.trim().length > 0 && currentUser.id !== targetUser.id;

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

  const handleSaveUserNames = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUsers(editedUsers);
    setIsEditingNames(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Gestión de Usuarios y Roles</h2>
              <p className="text-xs text-slate-500">Sistema multiusuario con permisos jerárquicos</p>
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
                  ? 'Tienes todos los derechos del sistema: entrada, consulta, eliminación, reportes de margen y descargas Excel.' 
                  : 'Modo Operador: Puedes registrar ventas/gastos diarios y consultar el historial. Las opciones de eliminación y reportes financieros están restringidas al Administrador.'}
              </p>
            </div>
          </div>

          {/* Formulario de Edición de Nombres (Solo para Admin) */}
          {isEditingNames ? (
            <form onSubmit={handleSaveUserNames} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">Personalizar Nombres de Usuarios</h3>
                <span className="text-[11px] text-slate-500">Solo visible para el Administrador</span>
              </div>

              {editedUsers.map((u, idx) => (
                <div key={u.id} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${u.avatarColor}`} />
                    {u.role === 'admin' ? 'Usuario Administrador (Tú)' : `Operador ${idx}`} ({u.roleLabel})
                  </label>
                  <input
                    type="text"
                    required
                    value={u.name}
                    onChange={(e) => {
                      const updated = [...editedUsers];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      setEditedUsers(updated);
                    }}
                    placeholder="Nombre del usuario..."
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                  {u.role === 'admin' && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        maxLength={6}
                        value={u.pin || ''}
                        onChange={(e) => {
                          const updated = [...editedUsers];
                          updated[idx] = { ...updated[idx], pin: e.target.value };
                          setEditedUsers(updated);
                        }}
                        placeholder="PIN de acceso Admin (Ej: 1234 o dejar vacío)"
                        className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white w-48"
                      />
                      <span className="text-[10px] text-slate-400">PIN para proteger acceso admin</span>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingNames(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          ) : (
            /* Lista de los 3 Usuarios */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Seleccionar Usuario para Operar
                </h3>
                {currentUser.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditedUsers(users);
                      setIsEditingNames(true);
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Nombres / PIN</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {users.map((user) => {
                  const isSelected = selectedUserId === user.id;
                  const isCurrent = currentUser.id === user.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => handleSelectUserToSwitch(user)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20' 
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-2xl ${user.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0`}>
                          {user.name.slice(0, 2).toUpperCase()}
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
                            {isCurrent && (
                              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                Activo
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs text-slate-500 mt-1">{user.description}</p>

                          {/* Permisos visuales */}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-600 flex-wrap">
                            <span className="text-emerald-700 flex items-center gap-1 font-medium">
                              ✓ Entrada de Datos
                            </span>
                            <span className="text-emerald-700 flex items-center gap-1 font-medium">
                              ✓ Consulta de Historial
                            </span>
                            {user.role === 'admin' ? (
                              <>
                                <span className="text-blue-700 flex items-center gap-1 font-medium">
                                  ✓ Eliminar Registros
                                </span>
                                <span className="text-blue-700 flex items-center gap-1 font-medium">
                                  ✓ Reportes y Balances
                                </span>
                                <span className="text-blue-700 flex items-center gap-1 font-medium">
                                  ✓ Exportar Excel
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-400 flex items-center gap-1 italic">
                                ✕ Sin permiso de eliminación ni reportes
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center justify-end">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Solicitud de PIN si se selecciona Admin desde un Operador */}
          {requiresPin && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Se requiere PIN para cambiar a la cuenta Administrador</span>
              </div>
              <p className="text-[11px] text-amber-700">
                Ingresa el PIN de seguridad (PIN por defecto: <strong>1234</strong>) para proteger los derechos de administración.
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

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Nombres y configuración de usuarios guardados correctamente.</span>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Cerrar
          </button>

          <button
            id="btn-confirm-switch-user"
            onClick={handleConfirmSwitch}
            disabled={selectedUserId === currentUser.id}
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-xl transition-all shadow-md shadow-blue-200 flex items-center gap-2 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Ingresar como {targetUser.name}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
