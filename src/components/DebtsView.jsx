import React, { useState, useMemo } from 'react';
import { Search, User, CreditCard, FileText, Printer, X, Plus, Check } from 'lucide-react';

export const DebtsView = React.memo(function DebtsView({
  debts,
  invoices,
  onAdjustDebt
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'adjust' | 'statement'

  // Adjustment state
  const [adjustAction, setAdjustAction] = useState('payment'); // 'payment' | 'add' | 'set'
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustNote, setAdjustNote] = useState('');

  const debtList = useMemo(() => {
    const list = Object.values(debts || {});
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((d) => d.customer.toLowerCase().includes(q));
  }, [debts, searchQuery]);

  const openAdjust = (customerRecord) => {
    setSelectedCustomer(customerRecord);
    setAdjustAction('payment');
    setAdjustAmount('');
    setAdjustNote('');
    setModalMode('adjust');
  };

  const openStatement = (customerRecord) => {
    setSelectedCustomer(customerRecord);
    setModalMode('statement');
  };

  const handleConfirmAdjust = () => {
    if (!selectedCustomer || !Number(adjustAmount)) return;
    onAdjustDebt(selectedCustomer.customer, adjustAction, Number(adjustAmount), adjustNote);
    setModalMode(null);
  };

  // Filter invoices for statement
  const customerInvoices = useMemo(() => {
    if (!selectedCustomer) return [];
    return (invoices || []).filter(
      (inv) => (inv.customer || '').trim().toLowerCase() === selectedCustomer.customer.trim().toLowerCase()
    );
  }, [selectedCustomer, invoices]);

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white font-ar">
            سجل الديون والحسابات الآجلة
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mt-1 font-ar">
            متابعة ديون الزبائن وتسديد الدفعات وطباعة كشوفات الحسابات الرسمية
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الزبون المدين..."
            className="w-full bg-panelDark/80 border border-white/10 rounded-2xl pr-11 pl-4 py-3 outline-none focus:border-roseAlert transition-all text-xs font-bold text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* Grid of Debt Cards */}
      {debtList.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-white/5 text-center space-y-3">
          <div className="text-5xl">📒</div>
          <h3 className="text-base font-bold text-white font-ar">سجل الديون نظيف تماماً</h3>
          <p className="text-xs text-gray-400 font-ar">لا توجد أي ذمم أو ديون معلقة على الزبائن حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {debtList.map((d) => (
            <div
              key={d.customer}
              className="glass-card p-6 rounded-3xl border border-white/10 hover:border-roseAlert/40 transition-all space-y-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-roseAlert/10 text-roseAlert flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-white font-ar">{d.customer}</h4>
                      <span className="text-[10px] text-gray-400 font-mono">حساب زبون</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border ${
                    d.totalDebt > 0 
                      ? 'bg-roseAlert/15 border-roseAlert/30 text-roseAlert' 
                      : 'bg-emeraldGlow/15 border-emeraldGlow/30 text-emeraldGlow'
                  }`}>
                    {d.totalDebt > 0 ? 'مطلوب دين' : 'مسدد بالكامل'}
                  </span>
                </div>

                <div className="bg-panelDark/90 p-4 rounded-2xl border border-white/5 flex justify-between items-baseline">
                  <span className="text-xs text-gray-400 font-ar font-bold">الرصيد المتبقي:</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-en font-black text-roseAlert">
                      {Number(d.totalDebt || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">د.ع</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => openAdjust(d)}
                  className="py-2.5 rounded-xl bg-white/5 hover:bg-emeraldGlow/20 text-emeraldGlow hover:text-white border border-white/5 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  تسديد / تعديل
                </button>
                <button
                  onClick={() => openStatement(d)}
                  className="py-2.5 rounded-xl bg-white/5 hover:bg-cyanGlow/20 text-cyanGlow hover:text-white border border-white/5 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  كشف حساب
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADJUST DEBT MODAL */}
      {modalMode === 'adjust' && selectedCustomer && (
        <div className="fixed inset-0 z-[600] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 sm:p-8 rounded-3xl border-t-4 border-cyanGlow space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-cyanGlow" />
                <div>
                  <h3 className="text-base font-black text-white font-ar">تعديل حساب الزبون والدفعات</h3>
                  <span className="text-xs text-cyanGlow font-bold">{selectedCustomer.customer}</span>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Balance */}
            <div className="bg-panelDark/90 p-3.5 rounded-2xl border border-white/5 flex justify-between items-center text-xs font-ar">
              <span className="text-gray-400">إجمالي الدين الحالي:</span>
              <span className="text-lg font-en font-black text-roseAlert">
                {Number(selectedCustomer.totalDebt || 0).toLocaleString()} د.ع
              </span>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 text-xs font-bold font-ar">
              <button
                type="button"
                onClick={() => setAdjustAction('payment')}
                className={`py-2 rounded-lg transition-all ${
                  adjustAction === 'payment'
                    ? 'bg-emeraldGlow/20 text-emeraldGlow border border-emeraldGlow/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                تسديد دفعة
              </button>
              <button
                type="button"
                onClick={() => setAdjustAction('add')}
                className={`py-2 rounded-lg transition-all ${
                  adjustAction === 'add'
                    ? 'bg-roseAlert/20 text-roseAlert border border-roseAlert/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                إضافة دين
              </button>
              <button
                type="button"
                onClick={() => setAdjustAction('set')}
                className={`py-2 rounded-lg transition-all ${
                  adjustAction === 'set'
                    ? 'bg-cyanGlow/20 text-cyanGlow border border-cyanGlow/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                تعديل الرصيد
              </button>
            </div>

            {/* Amount input & Quick Chips */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1 font-ar">المبلغ (IQD):</label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="مثال: 5000"
                  className="w-full bg-panelDark border border-white/10 rounded-xl p-3 text-base font-mono font-black text-white outline-none focus:border-cyanGlow"
                />
              </div>

              {/* Quick Chips */}
              <div className="flex gap-1.5 flex-wrap">
                {[1000, 2000, 5000, 10000].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setAdjustAmount(chip)}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-mono font-bold"
                  >
                    +{chip.toLocaleString()}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setAdjustAmount(selectedCustomer.totalDebt || 0)}
                  className="px-2.5 py-1 rounded-lg bg-emeraldGlow/15 text-emeraldGlow text-[11px] font-bold font-ar"
                >
                  تسديد كامل الدين
                </button>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-bold block mb-1 font-ar">ملاحظة (اختياري):</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="مثال: دفعة يدوية نقدية"
                  className="w-full bg-panelDark border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-cyanGlow font-ar"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setModalMode(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-bold text-gray-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmAdjust}
                className="flex-1 py-3 rounded-xl glow-btn-emerald text-xs font-black text-white shadow-lg shadow-emeraldGlow/25"
              >
                تأكيد العملية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER STATEMENT MODAL */}
      {modalMode === 'statement' && selectedCustomer && (
        <div className="fixed inset-0 z-[600] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-3xl w-full max-h-[88vh] flex flex-col p-6 sm:p-8 rounded-3xl border-t-4 border-violetApex space-y-5 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-violetApex" />
                <div>
                  <h3 className="text-lg font-black text-white font-ar">
                    كشف حساب الزبون: {selectedCustomer.customer}
                  </h3>
                  <p className="text-xs text-gray-400 font-ar">
                    سجل كامل لكافة الحركات والفواتير والدفعات السابقة
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="w-8 h-8 rounded-lg bg-white/5 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Balance Bar */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-panelDark/80 border border-white/5">
                <span className="text-xs text-gray-400 font-ar block mb-1">الرصيد المتبقي (مطلوب دين):</span>
                <span className="text-xl font-en font-black text-roseAlert">
                  {Number(selectedCustomer.totalDebt || 0).toLocaleString()} د.ع
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-panelDark/80 border border-white/5">
                <span className="text-xs text-gray-400 font-ar block mb-1">عدد الفواتير المنفذة:</span>
                <span className="text-xl font-en font-black text-cyanGlow">
                  {customerInvoices.length} فاتورة
                </span>
              </div>
            </div>

            {/* Scrollable Movements */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <h4 className="text-xs font-bold text-gray-300 font-ar">سجل الحركات والدفعات:</h4>
              <div className="rounded-2xl border border-white/5 bg-panelDark/60 overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-black/40 text-gray-400 font-bold border-b border-white/5">
                    <tr>
                      <th className="p-3">التاريخ والوقت</th>
                      <th className="p-3">نوع الحركة</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3">الملاحظة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-ar">
                    {(selectedCustomer.history || []).length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-6 text-gray-500">لا توجد حركات مسجلة</td>
                      </tr>
                    ) : (
                      selectedCustomer.history.map((h, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="p-3 text-gray-400 font-mono text-[11px]">{h.date}</td>
                          <td className="p-3 font-bold text-white">{h.action}</td>
                          <td className="p-3 font-en font-bold text-cyanGlow">
                            {Number(h.amount || 0).toLocaleString()} د.ع
                          </td>
                          <td className="p-3 text-gray-400 text-[11px]">{h.note || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-3 border-t border-white/10">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyanGlow font-bold text-xs flex items-center gap-2 border border-cyanGlow/25"
              >
                <Printer className="w-4 h-4" />
                طباعة الكشف
              </button>
              <button
                onClick={() => setModalMode(null)}
                className="px-6 py-2.5 rounded-xl glow-btn-primary font-bold text-xs text-white"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
