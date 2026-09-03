import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  X, 
  Check, 
  AlertTriangle, 
  AlertCircle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { FinancialRecord, AppUser } from '../types';
import { parseImportFile, downloadExcelTemplate, ImportResult } from '../utils/importUtils';
import { formatCurrency } from '../utils/financeUtils';
import { formatDisplayDate } from '../utils/dateUtils';

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedRecords: FinancialRecord[], mode: 'merge' | 'replace', discoveredConcepts: string[], discoveredEntities: string[]) => void;
  currentUser: AppUser;
  currencySymbol: string;
  existingCount: number;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  currentUser,
  currencySymbol,
  existingCount,
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setIsProcessing(true);
    setErrorMessage('');
    setImportResult(null);

    try {
      const result = await parseImportFile(file, currentUser.id, currentUser.name);
      setImportResult(result);
    } catch (err: any) {
      console.error('Import error:', err);
      setErrorMessage(err.message || 'Error al procesar el archivo. Verifica el formato e inténtalo nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleConfirmImport = () => {
    if (!importResult || importResult.records.length === 0) return;
    onImportSuccess(
      importResult.records, 
      importMode,
      importResult.discoveredConcepts,
      importResult.discoveredEntities
    );
    onClose();
  };

  const handleResetFile = () => {
    setSelectedFile(null);
    setImportResult(null);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Importar Datos Históricos</h2>
              <p className="text-xs text-slate-500">Carga archivos Excel (.xlsx, .xls) o CSV con movimientos antiguos</p>
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

          {/* Plantilla y Ayuda de Formato */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-blue-50/60 border border-blue-200/80 rounded-2xl">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <p className="font-bold text-blue-950">Formato compatible y auto-detección de columnas</p>
                <p className="text-slate-600 mt-0.5">
                  El sistema reconoce encabezados como <em>Fecha, Tipo (Venta/Gasto), Categoría, Monto, Concepto, Cliente/Proveedor y Método</em>.
                </p>
              </div>
            </div>
            <button
              onClick={() => downloadExcelTemplate(currencySymbol)}
              className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-blue-100/50 text-blue-700 border border-blue-300 rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Plantilla Excel</span>
            </button>
          </div>

          {/* Dropzone o Archivo Seleccionado */}
          {!importResult ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70 bg-white'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4 group-hover:text-blue-600 transition-colors">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
              </div>

              <p className="text-base font-bold text-slate-800">
                {isProcessing ? 'Procesando archivo...' : 'Arrastra tu archivo aquí o haz clic para seleccionarlo'}
              </p>
              <p className="text-xs text-slate-400 mt-1.5">
                Archivos compatibles: Libro de Excel (.xlsx, .xls) o archivo delimitado (.csv)
              </p>
            </div>
          ) : (
            /* Resumen y Vista Previa de Datos Analizados */
            <div className="space-y-5">
              
              {/* Card de Fichero y Botón para cambiar */}
              <div className="flex items-center justify-between p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-950">{selectedFile?.name}</p>
                    <p className="text-xs text-emerald-700">
                      {(selectedFile ? selectedFile.size / 1024 : 0).toFixed(1)} KB • {importResult.validRows} registros detectados correctamente
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleResetFile}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Cambiar archivo
                </button>
              </div>

              {/* Métricas clave del archivo importado */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registros</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{importResult.validRows}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-center">
                  <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Total Ventas</p>
                  <p className="text-sm sm:text-base font-extrabold text-blue-900 mt-0.5">
                    {formatCurrency(importResult.totalSalesAmount, currencySymbol)}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100 text-center">
                  <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Total Gastos</p>
                  <p className="text-sm sm:text-base font-extrabold text-rose-900 mt-0.5">
                    {formatCurrency(importResult.totalExpensesAmount, currencySymbol)}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Período</p>
                  <p className="text-xs font-bold text-slate-700 mt-1 truncate" title={`${importResult.dateRange?.start} a ${importResult.dateRange?.end}`}>
                    {importResult.dateRange ? `${importResult.dateRange.start} al ${importResult.dateRange.end}` : '-'}
                  </p>
                </div>
              </div>

              {/* Selector de Modo de Importación */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                  ¿Cómo deseas incorporar estos datos?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setImportMode('merge')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      importMode === 'merge' 
                        ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="importMode" 
                      checked={importMode === 'merge'} 
                      onChange={() => setImportMode('merge')}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Fusionar con datos actuales (Recomendado)</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Añade los {importResult.validRows} registros a los {existingCount} existentes sin borrar nada.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setImportMode('replace')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      importMode === 'replace' 
                        ? 'border-rose-500 bg-rose-50/40 ring-2 ring-rose-500/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="importMode" 
                      checked={importMode === 'replace'} 
                      onChange={() => setImportMode('replace')}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-xs font-bold text-rose-900">Reemplazar registros existentes</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Sobrescribe todos los registros actuales con los datos de este archivo.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vista previa de las primeras filas */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Vista previa de transacciones ({importResult.validRows} filas)
                  </h4>
                  <span className="text-[10px] text-slate-400">Mostrando primeras 5</span>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                      <tr>
                        <th className="px-3 py-2">Fecha</th>
                        <th className="px-3 py-2">Tipo</th>
                        <th className="px-3 py-2">Categoría</th>
                        <th className="px-3 py-2">Concepto / Entidad</th>
                        <th className="px-3 py-2 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {importResult.records.slice(0, 5).map((r, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-3 py-2 font-semibold text-slate-800 whitespace-nowrap">{r.date}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              r.type === 'sale' ? 'bg-blue-50 text-blue-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {r.type === 'sale' ? 'Venta' : 'Gasto'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-700">{r.category}</td>
                          <td className="px-3 py-2 text-slate-600 max-w-[200px] truncate">
                            {r.description}
                            {r.entityName && <span className="block text-[10px] text-slate-400">({r.entityName})</span>}
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-slate-900 whitespace-nowrap">
                            {formatCurrency(r.amount, currencySymbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Advertencias si hay filas omitidas */}
              {importResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1 max-h-24 overflow-y-auto">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Advertencias ({importResult.warnings.length} filas con detalles)</span>
                  </div>
                  {importResult.warnings.slice(0, 3).map((w, i) => (
                    <p key={i} className="text-[11px] text-amber-700 pl-5">• {w}</p>
                  ))}
                  {importResult.warnings.length > 3 && (
                    <p className="text-[10px] text-amber-600 pl-5 italic">y {importResult.warnings.length - 3} advertencias más...</p>
                  )}
                </div>
              )}

            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error en la lectura del archivo</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          {importResult && (
            <button
              id="btn-confirm-import-data"
              onClick={handleConfirmImport}
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-200 flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Importar {importResult.validRows} Registros</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
