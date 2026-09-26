import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TablesView } from './components/TablesView';
import { TableDetailModal } from './components/TableDetailModal';
import { DebtsView } from './components/DebtsView';
import { InvoicesView } from './components/InvoicesView';
import { MenuView } from './components/MenuView';
import { AdminDashboard } from './components/AdminDashboard';
import { LoginModal } from './components/LoginModal';
import { Toast } from './components/Toast';
import { AntiDevToolsOverlay } from './components/AntiDevToolsOverlay';

import { usePOS } from './hooks/usePOS';
import { 
  ensureDBSchema, 
  getTenantSession, 
  clearTenantSession, 
  logSecurityEvent 
} from './lib/db/turso';
import { 
  initializeAntiDevTools, 
  cleanupAntiDevTools, 
  registerViolationHandler 
} from './utils/security/antiDevTools';
import { clearUserRole } from './utils/security/rbac';

export function App() {
  // Session & Security State (Zero LocalStorage)
  const [activeTenant, setActiveTenant] = useState(null);
  const [activeView, setActiveView] = useState('dashboard'); // 'dashboard' | 'tables' | 'debts' | 'invoices' | 'menu'
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // Security Tamper Alert
  const [securityViolation, setSecurityViolation] = useState(null);

  // Modals & Selection
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableNameInput, setNewTableNameInput] = useState('');

  // Toast System
  const [toast, setToast] = useState(null);
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Initialize Security and DB Schema on Mount
  useEffect(() => {
    ensureDBSchema();

    // Register Anti-DevTools Security Trap
    registerViolationHandler((reason) => {
      setSecurityViolation(reason);
    });
    initializeAntiDevTools();

    // Check if session exists in memory
    const existing = getTenantSession();
    if (existing) {
      setActiveTenant(existing);
    } else {
      setShowLoginModal(true);
    }

    return () => {
      cleanupAntiDevTools();
    };
  }, []);

  // POS Hook attached to active tenant
  const pos = usePOS(activeTenant);

  // Selected Table object
  const selectedTable = selectedTableId ? pos.tables[selectedTableId] : null;

  // Handle Login
  const handleLoginSuccess = (session) => {
    setActiveTenant(session);
    setShowLoginModal(false);
    showToast(`مرحباً بك في صالة (${session.name}) ✓`, 'success');
  };

  // Handle Logout
  const handleLogout = () => {
    if (confirm('هل أنت متأكد من تسجيل الخروج أو تبديل الصالة؟')) {
      clearTenantSession();
      clearUserRole();
      setActiveTenant(null);
      setShowLoginModal(true);
      showToast('تم تسجيل الخروج بنجاح', 'info');
    }
  };

  // Add Table Confirmation
  const confirmAddTable = () => {
    const id = pos.addTable(newTableNameInput);
    setNewTableNameInput('');
    setShowAddTableModal(false);
    showToast('تم فتح طاولة جديدة بنجاح', 'success');
    setSelectedTableId(id);
  };

  return (
    <div className="min-h-screen flex flex-col bg-obsidian text-white relative font-ar">
      {/* Background Aurora */}
      <div className="ambient-aurora"></div>

      {/* Security Violation Blur Freeze Overlay */}
      <AntiDevToolsOverlay
        isOpen={!!securityViolation}
        reason={securityViolation}
        onDismiss={() => setSecurityViolation(null)}
      />

      {/* Global Toast */}
      <Toast toast={toast} />

      {/* Top Navbar */}
      <Navbar
        tenant={activeTenant}
        activeView={activeView}
        onSwitchView={setActiveView}
        syncStatus={pos.syncStatus}
        onManualSync={() => {
          pos.manualSync();
          showToast('تمت المزامنة مع السحابة بنجاح ✓', 'success');
        }}
        onOpenAddTable={() => setShowAddTableModal(true)}
        onLogoutShop={handleLogout}
        onOpenSuperAdmin={() => setShowAdminDashboard(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative z-10">
        {activeView === 'dashboard' && (
          <DashboardView
            stats={pos.stats}
            activeSessionsCount={Object.keys(pos.tables).length}
            onResetDaily={() => {
              if (confirm('هل أنت متأكد من تصفير مبيعات اليوم وترحيلها للإيراد الشهري؟')) {
                pos.resetDailyRevenue();
                showToast('تم ترحيل مبيعات اليوم للشهر بنجاح', 'success');
              }
            }}
            onResetMonthly={() => {
              if (confirm('هل أنت متأكد من تصفير الإيراد الشهري التراكمي؟')) {
                pos.resetMonthlyRevenue();
                showToast('تم تصفير الإيراد الشهري', 'warn');
              }
            }}
            onNavigate={setActiveView}
          />
        )}

        {activeView === 'tables' && (
          <TablesView
            tables={pos.tables}
            calculateTableTotals={pos.calculateTableTotals}
            calculateItemCost={pos.calculateItemCost}
            onSelectTable={setSelectedTableId}
            onOpenAddTable={() => setShowAddTableModal(true)}
          />
        )}

        {activeView === 'debts' && (
          <DebtsView
            debts={pos.debts}
            invoices={pos.invoices}
            onAdjustDebt={(cust, mode, amt, note) => {
              pos.adjustCustomerDebt(cust, mode, amt, note);
              showToast('تم تعديل حساب الزبون بنجاح ✓', 'success');
            }}
          />
        )}

        {activeView === 'invoices' && (
          <InvoicesView invoices={pos.invoices} />
        )}

        {activeView === 'menu' && (
          <MenuView
            categories={pos.categories}
            setCategories={pos.setCategories}
            menu={pos.menu}
            setMenu={pos.setMenu}
          />
        )}
      </main>

      {/* Table Detail & Order Modal */}
      <TableDetailModal
        table={selectedTable}
        isOpen={!!selectedTable}
        categories={pos.categories}
        menu={pos.menu}
        onClose={() => setSelectedTableId(null)}
        calculateItemCost={pos.calculateItemCost}
        calculateTableTotals={pos.calculateTableTotals}
        onAddItem={pos.addItemToTable}
        onToggleTimer={pos.toggleTimer}
        onUpdateCustomer={pos.updateTableCustomer}
        onUpdateDiscount={pos.updateTableDiscount}
        onRecordEarlyPayment={(tblId, idx, amt) => {
          pos.recordEarlyPayment(tblId, idx, amt);
          showToast(`تم استلام دفعة مبكرة: ${amt.toLocaleString()} د.ع ✓`, 'success');
        }}
        onRemoveItem={pos.removeItemFromTable}
        onCheckout={(tblId, paid, debt) => {
          pos.checkoutTable(tblId, paid, debt);
          showToast('تم إغلاق الحساب وأرشفة الفاتورة سحابياً بنجاح ✓', 'success');
        }}
        onDeleteTable={(tblId) => {
          pos.deleteTable(tblId);
          showToast('تم إلغاء الطاولة', 'warn');
        }}
      />

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-[600] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 sm:p-8 rounded-3xl border-t-4 border-violetApex space-y-4 animate-fadeIn">
            <h3 className="text-lg font-black text-white font-ar text-center">
              فتح طاولة / جلسة جديدة
            </h3>
            <p className="text-xs text-gray-400 font-ar text-center">
              أدخل اسماً أو رقماً للطاولة لبدء تشغيل العدادات
            </p>

            <input
              type="text"
              value={newTableNameInput}
              onChange={(e) => setNewTableNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmAddTable()}
              placeholder="مثال: جهاز 5 (VIP) أو طاولة 3"
              className="w-full bg-panelDark border border-white/10 rounded-xl p-3.5 text-xs font-bold text-white outline-none focus:border-violetApex"
              autoFocus
            />

            <div className="flex flex-wrap gap-2">
              {['PS5 - جهاز ', 'غرفة VIP #', 'طاولة كافيه '].map((prefix) => (
                <button
                  key={prefix}
                  type="button"
                  onClick={() => setNewTableNameInput(`${prefix}${Object.keys(pos.tables).length + 1}`)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold font-ar"
                >
                  {prefix}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddTableModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-bold text-gray-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={confirmAddTable}
                className="flex-1 py-3 rounded-xl glow-btn-primary text-xs font-black text-white shadow-lg shadow-violetApex/25"
              >
                تأكيد والتشغيل ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Dashboard Modal */}
      <AdminDashboard
        isOpen={showAdminDashboard}
        onClose={() => setShowAdminDashboard(false)}
        onSwitchToShop={(shop) => {
          setActiveTenant(shop);
          setShowAdminDashboard(false);
          setActiveView('tables');
          showToast(`تم الانتقال إلى صالة (${shop.name})`, 'success');
        }}
      />

      {/* Cloud Shop Login Modal (Shown if not logged in) */}
      <LoginModal
        isOpen={showLoginModal}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
