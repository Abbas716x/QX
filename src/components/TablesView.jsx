import React, { useState, useMemo } from 'react';
import { Search, Plus, Clock, User, AlertCircle, Play, Pause } from 'lucide-react';

export const TablesView = React.memo(function TablesView({
  tables,
  calculateTableTotals,
  calculateItemCost,
  onSelectTable,
  onOpenAddTable
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const tableList = useMemo(() => {
    const list = Object.values(tables || {});
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.customer && t.customer.toLowerCase().includes(q))
    );
  }, [tables, searchQuery]);

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white font-ar">
            خريطة الطاولات المباشرة
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mt-1 font-ar">
            مراقبة العدادات والجلسات الحية مع حساب تدريجي فوري بالتقريب الذكي 250 د.ع
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث برقم الطاولة أو اسم الزبون..."
              className="w-full bg-panelDark/80 border border-white/10 rounded-2xl pr-11 pl-4 py-3 outline-none focus:border-violetApex transition-all text-xs font-bold text-white placeholder-gray-500"
            />
          </div>

          <button
            onClick={onOpenAddTable}
            className="glow-btn-primary px-5 py-3 rounded-2xl font-bold text-xs text-white flex items-center gap-2 shrink-0 active:scale-95 shadow-lg shadow-violetApex/25"
          >
            <Plus className="w-4 h-4" />
            <span>طاولة جديدة</span>
          </button>
        </div>
      </div>

      {/* Grid of Tables */}
      {tableList.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-white/5 text-center space-y-4">
          <div className="text-5xl">🎮</div>
          <h3 className="text-lg font-bold text-white font-ar">لا توجد طاولات مفتوحة حالياً</h3>
          <p className="text-xs text-gray-400 font-ar">اضغط على زر (طاولة جديدة) للبدء</p>
          <button
            onClick={onOpenAddTable}
            className="glow-btn-primary px-6 py-3 rounded-xl font-bold text-xs text-white inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            فتح طاولة جديدة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tableList.map((tbl) => {
            const totals = calculateTableTotals(tbl);
            const items = tbl.items || [];
            const timedItems = items.filter((i) => i.isTime);

            // Check if any timer is expired or expiring
            let isExpired = false;
            let isWarning = false;

            timedItems.forEach((tItem) => {
              if (tItem.timerMode === 'countdown') {
                const now = Date.now();
                let elapsed = tItem.elapsedSeconds || 0;
                if (tItem.isRunning && tItem.startTime) {
                  elapsed += Math.floor((now - tItem.startTime) / 1000);
                }
                const remaining = (tItem.durationSeconds || 1800) - elapsed;
                if (remaining <= 0) isExpired = true;
                else if (remaining <= 300) isWarning = true;
              }
            });

            const cardBorder = isExpired
              ? 'border-roseAlert shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse'
              : isWarning
              ? 'border-amberWarn shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'border-white/10 hover:border-violetApex/40';

            return (
              <div
                key={tbl.id}
                onClick={() => onSelectTable(tbl.id)}
                className={`glass-card p-6 rounded-3xl border ${cardBorder} cursor-pointer transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between group relative overflow-hidden`}
              >
                {/* Header */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-lg font-black text-white group-hover:text-cyanGlow transition-colors font-ar">
                      {tbl.name}
                    </span>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-white/5 border border-white/10 text-cyanGlow flex items-center gap-1 font-ar">
                      <User className="w-3 h-3" />
                      {tbl.customer || 'زبون عام'}
                    </span>
                  </div>

                  {/* Timers status summary */}
                  <div className="space-y-2 mb-4">
                    {timedItems.length === 0 ? (
                      <div className="text-[11px] text-gray-500 font-ar">لا توجد عدادات وقت نشطة</div>
                    ) : (
                      timedItems.map((tItem, idx) => {
                        const now = Date.now();
                        let elapsed = tItem.elapsedSeconds || 0;
                        if (tItem.isRunning && tItem.startTime) {
                          elapsed += Math.floor((now - tItem.startTime) / 1000);
                        }

                        if (tItem.timerMode === 'countdown') {
                          const totalDur = tItem.durationSeconds || 1800;
                          const rem = Math.max(0, totalDur - elapsed);
                          const remMin = Math.floor(rem / 60);
                          const remSec = rem % 60;
                          const isEnd = rem === 0;

                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-xl border flex items-center justify-between text-xs font-mono font-bold ${
                                isEnd
                                  ? 'bg-roseAlert/15 border-roseAlert/30 text-roseAlert animate-pulse'
                                  : rem <= 300
                                  ? 'bg-amberWarn/15 border-amberWarn/30 text-amberWarn'
                                  : 'bg-panelDark/80 border-white/5 text-cyanGlow'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-ar text-[11px]">
                                <span>{tItem.icon || '⏱'}</span>
                                <span className="truncate max-w-[100px]">{tItem.name}</span>
                              </div>
                              <span dir="ltr">
                                {isEnd ? 'منتهي! 🔔' : `${remMin}:${remSec < 10 ? '0' : ''}${remSec}`}
                              </span>
                            </div>
                          );
                        } else {
                          // Open timer
                          const hrs = Math.floor(elapsed / 3600);
                          const mins = Math.floor((elapsed % 3600) / 60);
                          const secs = elapsed % 60;

                          return (
                            <div
                              key={idx}
                              className="p-2 rounded-xl bg-violetApex/10 border border-violetApex/20 flex items-center justify-between text-xs font-mono font-bold text-violetApex"
                            >
                              <div className="flex items-center gap-1.5 font-ar text-[11px]">
                                <span>{tItem.icon || '🎮'}</span>
                                <span className="truncate max-w-[100px]">{tItem.name}</span>
                              </div>
                              <span dir="ltr">
                                {hrs > 0 ? `${hrs}:` : ''}{mins}:{secs < 10 ? '0' : ''}${secs}
                              </span>
                            </div>
                          );
                        }
                      })
                    )}
                  </div>

                  {/* Items count badge */}
                  <div className="text-[11px] text-gray-400 font-ar mb-4 flex items-center justify-between">
                    <span>عدد الطلبات:</span>
                    <span className="font-en font-bold text-white bg-white/5 px-2 py-0.5 rounded-lg">
                      {items.length}
                    </span>
                  </div>
                </div>

                {/* Footer with Balance */}
                <div className="pt-3 border-t border-white/5 flex items-baseline justify-between">
                  <span className="text-xs text-gray-400 font-ar font-bold">المتبقي للدفع:</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-en font-black text-cyanGlow">
                      {Number(totals.finalRemaining).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">د.ع</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
