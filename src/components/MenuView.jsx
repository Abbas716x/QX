import React, { useState } from 'react';
import { Plus, Trash2, FolderPlus, Tag, Clock, DollarSign, X } from 'lucide-react';

export const MenuView = React.memo(function MenuView({
  categories,
  setCategories,
  menu,
  setMenu
}) {
  const [selectedCat, setSelectedCat] = useState(categories[0]?.id || null);
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [showAddProdModal, setShowAddProdModal] = useState(false);

  // New category form
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('🎮');

  // New product form
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdIcon, setNewProdIcon] = useState('☕');
  const [newProdType, setNewProdType] = useState('direct'); // 'direct' | 'countdown' | 'open'
  const [newProdDurationMin, setNewProdDurationMin] = useState('30');

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      icon: newCatIcon.trim() || '📁'
    };
    setCategories((prev) => [...prev, newCat]);
    setSelectedCat(newCat.id);
    setNewCatName('');
    setShowAddCatModal(false);
  };

  const handleAddProduct = () => {
    if (!newProdName.trim() || !Number(newProdPrice)) return;
    const isTime = newProdType !== 'direct';

    const newItem = {
      id: `m_${Date.now()}`,
      catId: selectedCat || categories[0]?.id,
      name: newProdName.trim(),
      price: Number(newProdPrice),
      icon: newProdIcon.trim() || (isTime ? '⏱' : '☕'),
      isTime,
      timerMode: isTime ? newProdType : undefined,
      durationSeconds: isTime && newProdType === 'countdown' ? (Number(newProdDurationMin) || 30) * 60 : undefined
    };

    setMenu((prev) => [...prev, newItem]);
    setNewProdName('');
    setNewProdPrice('');
    setShowAddProdModal(false);
  };

  const handleDeleteProduct = (prodId) => {
    if (confirm('هل أنت متأكد من حذف هذا الصنف من المنيو؟')) {
      setMenu((prev) => prev.filter((p) => p.id !== prodId));
    }
  };

  const activeCategoryItems = menu.filter((m) => !selectedCat || m.catId === selectedCat);

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-white font-ar">
            إدارة الأقسام والمنيو
          </h2>
          <p className="text-gray-400 text-xs md:text-sm mt-1 font-ar">
            تحديد الأصناف بالوقت التنازلي، الوقت المفتوح، أو الطلبات المباشرة
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddCatModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 flex items-center gap-2 transition-all active:scale-95"
          >
            <FolderPlus className="w-4 h-4 text-cyanGlow" />
            <span>+ قسم جديد</span>
          </button>
          <button
            onClick={() => setShowAddProdModal(true)}
            className="glow-btn-primary px-5 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 active:scale-95 shadow-lg shadow-violetApex/25"
          >
            <Plus className="w-4 h-4" />
            <span>+ صنف جديد</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-5 py-3 rounded-2xl text-xs font-bold shrink-0 flex items-center gap-2 transition-all ${
              selectedCat === cat.id
                ? 'bg-violetApex text-white shadow-lg shadow-violetApex/30'
                : 'bg-panelDark/80 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            <span className="text-base">{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {activeCategoryItems.map((prod) => (
          <div
            key={prod.id}
            className="glass-card p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex justify-between items-center group"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">
                {prod.icon || '🥤'}
              </span>
              <div>
                <h4 className="text-sm font-bold text-white font-ar line-clamp-1">{prod.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono font-black text-cyanGlow">
                    {prod.price.toLocaleString()} د.ع
                  </span>
                  {prod.isTime && (
                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-violetApex/20 text-violetApex border border-violetApex/30">
                      {prod.timerMode === 'open' ? 'ساعة مفتوحة' : 'تنازلي'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDeleteProduct(prod.id)}
              className="p-2 rounded-xl bg-white/5 hover:bg-roseAlert/20 text-gray-400 hover:text-roseAlert transition-all border border-white/5"
              title="حذف الصنف"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ADD CATEGORY MODAL */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-[600] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border-t-4 border-cyanGlow space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white font-ar">إضافة قسم جديد</h3>
              <button
                onClick={() => setShowAddCatModal(false)}
                className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1 font-ar">اسم القسم:</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="مثال: قسم البليارد أو المأكولات"
                  className="w-full bg-panelDark border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-cyanGlow"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1 font-ar">أيقونة القسم (Emoji):</label>
                <input
                  type="text"
                  value={newCatIcon}
                  onChange={(e) => setNewCatIcon(e.target.value)}
                  placeholder="🎮"
                  className="w-full bg-panelDark border border-white/10 rounded-xl p-3 text-base text-center outline-none focus:border-cyanGlow"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddCatModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-bold text-gray-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 py-3 rounded-xl glow-btn-cyan text-xs font-black text-black"
              >
                حفظ القسم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD PRODUCT MODAL */}
      {showAddProdModal && (
        <div className="fixed inset-0 z-[600] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border-t-4 border-violetApex space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-white font-ar">إضافة صنف / عداد جديد</h3>
              <button
                onClick={() => setShowAddProdModal(false)}
                className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1 font-ar">اسم الصنف:</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="مثال: ساعة بليستيشن 5 أو عصير رمان"
                  className="w-full bg-panelDark border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-violetApex"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1 font-ar">نوع الصنف / الحساب:</label>
                <select
                  value={newProdType}
                  onChange={(e) => setNewProdType(e.target.value)}
                  className="w-full bg-panelDark border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-violetApex"
                >
                  <option value="direct">طلب مباشر (مشروبات، مأكولات)</option>
                  <option value="countdown">عداد وقت تنازلي محدد</option>
                  <option value="open">عداد وقت تصاعدي مفتوح (سعر لكل ساعة)</option>
                </select>
              </div>

              {newProdType === 'countdown' && (
                <div>
                  <label className="text-xs text-cyanGlow font-bold block mb-1 font-ar">المدة بالدقائق:</label>
                  <input
                    type="number"
                    value={newProdDurationMin}
                    onChange={(e) => setNewProdDurationMin(e.target.value)}
                    placeholder="30"
                    min="1"
                    className="w-full bg-panelDark border border-cyanGlow/30 rounded-xl p-3 text-xs font-mono font-bold text-white outline-none focus:border-cyanGlow"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1 font-ar">السعر (IQD):</label>
                <input
                  type="number"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  placeholder="2000"
                  className="w-full bg-panelDark border border-white/10 rounded-xl p-3 text-xs font-mono font-bold text-white outline-none focus:border-violetApex"
                />
              </div>

              <div>
                <label className="text-xs text-gray-300 font-bold block mb-1 font-ar">الأيقونة (Emoji):</label>
                <input
                  type="text"
                  value={newProdIcon}
                  onChange={(e) => setNewProdIcon(e.target.value)}
                  placeholder="🎮"
                  className="w-full bg-panelDark border border-white/10 rounded-xl p-2.5 text-base text-center outline-none focus:border-violetApex"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddProdModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-bold text-gray-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddProduct}
                className="flex-1 py-3 rounded-xl glow-btn-primary text-xs font-black text-white shadow-lg shadow-violetApex/25"
              >
                حفظ الصنف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
