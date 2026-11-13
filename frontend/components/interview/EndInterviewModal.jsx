'use client';

import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function EndInterviewModal({ onConfirm, onCancel, questionCount, isEnding = false, error = '' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">End interview session?</h2>
            <p className="text-sm text-slate-500 mt-1">
              You have asked {questionCount || 0} question{questionCount !== 1 ? 's' : ''} so far. This action cannot be undone.
            </p>
          </div>
        </div>
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
        <div className="flex gap-3">
          <Button variant="secondary" size="md" onClick={onCancel} disabled={isEnding} className="flex-1">Cancel</Button>
          <Button variant="danger" size="md" onClick={onConfirm} disabled={isEnding} className="flex-1">
            {isEnding ? 'Ending session…' : 'End Session'}
          </Button>
        </div>
      </div>
    </div>
  );
}

