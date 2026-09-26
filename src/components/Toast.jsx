import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

export const Toast = React.memo(function Toast({ toast }) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emeraldGlow" />,
    error: <XCircle className="w-4 h-4 text-roseAlert" />,
    warn: <AlertTriangle className="w-4 h-4 text-amberWarn" />,
    info: <Info className="w-4 h-4 text-cyanGlow" />
  };

  const borderColors = {
    success: 'border-emeraldGlow/40 shadow-[0_0_20px_rgba(34,197,94,0.25)]',
    error: 'border-roseAlert/40 shadow-[0_0_20px_rgba(244,63,94,0.25)]',
    warn: 'border-amberWarn/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
    info: 'border-cyanGlow/40 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none transition-all duration-300">
      <div className={`glass-card px-5 py-3 rounded-2xl flex items-center gap-3 border ${borderColors[toast.type || 'info']} bg-obsidian/95 backdrop-blur-xl animate-bounce`}>
        {icons[toast.type || 'info']}
        <span className="text-xs font-bold text-white font-ar">
          {toast.message}
        </span>
      </div>
    </div>
  );
});
