import React, { useState } from 'react';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  Check, 
  Building2, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Tag
} from 'lucide-react';
import { SavedItem } from '../data/savedItemsData';

interface SavedCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedConcepts?: SavedItem[];
  savedEntities?: SavedItem[];
  onUpdateConcepts?: (concepts: SavedItem[]) => void;
  onUpdateEntities?: (entities: SavedItem[]) => void;
  onSelectConcept?: (concept: string) => void;
  onSelectEntity?: (entity: string) => void;
}

export const SavedCatalogModal: React.FC<SavedCatalogModalProps> = ({
  isOpen,
  onClose,
  savedConcepts = [],
  savedEntities = [],
  onUpdateConcepts,
  onUpdateEntities,
  onSelectConcept,
  onSelectEntity,
}) => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'entities'>('concepts');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newType, setNewType] = useState<'sale' | 'expense' | 'both'>('both');

  if (!isOpen) return null;

  const safeConcepts = savedConcepts || [];
  const safeEntities = savedEntities || [];
  const currentList = activeTab === 'concepts' ? safeConcepts : safeEntities;

  const filteredList = currentList.filter(item => 
    item && item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    if (activeTab === 'concepts') {
      if (safeConcepts.some(c => c && c.name.toLowerCase() === trimmed.toLowerCase())) {
        alert('Este concepto ya se encuentra en tu catálogo guardado.');
        return;
      }
      const newItem: SavedItem = {
        id: `c-${Date.now()}`,
        name: trimmed,
        type: newType,
        usageCount: 1,
        lastUsed: new Date().toISOString(),
      };
      onUpdateConcepts?.([newItem, ...safeConcepts]);
    } else {
      if (safeEntities.some(e => e && e.name.toLowerCase() === trimmed.toLowerCase())) {
        alert('Este cliente o proveedor ya se encuentra en tu catálogo guardado.');
        return;
      }
      const newItem: SavedItem = {
        id: `e-${Date.now()}`,
        name: trimmed,
        type: newType,
        usageCount: 1,
        lastUsed: new Date().toISOString(),
      };
      onUpdateEntities?.([newItem, ...safeEntities]);
    }

    setNewName('');
  };

  const handleDeleteItem = (id: string) => {
    if (activeTab === 'concepts') {
      onUpdateConcepts?.(safeConcepts.filter(c => c && c.id !== id));
    } else {
      onUpdateEntities?.(safeEntities.filter(e => e && e.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Catálogo de Conceptos y Clientes Reutilizables</h2>
              <p className="text-xs text-slate-500">Elementos guardados para autocompletar y filtrar rápidamente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/80 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 sm:px-8 pt-4 pb-2 border-b border-slate-100 flex items-center gap-3">
          <button
            onClick={() => { setActiveTab('concepts'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'concepts'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Conceptos / Descripciones ({savedConcepts.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('entities'); setSearchTerm(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'entities'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Clientes / Proveedores ({savedEntities.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5">

          {/* Formulario para Añadir Nuevo */}
          <form onSubmit={handleAddItem} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Añadir {activeTab === 'concepts' ? 'Nuevo Concepto Frecuente' : 'Nuevo Cliente / Proveedor'}</span>
            </h4>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                required
                placeholder={activeTab === 'concepts' ? 'Ej: Venta mayorista lote #1...' : 'Ej: Distribuidora del Norte...'}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              />

              <select
                aria-label="Tipo de aplicabilidad"
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="both">Ventas y Gastos</option>
                <option value="sale">Solo Ventas</option>
                <option value="expense">Solo Gastos</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Guardar</span>
              </button>
            </div>
          </form>

          {/* Buscador */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Buscar entre los ${currentList.length} ${activeTab === 'concepts' ? 'conceptos' : 'clientes/proveedores'} guardados...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
            />
          </div>

          {/* Lista de Items */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No se encontraron elementos que coincidan con la búsqueda.
              </div>
            ) : (
              filteredList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-white hover:bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between gap-3 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      item.type === 'sale' 
                        ? 'bg-blue-500' 
                        : item.type === 'expense' 
                          ? 'bg-rose-500' 
                          : 'bg-indigo-500'
                    }`} />
                    <span className="text-xs font-bold text-slate-800 truncate" title={item.name}>
                      {item.name}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                      item.type === 'sale' 
                        ? 'bg-blue-50 text-blue-700' 
                        : item.type === 'expense' 
                          ? 'bg-rose-50 text-rose-700' 
                          : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {item.type === 'sale' ? 'Venta' : item.type === 'expense' ? 'Gasto' : 'Ambos'}
                    </span>
                    {item.usageCount > 1 && (
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">
                        {item.usageCount} usos
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {(onSelectConcept || onSelectEntity) && (
                      <button
                        onClick={() => {
                          if (activeTab === 'concepts' && onSelectConcept) {
                            onSelectConcept(item.name);
                            onClose();
                          } else if (activeTab === 'entities' && onSelectEntity) {
                            onSelectEntity(item.name);
                            onClose();
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        Usar
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar del catálogo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/70">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
          >
            Listo
          </button>
        </div>

      </div>
    </div>
  );
};
