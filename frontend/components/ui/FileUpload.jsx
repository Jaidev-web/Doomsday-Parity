'use client';
import { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export function FileUpload({
  label = 'Upload Document',
  accept = '.pdf,.docx,.png,.jpg,.jpeg',
  maxSizeMB = 10,
  onFileSelect,
  className,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    setError(null);
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File exceeds maximum size of ${maxSizeMB}MB`);
      return;
    }

    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
    onFileSelect?.(null);
  };

  return (
    <div className={cn('w-full', className)}>
      {label && <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">{label}</label>}

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center',
          dragActive
            ? 'border-indigo-500 bg-indigo-50/50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50',
          selectedFile && 'border-emerald-400 bg-emerald-50/30'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFile(e.target.files?.[0])}
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex items-center gap-3 w-full justify-between px-2">
            <div className="flex items-center gap-3 truncate">
              <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-600 shrink-0">
                <File className="w-5 h-5" />
              </div>
              <div className="text-left truncate">
                <p className="text-sm font-medium text-slate-900 truncate">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="p-3 bg-white shadow-xs rounded-xl border border-slate-200 text-indigo-600 mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-800">
              Click to upload <span className="text-slate-500 font-normal">or drag and drop</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">PDF, DOCX, PNG, or JPG (max {maxSizeMB}MB)</p>
          </>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
