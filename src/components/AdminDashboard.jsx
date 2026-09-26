import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Store, 
  FileText, 
  Bot, 
  Plus, 
  Lock, 
  Unlock, 
  Trash2, 
  LogIn, 
  RefreshCw, 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { 
  verifySuperAdminPin, 
  fetchAllShops, 
  createTenantShop, 
  toggleTenantStatus, 
  deleteTenantShop, 
  fetchActivityLogs, 
  logSecurityEvent 
} from '../lib/db/turso';
import { setUserRole, ROLES } from '../utils/security/rbac';
import { useAI } from '../hooks/useAI';

export const AdminDashboard = React.memo(function AdminDashboard({
  isOpen,
  onClose,
  onSwitchToShop
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [activeTab, setActiveTab] = useState('shops'); // 'shops' | 'logs' | 'ai'
  const [shops, setShops] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingShops, setLoadingShops] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logTenantFilter, setLogTenantFilter] = useState('all');

  // Add shop modal
  const [showAddShopModal, setShowAddShopModal] = useState(false);
  const [newShopId, setNewShopId] = useState('');
  const [newShopName, setNewShopName] = useState('');
  const [newShopPasscode, setNewShopPasscode] = useState('');

  // AI Hook
  const {
    loading: aiLoading,
    error: aiError,
    response: aiResponse,
    analysisStats,
    runAnalysis,
    getApiKey,
    setApiKey,
    hasApiKey
  } = useAI();

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [customAIPrompt, setCustomAIPrompt] = useState('');
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Check existing session
  useEffect(() => {
    if (sessionStorage.getItem('716QX_ADMIN_AUTH') === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    if (verifySuperAdminPin(pinInput)) {
      setIsUnlocked(true);
      sessionStorage.setItem('716QX_ADMIN_AUTH', 'true');
      setUserRole(ROLES.SUPER_ADMIN);
      setPinError('');
      loadShopsData();
    } else {
      setPinError('رمز الأدمن السري غير صحيح');
      logSecurityEvent("فشل مصادقة أدمن", "محاولة إدخال PIN خاطئ في بوابة الأدمن المركزي", "super_admin");
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('716QX_ADMIN_AUTH');
    onClose();
  };

  const loadShopsData = async () => {
    setLoadingShops(true);
    try {
      const data = await fetchAllShops();
      setShops(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingShops(false);
    }
  };

  const loadLogsData = async () => {
    setLoadingLogs(true);
    try {
      const data = await fetchActivityLogs(logTenantFilter, 200);
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      if (activeTab === 'shops') loadShopsData();
      if (activeTab === 'logs') loadLogsData();
    }
  }, [isUnlocked, activeTab, logTenantFilter]);

  const handleAddShop = async () => {
    if (!newShopId.trim() || !newShopName.trim() || !newShopPasscode.trim()) return;
    try {
      await createTenantShop(newShopId, newShopName, newShopPasscode);
      setShowAddShopModal(false);
      setNewShopId('');
      setNewShopName('');
      setNewShopPasscode('');
      loadShopsData();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleToggleStatus = async (shopId, curStatus) => {
    const nextStatus = curStatus === 'blocked' ? 'active' : 'blocked';
    const actionLabel = nextStatus === 'blocked' ? 'تجميد' : 'تفعيل';
    if (confirm(`هل أنت متأكد من ${actionLabel} اشتراك الصالة (${shopId})؟`)) {
      await toggleTenantStatus(shopId, nextStatus);
      loadShopsData();
    }
  };

  const handleDeleteShop = async (shopId, shopName) => {
    if (confirm(`تحذير شديد: هل أنت متأكد من حذف (${shopName}) وكافة فواتيرها وبياناتها السحابية نهائياً؟`)) {
      await deleteTenantShop(shopId);
      loadShopsData();
    }
  };

  const handleCopyAI = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[700] bg-obsidian/95 backdrop-blur-3xl flex flex-col overflow-y-auto animate-fadeIn">
      {/* LOCKED SCREEN */}
      {!isUnlocked ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-8 rounded-3xl border-t-4 border-violetApex shadow-2xl text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-violetApex to-cyanGlow flex items-center justify-center text-4xl shadow-xl shadow-violetApex/30">
              👑
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white font-ar">بوابة الأدمن المركزي</h2>
              <p className="text-xs text-gray-400 font-ar">
                منطقة تحكم محمية. يرجى إدخال رمز الأدمن السري للوصول للوحة الإدارة
              </p>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-roseAlert/15 border border-roseAlert/30 text-roseAlert text-xs font-bold font-ar">
                {pinError}
              </div>
            )}

            <div className="space-y-2 text-right">
              <label className="text-xs text-gray-300 font-bold block font-ar">
                رمز الأدمن السري (Admin PIN):
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="•••••••"
                className="w-full bg-panelDark border border-white/10 rounded-xl p-3.5 text-center font-mono text-base font-bold text-white outline-none focus:border-violetApex tracking-widest"
                dir="ltr"
                autoFocus
              />
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleUnlock}
                className="w-full py-3.5 glow-btn-primary rounded-xl font-black text-white text-sm transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-violetApex/25"
              >
                <Unlock className="w-4 h-4" />
                فتح لوحة الإدارة ➔
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold transition-all text-center"
              >
                العودة لواجهة الكاشير (POS)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* UNLOCKED ADMIN SUITE */
        <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
          {/* Top Admin Bar */}
          <header className="glass-card px-6 py-4 rounded-3xl border border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violetApex to-cyanGlow flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-violetApex/30">
                👑
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-white font-ar">
                    لوحة تحكم الأدمن المركزي
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violetApex/20 text-violetApex border border-violetApex/30 font-en uppercase">
                    SaaS SuperAdmin
                  </span>
                </div>
                <p className="text-xs text-cyanGlow font-bold font-ar">
                  إدارة الصالات والاشتراكات السحابية المعزولة مع مساعد الذكاء الاصطناعي
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold transition-all flex items-center gap-2 border border-white/10"
              >
                <span>🏪</span> العودة للكاشير
              </button>
              <button
                onClick={handleLock}
                className="px-4 py-2.5 rounded-xl bg-roseAlert/15 hover:bg-roseAlert text-roseAlert hover:text-white text-xs font-bold transition-all flex items-center gap-2 border border-roseAlert/30"
              >
                <Lock className="w-3.5 h-3.5" />
                قفل الأدمن
              </button>
            </div>
          </header>

          {/* KPI Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-400 font-bold block mb-1 font-ar">إجمالي الصالات</span>
                <span className="text-2xl font-black font-en text-white">{shops.length}</span>
              </div>
              <Store className="w-8 h-8 text-violetApex opacity-80" />
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-emeraldGlow font-bold block mb-1 font-ar">الصالات المفعلة</span>
                <span className="text-2xl font-black font-en text-emeraldGlow">
                  {shops.filter((s) => s.status !== 'blocked').length}
                </span>
              </div>
              <span className="text-2xl">✅</span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-roseAlert font-bold block mb-1 font-ar">الصالات المجمدة</span>
                <span className="text-2xl font-black font-en text-roseAlert">
                  {shops.filter((s) => s.status === 'blocked').length}
                </span>
              </div>
              <span className="text-2xl">⛔</span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs text-cyanGlow font-bold block mb-1 font-ar">سجل العمليات</span>
                <span className="text-2xl font-black font-en text-cyanGlow">{logs.length}</span>
              </div>
              <FileText className="w-8 h-8 text-cyanGlow opacity-80" />
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTab('shops')}
              className={`px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'shops'
                  ? 'bg-violetApex text-white shadow-lg shadow-violetApex/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>إدارة الصالات والاشتراكات</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'logs'
                  ? 'bg-violetApex text-white shadow-lg shadow-violetApex/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>سجل الرقابة المركزي (Audit Log)</span>
            </button>

            <button
              onClick={() => setActiveTab('ai')}
              className={`px-5 py-3 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 ${
                activeTab === 'ai'
                  ? 'bg-violetApex text-white shadow-lg shadow-violetApex/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bot className="w-4 h-4 text-cyanGlow" />
              <span>المساعد الذكي (OpenRouter AI)</span>
            </button>
          </div>

          {/* TAB 1: SHOPS MANAGEMENT */}
          {activeTab === 'shops' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-white font-ar">قائمة الصالات المسجلة</h3>
                  <p className="text-xs text-gray-400 font-ar">تحكم في الصالات وتفعيل/تجميد الاشتراكات وعزل البيانات</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={loadShopsData}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-all border border-white/10"
                    title="تحديث القائمة"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingShops ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowAddShopModal(true)}
                    className="glow-btn-primary px-4 py-2.5 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-violetApex/25"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة صالة جديدة</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-xs font-ar">
                    <thead>
                      <tr className="bg-black/40 text-gray-400 font-bold border-b border-white/10">
                        <th className="p-4">معرّف الصالة (ID)</th>
                        <th className="p-4">اسم الصالة</th>
                        <th className="p-4">رمز الدخول</th>
                        <th className="p-4">حالة الاشتراك</th>
                        <th className="p-4">تاريخ الإنشاء</th>
                        <th className="p-4 text-center">التحكم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {shops.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-10 text-gray-500">
                            لا توجد صالات مسجلة بعد
                          </td>
                        </tr>
                      ) : (
                        shops.map((s) => (
                          <tr key={s.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono font-bold text-cyanGlow" dir="ltr">{s.id}</td>
                            <td className="p-4 font-bold text-white text-sm">{s.name}</td>
                            <td className="p-4 font-mono text-gray-300" dir="ltr">{s.passcode}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                s.status === 'blocked'
                                  ? 'bg-roseAlert/15 border-roseAlert/30 text-roseAlert'
                                  : 'bg-emeraldGlow/15 border-emeraldGlow/30 text-emeraldGlow'
                              }`}>
                                {s.status === 'blocked' ? '⛔ مجمد' : '✅ نشط'}
                              </span>
                            </td>
                            <td className="p-4 text-gray-400 font-mono text-[11px]">{s.createdAt}</td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => onSwitchToShop(s)}
                                  className="px-3 py-1.5 rounded-lg bg-cyanGlow/15 hover:bg-cyanGlow text-cyanGlow hover:text-black font-bold text-xs transition-all border border-cyanGlow/30 flex items-center gap-1"
                                  title="فتح واجهة الكاشير لهذه الصالة"
                                >
                                  <LogIn className="w-3.5 h-3.5" />
                                  دخول
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(s.id, s.status)}
                                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all border ${
                                    s.status === 'blocked'
                                      ? 'bg-emeraldGlow/15 text-emeraldGlow hover:bg-emeraldGlow hover:text-black border-emeraldGlow/30'
                                      : 'bg-amberWarn/15 text-amberWarn hover:bg-amberWarn hover:text-black border-amberWarn/30'
                                  }`}
                                >
                                  {s.status === 'blocked' ? 'تفعيل' : 'تجميد'}
                                </button>
                                <button
                                  onClick={() => handleDeleteShop(s.id, s.name)}
                                  className="p-1.5 rounded-lg bg-roseAlert/10 hover:bg-roseAlert text-roseAlert hover:text-white transition-all border border-roseAlert/20"
                                  title="حذف نهائي"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-white font-ar">سجل الحركات السحابي (Zero-Trust Audit)</h3>
                  <p className="text-xs text-gray-400 font-ar">مراقبة محاولات التلاعب، تسجيل الدخول، وحذف الفواتير</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={logTenantFilter}
                    onChange={(e) => setLogTenantFilter(e.target.value)}
                    className="bg-panelDark border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-cyanGlow"
                  >
                    <option value="all">كافة الصالات</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                  <button
                    onClick={loadLogsData}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-all border border-white/10"
                    title="تحديث"
                  >
                    <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="glass-card rounded-3xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full text-right border-collapse text-xs font-ar">
                    <thead>
                      <tr className="bg-black/40 text-gray-400 font-bold border-b border-white/10 sticky top-0 backdrop-blur-md">
                        <th className="p-4">الوقت والتاريخ</th>
                        <th className="p-4">رمز الصالة</th>
                        <th className="p-4">نوع العملية</th>
                        <th className="p-4">التفاصيل الكاملة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-10 text-gray-500">لا توجد سجلات بعد</td>
                        </tr>
                      ) : (
                        logs.map((l) => {
                          const isAlert = l.action.includes('أمني') || l.action.includes('فشل');
                          return (
                            <tr key={l.id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-mono text-gray-400 text-[11px] whitespace-nowrap">{l.createdAt}</td>
                              <td className="p-4 font-mono font-bold text-cyanGlow">{l.tenantId}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                                  isAlert 
                                    ? 'bg-roseAlert/15 border-roseAlert/30 text-roseAlert'
                                    : 'bg-white/5 border-white/10 text-white'
                                }`}>
                                  {l.action}
                                </span>
                              </td>
                              <td className="p-4 text-gray-200">{l.detail}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OPENROUTER AI ANALYTICS */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              {/* Header Box */}
              <div className="glass-card p-6 rounded-3xl border border-cyanGlow/30 bg-gradient-to-r from-violetApex/10 to-cyanGlow/10 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyanGlow/20 text-cyanGlow flex items-center justify-center">
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white font-ar">
                        تحليل المبيعات الذكي بواسطة OpenRouter AI
                      </h3>
                      <p className="text-xs text-gray-300 font-ar">
                        يرسل ملخص الفواتير الحقيقية للنموذج لاستخراج أوقات الذروة، الأصناف الأقوى، واقتراحات رفع الإيرادات
                      </p>
                    </div>
                  </div>

                  {/* API Key Status */}
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${hasApiKey ? 'bg-emeraldGlow animate-ping' : 'bg-roseAlert'}`}></span>
                    <span className="text-xs font-bold font-mono text-gray-300">
                      {hasApiKey ? 'API Key Active' : 'API Key Missing'}
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    disabled={aiLoading}
                    onClick={() => runAnalysis('daily')}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-emeraldGlow/15 border border-white/10 hover:border-emeraldGlow/30 text-right space-y-1 transition-all group disabled:opacity-50"
                  >
                    <span className="text-2xl block group-hover:scale-110 transition-transform">📈</span>
                    <div className="font-bold text-white text-xs font-ar">تحليل مبيعات اليوم</div>
                    <div className="text-[10px] text-gray-400 font-ar">تقييم الإيراد ونسبة الديون</div>
                  </button>

                  <button
                    disabled={aiLoading}
                    onClick={() => runAnalysis('weekly')}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-cyanGlow/15 border border-white/10 hover:border-cyanGlow/30 text-right space-y-1 transition-all group disabled:opacity-50"
                  >
                    <span className="text-2xl block group-hover:scale-110 transition-transform">📊</span>
                    <div className="font-bold text-white text-xs font-ar">تقرير الأداء الشامل</div>
                    <div className="text-[10px] text-gray-400 font-ar">مقارنة الفروع ومحركات النمو</div>
                  </button>

                  <button
                    disabled={aiLoading}
                    onClick={() => runAnalysis('peak')}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-amberWarn/15 border border-white/10 hover:border-amberWarn/30 text-right space-y-1 transition-all group disabled:opacity-50"
                  >
                    <span className="text-2xl block group-hover:scale-110 transition-transform">⏰</span>
                    <div className="font-bold text-white text-xs font-ar">ساعات وسلوك الذروة</div>
                    <div className="text-[10px] text-gray-400 font-ar">أوقات الازدحام ونوع الخدمات</div>
                  </button>

                  <button
                    disabled={aiLoading}
                    onClick={() => runAnalysis('items')}
                    className="p-4 rounded-2xl bg-white/5 hover:bg-violetApex/15 border border-white/10 hover:border-violetApex/30 text-right space-y-1 transition-all group disabled:opacity-50"
                  >
                    <span className="text-2xl block group-hover:scale-110 transition-transform">🏆</span>
                    <div className="font-bold text-white text-xs font-ar">تحسين قائمة المنيو</div>
                    <div className="text-[10px] text-gray-400 font-ar">الأصناف الذهبية والراكدة</div>
                  </button>
                </div>
              </div>

              {/* Custom Prompt Box */}
              <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3">
                <label className="text-xs font-bold text-gray-300 block font-ar">
                  أو اسأل المساعد الذكي سؤالاً مخصصاً حول بيانات الصالات:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAIPrompt}
                    onChange={(e) => setCustomAIPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && customAIPrompt && runAnalysis('custom', 'all', customAIPrompt)}
                    placeholder="مثال: قارن بين إيراد مشروبات الطاقة مقارنة بساعات المنضدة..."
                    className="flex-1 bg-panelDark border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-cyanGlow font-ar"
                  />
                  <button
                    disabled={aiLoading || !customAIPrompt.trim()}
                    onClick={() => runAnalysis('custom', 'all', customAIPrompt)}
                    className="glow-btn-cyan px-6 py-3 rounded-xl font-black text-xs text-black shrink-0 disabled:opacity-50"
                  >
                    {aiLoading ? 'جاري التحليل...' : 'تحليل ➔'}
                  </button>
                </div>
              </div>

              {/* AI Response Display */}
              {(aiLoading || aiResponse || aiError) && (
                <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-cyanGlow" />
                      <h4 className="text-sm font-black text-white font-ar">نتيجة التحليل الذكي</h4>
                      {analysisStats && (
                        <span className="text-[10px] font-mono text-gray-400">
                          ({analysisStats.invoicesCount} فاتورة · {analysisStats.timeSeconds}s)
                        </span>
                      )}
                    </div>

                    {aiResponse && (
                      <button
                        onClick={handleCopyAI}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 flex items-center gap-1.5 transition-all"
                      >
                        {copiedResponse ? <Check className="w-3.5 h-3.5 text-emeraldGlow" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedResponse ? 'تم النسخ' : 'نسخ التقرير'}
                      </button>
                    )}
                  </div>

                  {aiLoading ? (
                    <div className="p-12 text-center space-y-3">
                      <RefreshCw className="w-8 h-8 text-cyanGlow animate-spin mx-auto" />
                      <p className="text-xs text-gray-300 font-ar font-bold">
                        جاري جمع بيانات الفواتير وتحليلها بواسطة نموذج الذكاء الاصطناعي...
                      </p>
                    </div>
                  ) : aiError ? (
                    <div className="p-4 rounded-2xl bg-roseAlert/15 border border-roseAlert/30 text-roseAlert text-xs font-bold font-ar">
                      {aiError}
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl bg-panelDark/80 border border-white/5 text-gray-200 text-xs leading-relaxed whitespace-pre-wrap font-ar">
                      {aiResponse}
                    </div>
                  )}
                </div>
              )}

              {/* API Key Configuration Footer */}
              <div className="p-4 rounded-2xl bg-panelDark/60 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-gray-300 font-ar block">مفتاح OpenRouter API (إعدادات سحابية):</span>
                  <span className="text-gray-500 text-[11px] font-ar">
                    يتم تخزينه في الذاكرة المشفرة لجلسة الأدمن الحالية فقط
                  </span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyanGlow w-full sm:w-60"
                    dir="ltr"
                  />
                  <button
                    onClick={() => {
                      if (apiKeyInput.trim()) {
                        setApiKey(apiKeyInput.trim());
                        setApiKeyInput('');
                        alert('تم حفظ مفتاح API بنجاح');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs shrink-0"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADD SHOP MODAL */}
          {showAddShopModal && (
            <div className="fixed inset-0 z-[800] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="glass-card max-w-md w-full p-6 sm:p-8 rounded-3xl border-t-4 border-violetApex space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <Store className="w-5 h-5 text-violetApex" />
                    <h3 className="text-base font-black text-white font-ar">إضافة صالة جديدة</h3>
                  </div>
                  <button
                    onClick={() => setShowAddShopModal(false)}
                    className="w-7 h-7 rounded-lg bg-white/5 text-gray-400 hover:text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-300 font-bold block mb-1 font-ar">
                      معرّف الصالة (Shop ID بالإنجليزية):
                    </label>
                    <input
                      type="text"
                      value={newShopId}
                      onChange={(e) => setNewShopId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                      placeholder="مثال: baghdad-hall"
                      className="w-full bg-panelDark border border-white/10 rounded-xl p-3 text-xs font-mono font-bold text-white outline-none focus:border-cyanGlow"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-300 font-bold block mb-1 font-ar">
                      اسم الصالة بالعربي:
                    </label>
                    <input
                      type="text"
                      value={newShopName}
                      onChange={(e) => setNewShopName(e.target.value)}
                      placeholder="مثال: صالة بغداد للمنضدة والبليارد"
                      className="w-full bg-panelDark border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-violetApex font-ar"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-300 font-bold block mb-1 font-ar">
                      رمز المرور السري (Passcode / PIN):
                    </label>
                    <input
                      type="text"
                      value={newShopPasscode}
                      onChange={(e) => setNewShopPasscode(e.target.value)}
                      placeholder="5500"
                      className="w-full bg-panelDark border border-white/10 rounded-xl p-3 text-xs font-mono font-bold text-white outline-none focus:border-violetApex"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowAddShopModal(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-bold text-gray-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleAddShop}
                    className="flex-1 py-3 rounded-xl glow-btn-primary text-xs font-black text-white shadow-lg shadow-violetApex/25"
                  >
                    إنشاء الصالة السحابية ➔
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
