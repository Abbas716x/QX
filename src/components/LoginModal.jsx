import React, { useState } from 'react';
import { Store, KeyRound, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { authenticateShop } from '../lib/db/turso';
import { setUserRole, ROLES } from '../utils/security/rbac';

export const LoginModal = React.memo(function LoginModal({ isOpen, onLoginSuccess }) {
  const [shopId, setShopId] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!shopId.trim() || !passcode.trim()) {
      setErrorMessage('يرجى إدخال معرّف الصالة ورمز الدخول');
      return;
    }

    setLoading(true);
    try {
      const session = await authenticateShop(shopId, passcode);
      setUserRole(ROLES.CASHIER);
      onLoginSuccess(session);
    } catch (err) {
      setErrorMessage(err.message || 'فشل التحقق من الصالة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[800] bg-obsidian/95 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="glass-card max-w-md w-full p-8 rounded-3xl border-t-4 border-cyanGlow shadow-2xl space-y-6 animate-fadeIn">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-cyanGlow to-violetApex flex items-center justify-center text-white shadow-xl shadow-cyanGlow/25">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white font-ar">
            دخول الصالة السحابية
          </h2>
          <p className="text-xs text-gray-400 font-ar">
            أدخل معرّف الصالة ورمز المرور السري للمزامنة السحابية الحية (Zero-Trust)
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-roseAlert/15 border border-roseAlert/30 text-roseAlert text-xs font-bold text-center font-ar">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-300 font-bold block mb-1.5 font-ar">
              معرّف الصالة (Shop ID):
            </label>
            <div className="relative">
              <input
                type="text"
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                placeholder="مثال: baghdad-lounge"
                className="w-full bg-panelDark border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyanGlow text-sm font-mono text-white text-left font-bold"
                dir="ltr"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-300 font-bold block mb-1.5 font-ar">
              رمز المرور السري (Passcode / PIN):
            </label>
            <div className="relative">
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••"
                className="w-full bg-panelDark border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-cyanGlow text-base font-mono text-center tracking-widest text-white font-bold"
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 glow-btn-cyan rounded-xl font-black text-black text-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري التحقق والمزامنة السحابية...
              </>
            ) : (
              <>
                تسجيل الدخول والبدء
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 font-bold font-ar">
          <ShieldCheck className="w-3.5 h-3.5 text-emeraldGlow" />
          <span>قاعدة بيانات مشفرة ومعزولة لكل صالة (Tenant Isolation)</span>
        </div>
      </div>
    </div>
  );
});
