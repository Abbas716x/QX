import React from 'react';
import { 
  TrendingUp, 
  History, 
  CalendarDays, 
  Gamepad2, 
  RotateCcw, 
  BookOpen, 
  Coffee 
} from 'lucide-react';

export const DashboardView = React.memo(function DashboardView({
  stats,
  activeSessionsCount,
  onResetDaily,
  onResetMonthly,
  onNavigate
}) {
  return (
    <div className="p-6 md:p-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white font-ar">
            مركز التحكم المالي والسحابي
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mt-1 font-ar">
            المبيعات اليومية مستمرة وتتحدث فورياً في السحابة مع إمكانية الترحيل اليدوي للشهر
          </p>
        </div>

        {/* Rollover Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onResetDaily}
            className="px-4 py-2.5 rounded-xl bg-emeraldGlow/10 hover:bg-emeraldGlow/20 text-emeraldGlow border border-emeraldGlow/20 text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            تصفير اليوم وترحيل للشهر
          </button>
          <button
            onClick={onResetMonthly}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-amberWarn/20 text-gray-300 hover:text-amberWarn border border-white/10 text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            تصفير الشهر
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Daily Sales */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden border-t-2 border-emeraldGlow group">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-gray-400 font-bold font-ar">مبيعات اليوم الحالية</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emeraldGlow animate-ping"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-en font-black text-white tracking-tight">
              {Number(stats?.daily || 0).toLocaleString()}
            </h3>
            <span className="text-xs text-emeraldGlow font-bold">د.ع</span>
          </div>
          <span className="text-[10px] text-gray-500 font-bold mt-2 block font-ar">
            مستمرة حتى تضغط تصفير اليوم
          </span>
        </div>

        {/* Yesterday Sales */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden border-t-2 border-cyanGlow">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-gray-400 font-bold font-ar">مبيعات الأمس</span>
            <History className="w-4 h-4 text-cyanGlow" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-en font-black text-cyanGlow tracking-tight">
              {Number(stats?.yesterday || 0).toLocaleString()}
            </h3>
            <span className="text-xs text-cyanGlow font-bold">د.ع</span>
          </div>
          <span className="text-[10px] text-gray-500 font-bold mt-2 block font-ar">
            إجمالي اليوم السابق بعد الترحيل
          </span>
        </div>

        {/* Cumulative Monthly */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden border-t-2 border-amberWarn">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-gray-400 font-bold font-ar">الإيراد الشهري التراكمي</span>
            <CalendarDays className="w-4 h-4 text-amberWarn" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-en font-black text-amberWarn tracking-tight">
              {Number(stats?.monthly || 0).toLocaleString()}
            </h3>
            <span className="text-xs text-amberWarn font-bold">د.ع</span>
          </div>
          <span className="text-[10px] text-gray-500 font-bold mt-2 block font-ar">
            مجموع المبيعات المرحلة شهرياً
          </span>
        </div>

        {/* Active Sessions */}
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden border-t-2 border-violetApex">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-gray-400 font-bold font-ar">الجلسات المفتوحة</span>
            <Gamepad2 className="w-4 h-4 text-violetApex" />
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-en font-black text-violetApex tracking-tight">
              {activeSessionsCount}
            </h3>
            <span className="text-xs text-gray-400 font-bold font-ar">طاولة نشطة</span>
          </div>
          <span className="text-[10px] text-violetApex font-bold mt-2 block font-ar">
            العدادات والمحطات قيد التشغيل
          </span>
        </div>
      </div>

      {/* Quick Shortcuts */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white font-ar">
          اختصارات الوصول السريع
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            onClick={() => onNavigate('tables')}
            className="glass-card p-6 rounded-3xl cursor-pointer hover:border-violetApex/40 flex items-center gap-5 group transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-violetApex/10 text-violetApex flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🎮
            </div>
            <div>
              <h4 className="font-bold text-white text-base group-hover:text-violetApex transition-colors font-ar">
                خريطة الطاولات
              </h4>
              <p className="text-gray-400 text-xs mt-0.5 font-ar">
                متابعة العدادات والجلسات المباشرة
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('debts')}
            className="glass-card p-6 rounded-3xl cursor-pointer hover:border-roseAlert/40 flex items-center gap-5 group transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-roseAlert/10 text-roseAlert flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📒
            </div>
            <div>
              <h4 className="font-bold text-white text-base group-hover:text-roseAlert transition-colors font-ar">
                دفتر الديون
              </h4>
              <p className="text-gray-400 text-xs mt-0.5 font-ar">
                متابعة حسابات الزبائن وتسديد الآجل
              </p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('menu')}
            className="glass-card p-6 rounded-3xl cursor-pointer hover:border-cyanGlow/40 flex items-center gap-5 group transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-cyanGlow/10 text-cyanGlow flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📋
            </div>
            <div>
              <h4 className="font-bold text-white text-base group-hover:text-cyanGlow transition-colors font-ar">
                إدارة الأقسام والمنيو
              </h4>
              <p className="text-gray-400 text-xs mt-0.5 font-ar">
                تعديل عدادات البلي، المشروبات والأسعار
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
