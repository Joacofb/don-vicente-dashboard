import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Sparkles,
  ArrowLeft,
  Delete,
  HardDrive
} from 'lucide-react';
import { AppUser } from '../types';

interface LoginScreenProps {
  users: AppUser[];
  onAuthenticate: (user: AppUser) => void;
  lastActiveUserId?: string;
  totalRecordsCount?: number;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onAuthenticate,
  lastActiveUserId,
  totalRecordsCount = 0,
}) => {
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Seleccionar automáticamente si había un usuario activo previo sugerido
  useEffect(() => {
    if (lastActiveUserId && !selectedUser) {
      const found = users.find(u => u.id === lastActiveUserId);
      if (found) {
        setSelectedUser(found);
      }
    }
  }, [lastActiveUserId, users]);

  const handleSelectUser = (user: AppUser) => {
    setSelectedUser(user);
    setPinInput('');
    setPinError('');
    // Si el usuario no tiene PIN configurado, ingresa directamente
    if (!user.pin || user.pin.trim().length === 0) {
      onAuthenticate(user);
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pinInput.length < 6) {
      setPinInput(prev => prev + digit);
      setPinError('');
    }
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
    setPinError('');
  };

  const handleClear = () => {
    setPinInput('');
    setPinError('');
  };

  const handleSubmitPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser) return;

    const trimmedInput = pinInput.trim();
    const userPin = (selectedUser.pin || '').trim();

    if (!trimmedInput) {
      setPinError('Por favor ingresa tu código PIN de acceso.');
      return;
    }

    if (userPin && trimmedInput === userPin) {
      setPinError('');
      onAuthenticate(selectedUser);
    } else {
      setPinError('Código PIN incorrecto. Inténtalo nuevamente.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setPinInput('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans selection:bg-blue-500 selection:text-white relative overflow-hidden">
      
      {/* Elementos decorativos sutiles de fondo */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md mx-auto relative z-10">
        
        {/* Cabecera / Identidad de la App */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-blue-600/30 mb-4 border border-blue-400/20">
            DV
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
            DON VICENTE
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">
              Dashboard Financiero
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-medium">
              Control Diario
            </span>
          </div>
        </div>

        {/* Tarjeta de Autenticación */}
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl transition-all duration-300">
          
          {/* Pantalla 1: Selección de Usuario */}
          {!selectedUser || (!selectedUser.pin && false) ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center pb-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  ¿Quién está usando el sistema?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Selecciona tu usuario para iniciar tu jornada y registrar movimientos
                </p>
              </div>

              <div className="space-y-3">
                {users.map((u) => {
                  const isAdmin = u.role === 'admin';
                  const hasPin = !!(u.pin && u.pin.trim().length > 0);

                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className="w-full p-3.5 sm:p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-blue-500/50 flex items-center justify-between text-left transition-all duration-200 group cursor-pointer active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl ${u.avatarColor} text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                          {u.avatar || u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-100 group-hover:text-blue-400 transition-colors truncate">
                            {u.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isAdmin ? (
                              <span className="text-[10px] font-semibold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full border border-blue-500/30">
                                Administrador
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                Operador
                              </span>
                            )}
                            {hasPin && (
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> PIN
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-colors shrink-0 ml-2">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Pantalla 2: Ingreso de PIN de Seguridad para el usuario seleccionado */
            <div className={`space-y-5 animate-in fade-in duration-200 ${isShaking ? 'animate-bounce' : ''}`}>
              
              {/* Botón Volver */}
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setPinInput('');
                  setPinError('');
                }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Elegir otro usuario</span>
              </button>

              {/* Perfil del Usuario Elegido */}
              <div className="text-center pt-1 pb-2">
                <div className={`w-14 h-14 rounded-2xl ${selectedUser.avatarColor} text-white flex items-center justify-center font-bold text-lg mx-auto shadow-lg mb-3 ring-4 ring-slate-700/50`}>
                  {selectedUser.avatar || selectedUser.name.slice(0, 2).toUpperCase()}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  {selectedUser.name}
                </h2>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  {selectedUser.role === 'admin' ? (
                    <span className="text-[11px] font-semibold text-blue-300 bg-blue-500/20 px-2.5 py-0.5 rounded-full border border-blue-500/30 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-blue-400" /> Administrador General
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-emerald-400" /> Operador
                    </span>
                  )}
                </div>
              </div>

              {/* Formulario de PIN */}
              <form onSubmit={handleSubmitPin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2 text-center">
                    Ingresa tu código PIN de acceso:
                  </label>
                  
                  {/* Visor de PIN / Dots */}
                  <div className="relative max-w-xs mx-auto">
                    <input
                      type={showPin ? "text" : "password"}
                      value={pinInput}
                      onChange={(e) => {
                        setPinInput(e.target.value);
                        setPinError('');
                      }}
                      placeholder="••••"
                      maxLength={6}
                      autoFocus
                      className="w-full text-center tracking-[0.4em] font-mono text-xl py-3 px-4 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer p-1"
                      title={showPin ? 'Ocultar código' : 'Mostrar código'}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {pinError && (
                    <div className="mt-2 text-xs text-rose-400 flex items-center justify-center gap-1.5 bg-rose-500/10 border border-rose-500/20 py-2 px-3 rounded-xl">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{pinError}</span>
                    </div>
                  )}

                  {selectedUser.role === 'admin' && (
                    <p className="text-[11px] text-slate-400 text-center mt-2">
                      Código de fábrica: <strong className="text-blue-400">1234</strong>
                    </p>
                  )}
                </div>

                {/* Teclado numérico táctil / rápido */}
                <div className="max-w-xs mx-auto grid grid-cols-3 gap-2 pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      className="h-11 rounded-xl bg-slate-900/80 hover:bg-slate-700 text-slate-200 font-bold text-base border border-slate-700/60 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleClear}
                    className="h-11 rounded-xl bg-slate-900/50 hover:bg-slate-700 text-slate-400 font-medium text-xs border border-slate-700/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  >
                    Borrar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="h-11 rounded-xl bg-slate-900/80 hover:bg-slate-700 text-slate-200 font-bold text-base border border-slate-700/60 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleBackspace}
                    className="h-11 rounded-xl bg-slate-900/50 hover:bg-slate-700 text-slate-300 font-medium text-sm border border-slate-700/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    title="Retroceso"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                </div>

                {/* Botón Ingresar */}
                <div className="pt-2 max-w-xs mx-auto">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Ingresar al Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Información de Persistencia y Seguridad en el pie */}
        <div className="mt-6 text-center space-y-1 text-slate-400 text-xs">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-[11px] text-slate-300">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Persistencia local activa • {totalRecordsCount} transacciones guardadas</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Tus datos se conservan de forma segura en este navegador
          </p>
        </div>

      </div>
    </div>
  );
};
