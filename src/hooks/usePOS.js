import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { recordInvoice, logSecurityEvent } from '../lib/db/turso';
import { useRealtimeSync } from './useRealtimeSync';

/**
 * Intelligent 250 IQD rounding (rounds to closest multiple of 250 IQD)
 */
export function roundTo250(amount) {
  const num = Math.max(0, Number(amount) || 0);
  return Math.round(num / 250) * 250;
}

const DEFAULT_CATEGORIES = [
  { id: 'cat_hot', name: 'ساخن', icon: '☕' },
  { id: 'cat_juices', name: 'عصائر', icon: '🍹' },
  { id: 'cat_cold', name: 'مشروبات باردة', icon: '🥤' },
  { id: 'cat_hookah', name: 'نراكيل', icon: '💨' },
  { id: 'cat_table', name: 'منضدة', icon: '🎱' },
  { id: 'cat_ps', name: 'بلي 5', icon: '🎮' },
  { id: 'cat_billiards', name: 'بليارد', icon: '🎱' }
];

const DEFAULT_MENU = [
  { id: 'm_hot_1', catId: 'cat_hot', name: 'شاي', price: 250, icon: '☕', isTime: false },
  { id: 'm_hot_2', catId: 'cat_hot', name: 'إيس كوفي', price: 1000, icon: '🧋', isTime: false },
  { id: 'm_hot_3', catId: 'cat_hot', name: 'إندومي', price: 1000, icon: '🍜', isTime: false },
  { id: 'm_hot_4', catId: 'cat_hot', name: 'چاي', price: 500, icon: '🍵', isTime: false },
  { id: 'm_cold_1', catId: 'cat_cold', name: 'سفن أب', price: 500, icon: '🥤', isTime: false },
  { id: 'm_cold_2', catId: 'cat_cold', name: 'ميرندا', price: 500, icon: '🥤', isTime: false },
  { id: 'm_cold_3', catId: 'cat_cold', name: 'تايكر', price: 1250, icon: '🥤', isTime: false },
  { id: 'm_cold_4', catId: 'cat_cold', name: 'ماء', price: 500, icon: '💧', isTime: false },
  { id: 'm_juice_1', catId: 'cat_juices', name: 'عصير برتقال', price: 1000, icon: '🍹', isTime: false },
  { id: 'm_juice_2', catId: 'cat_juices', name: 'عصير بطيخ', price: 1000, icon: '🍉', isTime: false },
  { id: 'm_hookah_1', catId: 'cat_hookah', name: 'تركيلة تفاحتين', price: 2500, icon: '💨', isTime: false },
  { id: 'm_hookah_2', catId: 'cat_hookah', name: 'تركيلة علك نعناع', price: 2500, icon: '💨', isTime: false },

  // Timed Games
  { id: 'm_table_1', catId: 'cat_table', name: 'منضدة وقت مفتوح (4000/ساعة)', price: 4000, icon: '🎱', isTime: true, timerMode: 'open' },
  { id: 'm_table_2', catId: 'cat_table', name: 'نصف ساعة منضدة', price: 2000, icon: '⏱', isTime: true, timerMode: 'countdown', durationSeconds: 1800 },
  { id: 'm_table_3', catId: 'cat_table', name: 'ساعة منضدة', price: 4000, icon: '⏱', isTime: true, timerMode: 'countdown', durationSeconds: 3600 },
  { id: 'm_ps_1', catId: 'cat_ps', name: 'بلي 5 وقت مفتوح (4000/ساعة)', price: 4000, icon: '🎮', isTime: true, timerMode: 'open' },
  { id: 'm_ps_2', catId: 'cat_ps', name: 'نصف ساعة بلي', price: 2000, icon: '🎮', isTime: true, timerMode: 'countdown', durationSeconds: 1800 },
  { id: 'm_ps_3', catId: 'cat_ps', name: 'ساعة بلي', price: 4000, icon: '🎮', isTime: true, timerMode: 'countdown', durationSeconds: 3600 },
  { id: 'm_billiards_1', catId: 'cat_billiards', name: 'بليارد وقت مفتوح (5000/ساعة)', price: 5000, icon: '🎱', isTime: true, timerMode: 'open' },
  { id: 'm_billiards_2', catId: 'cat_billiards', name: 'ساعة بليارد', price: 5000, icon: '⏱', isTime: true, timerMode: 'countdown', durationSeconds: 3600 }
];

export function usePOS(tenant) {
  const tenantId = tenant ? tenant.id : null;

  // In-Memory state for the active tenant (Zero LocalStorage)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [menu, setMenu] = useState(DEFAULT_MENU);
  const [tables, setTables] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [debts, setDebts] = useState({});
  const [stats, setStats] = useState({ daily: 0, yesterday: 0, monthly: 0 });

  // Clock tick trigger for live time counters
  const [timeTick, setTimeTick] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTimeTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Remote update receiver
  const handleRemoteUpdate = useCallback((cloudData) => {
    if (!cloudData) return;
    if (cloudData.categories) setCategories(cloudData.categories);
    if (cloudData.menu) setMenu(cloudData.menu);
    if (cloudData.invoices) setInvoices(cloudData.invoices);
    if (cloudData.debts) setDebts(cloudData.debts);
    if (cloudData.stats) setStats(cloudData.stats);

    // Merge tables preserving running timer start timestamps
    if (cloudData.tables) {
      setTables((prevTables) => {
        const merged = { ...cloudData.tables };
        Object.keys(merged).forEach((tblId) => {
          const remoteTbl = merged[tblId];
          const localTbl = prevTables[tblId];
          if (localTbl && remoteTbl && localTbl.items && remoteTbl.items) {
            remoteTbl.items.forEach((rItem, idx) => {
              const lItem = localTbl.items[idx];
              if (lItem && lItem.isTime && lItem.isRunning && lItem.startTime) {
                rItem.isRunning = true;
                rItem.startTime = lItem.startTime;
              }
            });
          }
        });
        return merged;
      });
    }
  }, []);

  // State bundle for syncing
  const getCurrentState = useCallback(() => {
    return { categories, menu, tables, invoices, debts, stats };
  }, [categories, menu, tables, invoices, debts, stats]);

  // Hook into Turso real-time cloud sync
  const { syncStatus, lastSyncedAt, pushState, manualSync } = useRealtimeSync(
    tenantId,
    getCurrentState(),
    handleRemoteUpdate
  );

  // Auto push whenever state changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (tenantId) {
      pushState(getCurrentState());
    }
  }, [categories, menu, tables, invoices, debts, stats, tenantId, pushState, getCurrentState]);

  // ─────────────────────────────────────────────
  // CALCULATION LOGIC (Optimized 0.0ms)
  // ─────────────────────────────────────────────
  const calculateItemCost = useCallback((item) => {
    if (!item) return 0;
    if (!item.isTime) {
      return (Number(item.price) || 0) * (Number(item.qty) || 1);
    }

    const now = Date.now();
    let elapsed = item.elapsedSeconds || 0;
    if (item.isRunning && item.startTime) {
      elapsed += Math.floor((now - item.startTime) / 1000);
    }

    if (item.timerMode === 'countdown') {
      const dur = item.durationSeconds || 1800;
      const ratio = Math.min(1, elapsed / dur);
      return roundTo250(item.price * ratio);
    } else {
      // Open mode: price per hour
      const hours = elapsed / 3600;
      return roundTo250(item.price * hours);
    }
  }, []);

  const calculateTableTotals = useCallback((table) => {
    if (!table || !table.items) {
      return { subtotal: 0, earlyPaid: 0, discount: 0, finalRemaining: 0 };
    }

    let subtotal = 0;
    let earlyPaid = 0;

    table.items.forEach((item) => {
      subtotal += calculateItemCost(item);
      earlyPaid += (Number(item.earlyPaid) || 0);
    });

    const discount = Number(table.discount) || 0;
    const finalRemaining = Math.max(0, subtotal - earlyPaid - discount);

    return {
      subtotal,
      earlyPaid,
      discount,
      finalRemaining
    };
  }, [calculateItemCost]);

  // ─────────────────────────────────────────────
  // TABLE ACTIONS
  // ─────────────────────────────────────────────
  const addTable = useCallback((name) => {
    const id = `tbl_${Date.now()}`;
    const cleanName = (name || '').trim() || `طاولة ${Object.keys(tables).length + 1}`;
    setTables((prev) => ({
      ...prev,
      [id]: {
        id,
        name: cleanName,
        customer: 'زبون عام',
        discount: 0,
        createdAt: Date.now(),
        items: []
      }
    }));
    logSecurityEvent('إضافة طاولة', `تم فتح طاولة جديدة: ${cleanName}`, tenantId);
    return id;
  }, [tables, tenantId]);

  const deleteTable = useCallback((tableId) => {
    setTables((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });
    logSecurityEvent('حذف طاولة', `تم حذف الطاولة (${tableId})`, tenantId);
  }, [tenantId]);

  const addItemToTable = useCallback((tableId, menuItem) => {
    setTables((prev) => {
      const tbl = prev[tableId];
      if (!tbl) return prev;

      const items = [...tbl.items];
      if (!menuItem.isTime) {
        const existingIdx = items.findIndex((i) => i.menuId === menuItem.id && !i.isTime);
        if (existingIdx >= 0) {
          items[existingIdx] = {
            ...items[existingIdx],
            qty: (items[existingIdx].qty || 1) + 1
          };
        } else {
          items.push({
            id: `item_${Date.now()}_${Math.random()}`,
            menuId: menuItem.id,
            name: menuItem.name,
            icon: menuItem.icon || '🥤',
            price: menuItem.price,
            qty: 1,
            earlyPaid: 0,
            isTime: false
          });
        }
      } else {
        // Timed item
        items.push({
          id: `item_${Date.now()}_${Math.random()}`,
          menuId: menuItem.id,
          name: menuItem.name,
          icon: menuItem.icon || '⏱',
          price: menuItem.price,
          qty: 1,
          earlyPaid: 0,
          isTime: true,
          timerMode: menuItem.timerMode || 'countdown',
          durationSeconds: menuItem.durationSeconds || 1800,
          elapsedSeconds: 0,
          startTime: Date.now(),
          isRunning: true
        });
      }

      return {
        ...prev,
        [tableId]: { ...tbl, items }
      };
    });
  }, []);

  const toggleTimer = useCallback((tableId, itemIndex) => {
    setTables((prev) => {
      const tbl = prev[tableId];
      if (!tbl || !tbl.items[itemIndex]) return prev;

      const items = [...tbl.items];
      const item = { ...items[itemIndex] };
      const now = Date.now();

      if (item.isRunning) {
        // Pause
        item.elapsedSeconds += Math.floor((now - item.startTime) / 1000);
        item.isRunning = false;
        item.startTime = null;
      } else {
        // Resume
        item.startTime = now;
        item.isRunning = true;
      }

      items[itemIndex] = item;
      return { ...prev, [tableId]: { ...tbl, items } };
    });
  }, []);

  const updateTableCustomer = useCallback((tableId, customerName) => {
    setTables((prev) => {
      if (!prev[tableId]) return prev;
      return {
        ...prev,
        [tableId]: { ...prev[tableId], customer: customerName || 'زبون عام' }
      };
    });
  }, []);

  const updateTableDiscount = useCallback((tableId, discountIQD) => {
    setTables((prev) => {
      if (!prev[tableId]) return prev;
      return {
        ...prev,
        [tableId]: { ...prev[tableId], discount: Math.max(0, Number(discountIQD) || 0) }
      };
    });
  }, []);

  const recordEarlyPayment = useCallback((tableId, itemIndex, amount) => {
    setTables((prev) => {
      const tbl = prev[tableId];
      if (!tbl || !tbl.items[itemIndex]) return prev;

      const items = [...tbl.items];
      const item = { ...items[itemIndex] };
      item.earlyPaid = (Number(item.earlyPaid) || 0) + Number(amount);
      items[itemIndex] = item;

      // Update daily stats cash collected immediately
      setStats((s) => ({ ...s, daily: s.daily + Number(amount) }));

      return { ...prev, [tableId]: { ...tbl, items } };
    });
    logSecurityEvent('تسديد مبكر', `تم استلام دفعة مبكرة بمقدار ${amount} د.ع`, tenantId);
  }, [tenantId]);

  const removeItemFromTable = useCallback((tableId, itemIndex) => {
    setTables((prev) => {
      const tbl = prev[tableId];
      if (!tbl) return prev;
      const items = tbl.items.filter((_, idx) => idx !== itemIndex);
      return { ...prev, [tableId]: { ...tbl, items } };
    });
  }, []);

  // ─────────────────────────────────────────────
  // CHECKOUT & ARCHIVE
  // ─────────────────────────────────────────────
  const checkoutTable = useCallback(async (tableId, paidAmount, debtAmount) => {
    const tbl = tables[tableId];
    if (!tbl) return;

    const totals = calculateTableTotals(tbl);
    const invoiceId = `INV-${Date.now()}`;
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('ar-IQ')} ${now.toLocaleTimeString('en-GB')}`;

    const newInvoice = {
      id: invoiceId,
      tableName: tbl.name,
      customer: tbl.customer || 'زبون عام',
      subtotal: totals.subtotal,
      earlyPaid: totals.earlyPaid,
      discount: totals.discount,
      finalTotal: totals.finalRemaining,
      paid: Number(paidAmount) || 0,
      debt: Number(debtAmount) || 0,
      items: tbl.items.map((i) => ({
        name: i.name,
        price: i.price,
        qty: i.qty || 1,
        cost: calculateItemCost(i),
        earlyPaid: i.earlyPaid || 0
      })),
      date: dateFormatted,
      timestamp: Math.floor(Date.now() / 1000)
    };

    // 1. Record invoice directly to Turso SQL
    if (tenantId) {
      await recordInvoice(tenantId, newInvoice);
    }

    // 2. Append to local invoices list (in-memory)
    setInvoices((prev) => [newInvoice, ...prev]);

    // 3. If debt exists, update debts ledger
    if (Number(debtAmount) > 0) {
      const cust = tbl.customer || 'زبون عام';
      setDebts((prev) => {
        const cur = prev[cust] || { customer: cust, totalDebt: 0, history: [] };
        return {
          ...prev,
          [cust]: {
            customer: cust,
            totalDebt: cur.totalDebt + Number(debtAmount),
            history: [
              {
                date: dateFormatted,
                action: 'دين فاتورة',
                amount: Number(debtAmount),
                invoiceId
              },
              ...cur.history
            ]
          }
        };
      });
    }

    // 4. Update daily stats with cash collected
    setStats((s) => ({
      ...s,
      daily: s.daily + (Number(paidAmount) || 0)
    }));

    // 5. Remove completed table
    setTables((prev) => {
      const next = { ...prev };
      delete next[tableId];
      return next;
    });

    logSecurityEvent('إغلاق حساب وفاتورة', `تم إغلاق طاولة ${tbl.name} بمبلغ ${totals.finalRemaining} د.ع`, tenantId);
  }, [tables, calculateTableTotals, calculateItemCost, tenantId]);

  // ─────────────────────────────────────────────
  // DEBT ADJUSTMENTS
  // ─────────────────────────────────────────────
  const adjustCustomerDebt = useCallback((customerName, mode, amount, note) => {
    const cust = customerName.trim();
    if (!cust) return;

    const numAmount = Number(amount) || 0;
    const now = new Date();
    const dateFormatted = `${now.toLocaleDateString('ar-IQ')} ${now.toLocaleTimeString('en-GB')}`;

    setDebts((prev) => {
      const cur = prev[cust] || { customer: cust, totalDebt: 0, history: [] };
      let newBalance = cur.totalDebt;
      let actionLabel = 'تسديد دفعة';

      if (mode === 'payment') {
        newBalance = Math.max(0, cur.totalDebt - numAmount);
        actionLabel = 'تسديد دفعة';
        // Add to daily revenue
        setStats((s) => ({ ...s, daily: s.daily + numAmount }));
      } else if (mode === 'add') {
        newBalance = cur.totalDebt + numAmount;
        actionLabel = 'إضافة دين';
      } else if (mode === 'set') {
        newBalance = numAmount;
        actionLabel = 'تعديل رصيد مباشر';
      }

      return {
        ...prev,
        [cust]: {
          customer: cust,
          totalDebt: newBalance,
          history: [
            {
              date: dateFormatted,
              action: actionLabel,
              amount: numAmount,
              note: note || ''
            },
            ...cur.history
          ]
        }
      };
    });

    logSecurityEvent('تعديل دين زبون', `${mode} للزبون ${cust} بمبلغ ${numAmount} د.ع`, tenantId);
  }, [tenantId]);

  // ─────────────────────────────────────────────
  // REVENUE ROLLOVER ACTIONS
  // ─────────────────────────────────────────────
  const resetDailyRevenue = useCallback(() => {
    setStats((s) => ({
      ...s,
      yesterday: s.daily,
      monthly: s.monthly + s.daily,
      daily: 0
    }));
    logSecurityEvent('تصفير اليوم وترحيل', `تم تصفير مبيعات اليوم وترحيلها للشهر`, tenantId);
  }, [tenantId]);

  const resetMonthlyRevenue = useCallback(() => {
    setStats((s) => ({
      ...s,
      monthly: 0
    }));
    logSecurityEvent('تصفير الشهر', `تم تصفير الإيراد الشهري التراكمي`, tenantId);
  }, [tenantId]);

  return {
    categories,
    setCategories,
    menu,
    setMenu,
    tables,
    invoices,
    debts,
    stats,
    syncStatus,
    lastSyncedAt,
    manualSync,
    calculateItemCost,
    calculateTableTotals,
    addTable,
    deleteTable,
    addItemToTable,
    toggleTimer,
    updateTableCustomer,
    updateTableDiscount,
    recordEarlyPayment,
    removeItemFromTable,
    checkoutTable,
    adjustCustomerDebt,
    resetDailyRevenue,
    resetMonthlyRevenue
  };
}
