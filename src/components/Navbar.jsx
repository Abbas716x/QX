import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Plus, 
  LogOut, 
  Shield, 
  LayoutDashboard, 
  Gamepad2, 
  BookOpen, 
  Receipt, 
  Coffee 
} from 'lucide-react';

export const Navbar = React.memo(function Navbar({
  tenant,
  activeView,
  onSwitchView,
  syncStatus,
  onManualSync,
  onOpenAddTable,
  onLogoutShop,
  onOpenSuperAdmin
}) {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-GB'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'tables', label: 'الطاولات', icon: Gamepad2 },
    { id: 'debts', label: 'الديون', icon: BookOpen },
    { id: 'invoices', label: 'الفواتير', icon: Receipt },
    { id: 'menu', label: 'المنيو', icon: Coffee }
  ];

  return (
    <header className="p-4 md:px-8 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-xl sticky top-0 z-40">
      {/* Brand & Active Tenant Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violetApex to-cyanGlow flex items-center justify-center font-en font-black text-white text-xl shadow-lg shadow-violetApex/30">
            Q
          </div>
          <div>
            <h1 className="text-lg font-black font-en tracking-wide flex items-center">
              716QX<span className="text-violetApex">.</span>
            </h1>
            <span className="text-[10px] text-cyanGlow font-en font-bold tracking-widest uppercase">
              SaaS v4.0
            </span>
          </div>
        </div>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-panelDark/80 border border-white/5 font-mono text-xs text-gray-300">
          <span className="w-2 h-2 rounded-full bg-emeraldGlow animate-ping"></span>
          <span>{currentTime}</span>
        </div>

        {/* Active Shop Badge */}
        {tenant && (
          <div className="hidden sm:flex flex-col border-r border-white/10 pr-4">
            <span className="text-xs font-black text-white truncate max-w-[150px]">
              {tenant.name}
            </span>
            <span className="text-[10px] text-cyanGlow font-mono">
              ID: {tenant.id}
            </span>
          </div>
        )}
      </div>

      {/* Center Navigation Links */}
      <nav className="hidden md:flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSwitchView(item.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-violetApex text-white shadow-lg shadow-violetApex/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Cloud Sync Status Indicator */}
        <button
          onClick={onManualSync}
          title="حالة المزامنة السحابية (اضغط للمزامنة اليدوية)"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 transition-all active:scale-95"
        >
          {syncStatus === 'saving' || syncStatus === 'syncing' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-cyanGlow animate-spin" />
              <span className="hidden sm:inline text-cyanGlow text-[11px]">مزامنة...</span>
            </>
          ) : syncStatus === 'error' ? (
            <>
              <CloudOff className="w-3.5 h-3.5 text-roseAlert" />
              <span className="hidden sm:inline text-roseAlert text-[11px]">غير متصل</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emeraldGlow shadow-[0_0_8px_rgba(34,197,94,0.7)]"></span>
              <span className="hidden sm:inline text-emeraldGlow text-[11px]">سحابي متصل</span>
            </>
          )}
        </button>

        {/* Super Admin Access */}
        <button
          onClick={onOpenSuperAdmin}
          title="لوحة تحكم الأدمن المركزي"
          className="p-2.5 rounded-xl bg-violetApex/15 hover:bg-violetApex text-violetApex hover:text-white transition-all border border-violetApex/30 active:scale-95"
        >
          <Shield className="w-4 h-4" />
        </button>

        {/* Switch Shop / Logout */}
        <button
          onClick={onLogoutShop}
          title="تبديل الصالة أو تسجيل الخروج"
          className="p-2.5 rounded-xl bg-white/5 hover:bg-roseAlert/20 text-gray-400 hover:text-roseAlert transition-all border border-white/5 active:scale-95"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* Add Table Button */}
        <button
          onClick={onOpenAddTable}
          className="glow-btn-primary px-4 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 shadow-lg shadow-violetApex/25 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">طاولة جديدة</span>
        </button>
      </div>
    </header>
  );
});
