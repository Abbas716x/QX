import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Play, 
  Pause, 
  Zap, 
  CheckCircle2, 
  User, 
  DollarSign, 
  Percent 
} from 'lucide-react';

export const TableDetailModal = React.memo(function TableDetailModal({
  table,
  isOpen,
  categories,
  menu,
  onClose,
  calculateItemCost,
  calculateTableTotals,
  onAddItem,
  onToggleTimer,
  onUpdateCustomer,
  onUpdateDiscount,
  onRecordEarlyPayment,
  onRemoveItem,
  onCheckout,
  onDeleteTable
}) {
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [earlyPayItemIdx, setEarlyPayItemIdx] = useState(null);
  const [earlyPayAmount, setEarlyPayAmount] = useState('');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paidCashInput, setPaidCashInput] = useState('');

  if (!isOpen || !table) return null;

  const totals = calculateTableTotals(table);

  // Early Payment handler
  const openEarlyPay = (idx) => {
    setEarlyPayItemIdx(idx);
    const item = table.items[idx];
    const cost = calculateItemCost(item);
    const remaining = Math.max(0, cost - (Number(item.earlyPaid) || 0));
    setEarlyPayAmount(remaining);
  };

  const confirmEarlyPay = () => {
    if (earlyPayItemIdx !== null && Number(earlyPayAmount) > 0) {
      onRecordEarlyPayment(table.id, earlyPayItemIdx, Number(earlyPayAmount));
      setEarlyPayItemIdx(null);
      setEarlyPayAmount('');
    }
  };

  // Checkout modal handler
  const openCheckout = () => {
    setPaidCashInput(totals.finalRemaining);
    setShowCheckoutModal(true);
  };

  const confirmCheckout = () => {
    const paid = Number(paidCashInput) || 0;
    const debt = Math.max(0, totals.finalRemaining - paid);
    onCheckout(table.id, paid, debt);
    setShowCheckoutModal(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[500] bg-obsidian/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="glass-card max-w-5xl w-full max-h-[92vh] flex flex-col rounded-3xl border-t-4 border-violetApex shadow-2xl relative overflow-hidden animate-fadeIn">
        {/* Top Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violetApex to-cyanGlow flex items-center justify-center text-2xl font-black text-white">
              🎮
            </div>
            <div>
              <h2 className="text-2xl font-black text-white font-ar">{table.name}</h2>
              <span className="text-xs text-cyanGlow font-bold font-ar">
                الزبون: {table.customer || 'زبون عام'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Main Section: Items List */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-white font-ar">الطلبات والوقت</h3>
                <p className="text-xs text-gray-400 font-ar">
                  العدادات تحسب تدريجياً مع إمكانية الدفع المسبق لأي صنف
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveCategory(categories[0]?.id || null);
                  setShowItemPicker(true);
                }}
                className="glow-btn-primary px-4 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-1.5 shadow-lg shadow-violetApex/25 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة طلب / وقت من المنيو</span>
              </button>
            </div>

            {/* List */}
            {table.items.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-white/10 bg-panelDark/40">
                <span className="text-4xl block mb-2">📋</span>
                <p className="text-xs text-gray-400 font-ar">لا توجد طلبات بعد على هذه الطاولة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {table.items.map((item, idx) => {
                  const cost = calculateItemCost(item);
                  const earlyPaid = Number(item.earlyPaid) || 0;
                  const itemRem = Math.max(0, cost - earlyPaid);

                  return (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-2xl bg-panelDark/80 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.icon || '🥤'}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm font-ar">{item.name}</span>
                            {item.isTime && (
                              <button
                                onClick={() => onToggleTimer(table.id, idx)}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono flex items-center gap-1 border ${
                                  item.isRunning
                                    ? 'bg-emeraldGlow/15 border-emeraldGlow/30 text-emeraldGlow'
                                    : 'bg-amberWarn/15 border-amberWarn/30 text-amberWarn'
                                }`}
                              >
                                {item.isRunning ? (
                                  <>
                                    <Pause className="w-2.5 h-2.5" />
                                    <span>يعمل</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-2.5 h-2.5" />
                                    <span>مؤقت</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                            {item.isTime ? (
                              <span>السعر الأساسي: {item.price.toLocaleString()} د.ع</span>
                            ) : (
                              <span>العدد: {item.qty || 1} × {item.price.toLocaleString()} د.ع</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Item Cost & Action */}
                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/5 pt-2 sm:pt-0">
                        <div className="text-right">
                          <div className="text-base font-en font-black text-cyanGlow">
                            {cost.toLocaleString()} د.ع
                          </div>
                          {earlyPaid > 0 && (
                            <span className="text-[10px] text-emeraldGlow font-mono font-bold block">
                              تم تسديد: {earlyPaid.toLocaleString()} د.ع
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEarlyPay(idx)}
                            title="تسديد مبكر لهذا الصنف"
                            className="p-2 rounded-xl bg-emeraldGlow/10 hover:bg-emeraldGlow/25 text-emeraldGlow border border-emeraldGlow/25 transition-all text-xs font-bold"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRemoveItem(table.id, idx)}
                            title="حذف هذا الصنف"
                            className="p-2 rounded-xl bg-white/5 hover:bg-roseAlert/20 text-gray-400 hover:text-roseAlert transition-all border border-white/5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Section: Customer & Balance Summary */}
          <div className="lg:col-span-4 glass-card p-6 rounded-3xl border-t-4 border-cyanGlow flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white font-ar text-center">
                لوحة الحساب الإجمالي
              </h3>

              {/* Customer Name */}
              <div>
                <label className="text-xs text-gray-400 font-bold block mb-1 font-ar">
                  اسم العميل / الزبون:
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={table.customer || ''}
                    onChange={(e) => onUpdateCustomer(table.id, e.target.value)}
                    placeholder="مثال: أحمد (VIP)"
                    className="w-full bg-panelDark border border-white/10 rounded-xl pr-10 pl-3 py-2.5 text-xs font-bold text-white outline-none focus:border-cyanGlow"
                  />
                </div>
              </div>

              {/* Discount Input */}
              <div>
                <label className="text-xs text-gray-400 font-bold block mb-1 font-ar">
                  خصم مباشر (IQD):
                </label>
                <div className="relative">
                  <Percent className="w-3.5 h-3.5 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={table.discount || ''}
                    onChange={(e) => onUpdateDiscount(table.id, e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full bg-panelDark border border-white/10 rounded-xl pr-10 pl-3 py-2.5 text-xs font-mono font-bold text-white outline-none focus:border-cyanGlow"
                  />
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="bg-panelDark/90 p-4 rounded-2xl border border-white/5 space-y-2.5 text-xs font-ar">
                <div className="flex justify-between text-gray-400">
                  <span>إجمالي الحساب:</span>
                  <span className="font-en font-bold text-white">{totals.subtotal.toLocaleString()} د.ع</span>
                </div>
                <div className="flex justify-between text-emeraldGlow">
                  <span>المدفوع مسبقاً (مبكر):</span>
                  <span className="font-en font-bold">-{totals.earlyPaid.toLocaleString()} د.ع</span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-roseAlert">
                    <span>الخصم المباشر:</span>
                    <span className="font-en font-bold">-{totals.discount.toLocaleString()} د.ع</span>
                  </div>
                )}
                <div className="h-px bg-white/10 my-1"></div>
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-white text-sm">المتبقي للدفع:</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-en font-black text-cyanGlow">
                      {totals.finalRemaining.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">د.ع</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                onClick={openCheckout}
                className="w-full py-3.5 glow-btn-primary rounded-xl font-black text-white text-sm flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-violetApex/25"
              >
                <CheckCircle2 className="w-4 h-4" />
                إغلاق الحساب / تحويل دين
              </button>

              <button
                onClick={() => {
                  if (confirm(`هل أنت متأكد من حذف ${table.name} بالكامل؟`)) {
                    onDeleteTable(table.id);
                    onClose();
                  }
                }}
                className="w-full py-2.5 rounded-xl text-gray-500 hover:text-roseAlert hover:bg-roseAlert/10 text-xs font-bold transition-all text-center"
              >
                إلغاء الطاولة وحذفها
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-MODAL 1: Product / Category Picker */}
      {showItemPicker && (
        <div className="fixed inset-0 z-[600] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 rounded-3xl border-t-4 border-cyanGlow flex flex-col max-h-[80vh] animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-white font-ar">إضافة صنف أو عداد وقت</h3>
              <button
                onClick={() => setShowItemPicker(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                    activeCategory === cat.id
                      ? 'bg-cyanGlow text-black shadow-lg shadow-cyanGlow/25'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            {/* Menu items grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto flex-1 p-1">
              {menu
                .filter((m) => !activeCategory || m.catId === activeCategory)
                .map((mItem) => (
                  <button
                    key={mItem.id}
                    onClick={() => {
                      onAddItem(table.id, mItem);
                      setShowItemPicker(false);
                    }}
                    className="p-4 rounded-2xl bg-panelDark/80 border border-white/5 hover:border-cyanGlow/50 hover:bg-white/5 transition-all text-right flex flex-col justify-between group active:scale-95"
                  >
                    <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                      {mItem.icon || '🥤'}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white font-ar line-clamp-1">
                        {mItem.name}
                      </div>
                      <div className="text-xs font-mono font-black text-cyanGlow mt-1">
                        {mItem.price.toLocaleString()} د.ع
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: Early Pay Modal */}
      {earlyPayItemIdx !== null && (
        <div className="fixed inset-0 z-[650] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border-t-4 border-emeraldGlow space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white font-ar flex items-center gap-2">
                <Zap className="w-4 h-4 text-emeraldGlow" />
                تسديد دفعة مبكرة
              </h3>
              <button
                onClick={() => setEarlyPayItemIdx(null)}
                className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-400 font-ar">
              أدخل المبلغ المستلم نقدًا الآن لإضافته إلى كاش اليوم وخصمه من الحساب
            </p>

            <div>
              <label className="text-xs text-gray-300 font-bold block mb-1 font-ar">المبلغ (IQD):</label>
              <input
                type="number"
                value={earlyPayAmount}
                onChange={(e) => setEarlyPayAmount(e.target.value)}
                className="w-full bg-panelDark border border-white/10 rounded-xl p-3 text-base font-mono font-black text-emeraldGlow outline-none focus:border-emeraldGlow"
                min="0"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEarlyPayItemIdx(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-bold text-gray-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={confirmEarlyPay}
                className="flex-1 py-3 rounded-xl bg-emeraldGlow hover:bg-emeraldGlow/90 text-xs font-black text-black transition-all shadow-lg shadow-emeraldGlow/25"
              >
                تأكيد واستلام المبلغ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: Checkout Modal (Cash vs Debt Split) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[650] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border-t-4 border-emeraldGlow space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white font-ar flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emeraldGlow" />
                إغلاق الحساب النهائي
              </h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-panelDark/80 p-3.5 rounded-2xl border border-white/5 flex justify-between items-center text-xs font-ar">
              <span className="text-gray-400">المبلغ المطلوب للدفع:</span>
              <span className="font-en font-black text-cyanGlow text-sm">
                {totals.finalRemaining.toLocaleString()} د.ع
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1 font-ar">
                  المدفوع كاش الآن (IQD):
                </label>
                <input
                  type="number"
                  value={paidCashInput}
                  onChange={(e) => setPaidCashInput(e.target.value)}
                  className="w-full bg-panelDark border border-white/10 rounded-xl p-3 text-sm font-mono font-bold text-white outline-none focus:border-emeraldGlow"
                />
              </div>

              <div>
                <label className="text-xs text-roseAlert font-bold block mb-1 font-ar">
                  المتبقي (تحويل إلى دين في سجل الزبون):
                </label>
                <input
                  type="text"
                  readOnly
                  value={`${Math.max(0, totals.finalRemaining - (Number(paidCashInput) || 0)).toLocaleString()} د.ع`}
                  className="w-full bg-panelDark/50 border border-roseAlert/30 rounded-xl p-3 text-sm font-mono font-bold text-roseAlert outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-bold text-gray-400 hover:text-white"
              >
                تراجع
              </button>
              <button
                onClick={confirmCheckout}
                className="flex-1 py-3 rounded-xl glow-btn-primary text-xs font-black text-white shadow-lg shadow-violetApex/25"
              >
                تأكيد العملية والأرشفة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
