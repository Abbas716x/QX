import React from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export const AntiDevToolsOverlay = React.memo(function AntiDevToolsOverlay({ isOpen, reason, onDismiss }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] bg-obsidian/98 backdrop-blur-3xl flex items-center justify-center p-4 selection:bg-none">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl border-t-4 border-roseAlert shadow-[0_0_50px_rgba(244,63,94,0.4)] text-center space-y-6 animate-pulse">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-roseAlert/15 border border-roseAlert/40 flex items-center justify-center text-roseAlert shadow-lg shadow-roseAlert/30">
          <ShieldAlert className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-roseAlert font-ar">
            انتهاك أمني مكتشف
          </h2>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-roseAlert/20 text-roseAlert border border-roseAlert/30">
            {reason || "محاولة فحص غير مصرح بها"}
          </span>
          <p className="text-gray-300 text-xs leading-relaxed font-ar">
            تم رصد محاولة لفتح أدوات المطورين أو فحص الشيفرة المصدرية. 
            تم تجميد الجلسة فوراً لحماية أمن بيانات النظام السحابي وتوثيق الحادثة في سجل الرقابة المركزي.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 border border-white/10 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة تحميل التطبيق بأمان
          </button>
        </div>

        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
          716QX Military-Grade Security Layer Active
        </p>
      </div>
    </div>
  );
});
