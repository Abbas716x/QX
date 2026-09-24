/**
 * 716QX Cloud Database Adapter & Multi-Tenant SaaS Engine (Turso / LibSQL)
 * Handles Tenant Isolation, Shop Authentication, Admin Management, and Cloud Sync.
 */
(function() {
    const CONFIG = {
        url: "https://716qx-abbas716x.aws-ap-south-1.turso.io/v2/pipeline",
        token: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTAyMDkyNDksImlkIjoiMDFhMGQwYmYtNWQwMS03NThhLTliMzYtMDRkN2MyZGY3NWM0Iiwia2lkIjoiUDdBZlZSS1ZQRnJONHBqSW5DazNlZ2ZQVS1MaHZLeWRFZGZwQ1pkUFh6USIsInJpZCI6IjMzNTk2ZjliLWRkY2EtNGFhYS04NjMxLTkzNzMyZDVlMDkwOSJ9.G4hd7ufwb6iAAz5NeOQqICY_qZ7KE5_qF_3aPeBWYLM8bbyHvgQqMW6ChK9EyHXH_pZagMMzFdCO6Ikuq7K2DA",
        stateKey: "lounge_os_data",
        adminPasscode: "admin716", // Master Admin PIN
        pollIntervalMs: 6000,
        debounceSaveMs: 400
    };

    const TENANT_STORAGE_KEY = "716QX_ACTIVE_TENANT";
    let currentTenant = null;
    let saveTimeout = null;
    let isSaving = false;
    let pendingSave = false;
    let pendingData = null;
    let lastCloudTimestamp = 0;
    let isInitialized = false;

    // Execute query via Turso HTTP Pipeline
    async function executeQuery(sql, args = []) {
        const stmt = { sql };
        if (args && args.length > 0) {
            stmt.args = args.map(arg => {
                if (arg === null || arg === undefined) return { type: "null" };
                if (typeof arg === "number") {
                    return Number.isInteger(arg) ? { type: "integer", value: String(arg) } : { type: "float", value: arg };
                }
                if (typeof arg === "boolean") return { type: "integer", value: arg ? "1" : "0" };
                return { type: "text", value: String(arg) };
            });
        }

        const response = await fetch(CONFIG.url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${CONFIG.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                requests: [
                    { type: "execute", stmt: stmt }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const data = await response.json();
        const resultItem = data.results && data.results[0];
        if (resultItem && resultItem.type === "error") {
            throw new Error(resultItem.error && resultItem.error.message || "Query execution failed");
        }

        return resultItem && resultItem.response && resultItem.response.result;
    }

    // Ensure database tables exist
    async function ensureSchema() {
        try {
            await executeQuery("CREATE TABLE IF NOT EXISTS shops (id TEXT PRIMARY KEY, name TEXT NOT NULL, passcode TEXT NOT NULL, status TEXT DEFAULT 'active', created_at INTEGER, updated_at INTEGER);");
            await executeQuery("CREATE TABLE IF NOT EXISTS app_state (tenant_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT, updated_at INTEGER, PRIMARY KEY (tenant_id, key));");
            await executeQuery("CREATE TABLE IF NOT EXISTS invoices (id TEXT NOT NULL, tenant_id TEXT NOT NULL, table_name TEXT, customer TEXT, subtotal REAL, early_paid REAL, discount REAL, final_total REAL, paid REAL, debt REAL, items TEXT, date TEXT, timestamp INTEGER, PRIMARY KEY (tenant_id, id));");
            await executeQuery("CREATE TABLE IF NOT EXISTS activity_log (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT NOT NULL, action TEXT NOT NULL, detail TEXT, created_at INTEGER);");
        } catch(e) {
            console.warn("Schema initialization check:", e);
        }
    }

    // Update the UI connection status badge
    function updateStatusUI(status, message) {
        const dot = document.getElementById('cloud-status-dot');
        const text = document.getElementById('cloud-status-text');
        const icon = document.getElementById('cloud-sync-icon');

        if (!dot || !text) return;

        if (status === 'connected') {
            dot.className = 'w-2.5 h-2.5 rounded-full bg-emeraldGlow shadow-[0_0_8px_rgba(34,197,94,0.7)]';
            text.innerText = message || 'متصل بالسحابة';
            text.className = 'hidden sm:inline text-emeraldGlow font-bold text-[11px]';
            if (icon) icon.classList.remove('animate-spin');
        } else if (status === 'syncing') {
            dot.className = 'w-2.5 h-2.5 rounded-full bg-cyanGlow animate-ping';
            text.innerText = message || 'جاري المزامنة...';
            text.className = 'hidden sm:inline text-cyanGlow font-bold text-[11px]';
            if (icon) icon.classList.add('animate-spin');
        } else if (status === 'saving') {
            dot.className = 'w-2.5 h-2.5 rounded-full bg-violetApex animate-pulse';
            text.innerText = message || 'جاري الحفظ بالسحابة...';
            text.className = 'hidden sm:inline text-violetApex font-bold text-[11px]';
            if (icon) icon.classList.add('animate-spin');
        } else if (status === 'error') {
            dot.className = 'w-2.5 h-2.5 rounded-full bg-roseAlert shadow-[0_0_8px_rgba(244,63,94,0.7)]';
            text.innerText = message || 'غير متصل (محلي)';
            text.className = 'hidden sm:inline text-roseAlert font-bold text-[11px]';
            if (icon) icon.classList.remove('animate-spin');
        }
    }

    // Update active shop information in top navbar & drawer
    function updateShopHeaderUI() {
        const nameEl = document.getElementById('header-shop-name');
        const codeEl = document.getElementById('header-shop-code');
        const drawerName = document.getElementById('drawer-shop-name');
        const drawerCode = document.getElementById('drawer-shop-code');

        if (currentTenant) {
            if (nameEl) nameEl.innerText = currentTenant.name || 'الصالة الحالية';
            if (codeEl) codeEl.innerText = `ID: ${currentTenant.id}`;
            if (drawerName) drawerName.innerText = currentTenant.name || 'الصالة الحالية';
            if (drawerCode) drawerCode.innerText = `رمز الصالة: ${currentTenant.id}`;
        }
    }

    // Load active tenant from localStorage
    function loadSavedTenant() {
        try {
            const raw = localStorage.getItem(TENANT_STORAGE_KEY);
            if (raw) {
                currentTenant = JSON.parse(raw);
                return currentTenant;
            }
        } catch(e) {
            console.error("Error reading saved tenant:", e);
        }
        return null;
    }

    // Save active tenant to localStorage
    function saveActiveTenant(tenant) {
        currentTenant = tenant;
        if (tenant) {
            localStorage.setItem(TENANT_STORAGE_KEY, JSON.stringify(tenant));
        } else {
            localStorage.removeItem(TENANT_STORAGE_KEY);
        }
        updateShopHeaderUI();
    }

    // Check if shop is blocked or active on cloud
    async function verifyShopStatus(tenantId) {
        try {
            const res = await executeQuery("SELECT id, name, status FROM shops WHERE id = ? LIMIT 1;", [tenantId]);
            if (res && res.rows && res.rows.length > 0) {
                const status = res.rows[0][2]?.value;
                const name = res.rows[0][1]?.value;
                if (currentTenant && currentTenant.id === tenantId) {
                    currentTenant.status = status;
                    currentTenant.name = name;
                    saveActiveTenant(currentTenant);
                }
                return { exists: true, status, name };
            }
            return { exists: false };
        } catch(e) {
            console.warn("Verify shop status failed:", e);
            return { exists: true, status: currentTenant ? currentTenant.status : 'active' };
        }
    }

    // Load cloud state for current tenant
    async function loadCloudState() {
        if (!currentTenant) return null;
        try {
            updateStatusUI('syncing', 'جاري جلب بيانات الصالة...');
            const result = await executeQuery(
                "SELECT value, updated_at FROM app_state WHERE tenant_id = ? AND key = ? LIMIT 1;",
                [currentTenant.id, CONFIG.stateKey]
            );

            if (result && result.rows && result.rows.length > 0) {
                const row = result.rows[0];
                const valueJson = row[0]?.value;
                const updatedAt = parseInt(row[1]?.value) || 0;

                if (valueJson) {
                    const cloudDb = JSON.parse(valueJson);
                    lastCloudTimestamp = updatedAt;
                    updateStatusUI('connected', 'متصل بالسحابة ✓');
                    return cloudDb;
                }
            }

            // Cloud is empty for this tenant
            updateStatusUI('connected', 'متصل بالسحابة (جاهز) ✓');
            return null;
        } catch (err) {
            console.error("Cloud DB Load Error:", err);
            updateStatusUI('error', 'غير متصل بالسحابة');
            return null;
        }
    }

    // Push cloud state for current tenant
    async function pushCloudState(stateData) {
        if (!currentTenant || !stateData) return;

        if (isSaving) {
            pendingSave = true;
            pendingData = stateData;
            return;
        }

        isSaving = true;
        updateStatusUI('saving', 'جاري الحفظ بالسحابة...');

        try {
            const nowSec = Math.floor(Date.now() / 1000);
            const jsonStr = JSON.stringify(stateData);

            await executeQuery(
                `INSERT INTO app_state (tenant_id, key, value, updated_at) VALUES (?, ?, ?, ?)
                 ON CONFLICT(tenant_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
                [currentTenant.id, CONFIG.stateKey, jsonStr, nowSec]
            );

            lastCloudTimestamp = nowSec;
            updateStatusUI('connected', 'تم الحفظ بالسحابة ✓');
        } catch (err) {
            console.error("Cloud DB Push Error:", err);
            updateStatusUI('error', 'فشل الحفظ بالسحابة');
        } finally {
            isSaving = false;
            if (pendingSave) {
                pendingSave = false;
                const nextData = pendingData;
                pendingData = null;
                pushCloudState(nextData);
            }
        }
    }

    // Save invoice to SQL table with tenant_id
    async function recordInvoiceSQL(inv) {
        if (!currentTenant || !inv) return;
        try {
            const nowSec = Math.floor(Date.now() / 1000);
            await executeQuery(
                `INSERT INTO invoices (id, tenant_id, table_name, customer, subtotal, early_paid, discount, final_total, paid, debt, items, date, timestamp)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                 ON CONFLICT(tenant_id, id) DO NOTHING;`,
                [
                    inv.id || '',
                    currentTenant.id,
                    inv.tableName || '',
                    inv.customer || 'زبون عام',
                    inv.subtotal || 0,
                    inv.earlyPaid || 0,
                    inv.discount || 0,
                    inv.finalTotal || 0,
                    inv.paid || 0,
                    inv.debt || 0,
                    JSON.stringify(inv.items || []),
                    inv.date || '',
                    nowSec
                ]
            );
        } catch (err) {
            console.error("Record invoice SQL error:", err);
        }
    }

    // Check for updates or blocked status
    async function checkCloudUpdates() {
        if (!currentTenant || isSaving || pendingSave) return;
        try {
            // 1. Check shop status (in case admin blocked the lounge)
            const shopCheck = await verifyShopStatus(currentTenant.id);
            if (shopCheck.status === 'blocked') {
                window.CloudDB.showBlockedScreen(shopCheck.name);
                return;
            }

            // 2. Check data updates
            const result = await executeQuery(
                "SELECT updated_at FROM app_state WHERE tenant_id = ? AND key = ? LIMIT 1;",
                [currentTenant.id, CONFIG.stateKey]
            );
            if (result && result.rows && result.rows.length > 0) {
                const cloudTimestamp = parseInt(result.rows[0][0]?.value) || 0;
                if (cloudTimestamp > lastCloudTimestamp) {
                    const freshData = await loadCloudState();
                    if (freshData && window.applyCloudUpdate) {
                        window.applyCloudUpdate(freshData);
                    }
                } else {
                    updateStatusUI('connected', 'متصل بالسحابة ✓');
                }
            }
        } catch (err) {
            updateStatusUI('error', 'غير متصل بالسحابة');
        }
    }

    // Log system & tenant activity
    async function logActivity(action, detail, tenantId) {
        try {
            const tId = tenantId || (currentTenant ? currentTenant.id : 'system');
            const nowSec = Math.floor(Date.now() / 1000);
            await executeQuery(
                "INSERT INTO activity_log (tenant_id, action, detail, created_at) VALUES (?, ?, ?, ?);",
                [tId, action || 'عملية', detail || '', nowSec]
            );
        } catch(e) {
            console.warn("Log activity error:", e);
        }
    }

    // Migrate old localStorage data for this tenant (one-time)
    async function migrateOldLocalStorage(tenantId, currentDb) {
        const migrationKey = `716QX_MIGRATED_${tenantId}`;
        if (localStorage.getItem(migrationKey)) {
            return false; // Already migrated
        }

        try {
            const oldRaw = localStorage.getItem("RESPAWN_OS_DB_3.5");
            if (oldRaw) {
                const oldData = JSON.parse(oldRaw);
                if (oldData && (oldData.menu || Object.keys(oldData.tables || {}).length > 0 || (oldData.invoices && oldData.invoices.length > 0))) {
                    console.log(`[Migration] Migrating old localStorage data to Turso for tenant ${tenantId}...`);
                    await pushCloudState(oldData);

                    // Migrate invoices
                    if (Array.isArray(oldData.invoices)) {
                        for (const inv of oldData.invoices) {
                            await recordInvoiceSQL(inv);
                        }
                    }

                    localStorage.setItem(migrationKey, "true");
                    if (window.showToast) window.showToast('تم ترحيل بيانات الصالة السابقة إلى السحابة بنجاح ✓', 'success');
                    return oldData;
                }
            }
        } catch (e) {
            console.error("Migration error:", e);
        }

        localStorage.setItem(migrationKey, "true");
        return null;
    }

    // Exposed CloudDB API
    window.CloudDB = {
        config: CONFIG,
        getCurrentTenant: () => currentTenant,

        // Initialize connection and check auth
        init: async function(onLoaded) {
            if (isInitialized) return;
            isInitialized = true;

            await ensureSchema();
            loadSavedTenant();
            updateShopHeaderUI();

            if (!currentTenant) {
                // Not logged in -> Show Login Page
                window.CloudDB.showLoginModal();
                return;
            }

            // Verify if subscription is active
            const statusCheck = await verifyShopStatus(currentTenant.id);
            if (!statusCheck.exists) {
                saveActiveTenant(null);
                window.CloudDB.showLoginModal('رمز الصالة المحفوظ لم يعد موجوداً');
                return;
            }

            if (statusCheck.status === 'blocked') {
                window.CloudDB.showBlockedScreen(statusCheck.name || currentTenant.name);
                return;
            }

            // Check one-time migration of previous local data
            const migratedData = await migrateOldLocalStorage(currentTenant.id);
            if (migratedData && typeof onLoaded === 'function') {
                onLoaded(migratedData);
            } else {
                const cloudData = await loadCloudState();
                if (cloudData && typeof onLoaded === 'function') {
                    onLoaded(cloudData);
                } else if (!cloudData) {
                    if (window.getAppDbState) {
                        pushCloudState(window.getAppDbState());
                    }
                }
            }

            setInterval(checkCloudUpdates, CONFIG.pollIntervalMs);
            window.addEventListener('focus', checkCloudUpdates);
            document.addEventListener('visibilitychange', function() {
                if (!document.hidden) checkCloudUpdates();
            });
        },

        // Shop Login
        loginShop: async function(tenantId, passcode) {
            const cleanId = (tenantId || '').trim().toLowerCase();
            const cleanPass = (passcode || '').trim();

            if (!cleanId || !cleanPass) {
                throw new Error('يرجى إدخال رمز الصالة ورمز الدخول');
            }

            updateStatusUI('syncing', 'جاري التحقق من الصالة...');
            const res = await executeQuery("SELECT id, name, passcode, status FROM shops WHERE id = ? LIMIT 1;", [cleanId]);

            if (!res || !res.rows || res.rows.length === 0) {
                throw new Error('رمز الصالة غير موجود. تأكد من صحة الرمز أو راجع إدارة النظام');
            }

            const row = res.rows[0];
            const dbPass = row[2]?.value;
            const status = row[3]?.value;
            const name = row[1]?.value;

            if (dbPass !== cleanPass) {
                throw new Error('رمز الدخول غير صحيح');
            }

            if (status === 'blocked') {
                throw { isBlocked: true, name: name, message: 'تم تجميد اشتراك هذه الصالة. يرجى التواصل مع الإدارة' };
            }

            const tenantObj = { id: cleanId, name: name, passcode: cleanPass, status: status };
            saveActiveTenant(tenantObj);

            // Log activity
            logActivity('دخول صالة', `تسجيل الدخول إلى صالة ${name} (${cleanId})`, cleanId);

            // Hide login modal
            window.CloudDB.hideLoginModal();
            window.CloudDB.hideBlockedScreen();

            // Run migration if any, then load data
            const migrated = await migrateOldLocalStorage(cleanId);
            if (migrated && window.applyCloudUpdate) {
                window.applyCloudUpdate(migrated);
            } else {
                const data = await loadCloudState();
                if (data && window.applyCloudUpdate) {
                    window.applyCloudUpdate(data);
                } else if (window.getAppDbState) {
                    pushCloudState(window.getAppDbState());
                }
            }

            if (window.showToast) window.showToast(`مرحباً بك! تم تسجيل الدخول إلى (${name})`, 'success');
            return tenantObj;
        },

        // Logout / Switch Shop (direct action, confirmation handled by custom modal)
        logoutShop: function() {
            if (currentTenant) {
                logActivity('تسجيل خروج', `تسجيل الخروج من صالة ${currentTenant.name} (${currentTenant.id})`, currentTenant.id);
            }
            saveActiveTenant(null);
            location.reload();
        },

        // Save State
        save: function(stateData, immediate = false) {
            if (!currentTenant || !stateData) return;
            if (immediate) {
                if (saveTimeout) clearTimeout(saveTimeout);
                pushCloudState(stateData);
                return;
            }

            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                pushCloudState(stateData);
            }, CONFIG.debounceSaveMs);
        },

        // Record Invoice
        saveInvoice: function(inv) {
            recordInvoiceSQL(inv);
        },

        // Manual Sync
        manualSync: async function() {
            if (!currentTenant) return;
            if (window.AudioEngine && window.AudioEngine.play) window.AudioEngine.play('click');
            updateStatusUI('syncing', 'جاري المزامنة...');
            try {
                const cloudData = await loadCloudState();
                if (cloudData && window.applyCloudUpdate) {
                    window.applyCloudUpdate(cloudData);
                    if (window.showToast) window.showToast('تمت المزامنة مع السحابة بنجاح', 'success');
                } else {
                    if (window.getAppDbState) {
                        await pushCloudState(window.getAppDbState());
                        if (window.showToast) window.showToast('تم رفع البيانات الحالية إلى السحابة بنجاح', 'success');
                    }
                }
            } catch(e) {
                if (window.showToast) window.showToast('تعذر الاتصال بالسحابة', 'error');
            }
        },

        // UI Helpers for Login & Blocked screens
        showLoginModal: function(errMsg) {
            const m = document.getElementById('modal-shop-login');
            if (m) {
                m.classList.remove('hidden');
                if (errMsg) {
                    const eEl = document.getElementById('login-err-msg');
                    if (eEl) { eEl.innerText = errMsg; eEl.classList.remove('hidden'); }
                }
            }
        },

        hideLoginModal: function() {
            const m = document.getElementById('modal-shop-login');
            if (m) m.classList.add('hidden');
        },

        showBlockedScreen: function(shopName) {
            const b = document.getElementById('overlay-shop-blocked');
            const n = document.getElementById('blocked-shop-name');
            if (b) {
                if (n) n.innerText = shopName || (currentTenant ? currentTenant.name : 'هذه الصالة');
                b.classList.remove('hidden');
            }
        },

        hideBlockedScreen: function() {
            const b = document.getElementById('overlay-shop-blocked');
            if (b) b.classList.add('hidden');
        },

        logActivity: function(action, detail, tenantId) {
            return logActivity(action, detail, tenantId);
        },

        // --- Central Admin Dashboard API ---
        adminAuth: function(inputPin) {
            return (inputPin || '').trim() === CONFIG.adminPasscode;
        },

        adminGetShops: async function() {
            const res = await executeQuery("SELECT id, name, passcode, status, created_at FROM shops ORDER BY created_at DESC;");
            if (res && res.rows) {
                return res.rows.map(r => ({
                    id: r[0]?.value,
                    name: r[1]?.value,
                    passcode: r[2]?.value,
                    status: r[3]?.value || 'active',
                    createdAt: r[4]?.value ? new Date(parseInt(r[4].value) * 1000).toLocaleDateString('ar-IQ') : '-'
                }));
            }
            return [];
        },

        adminCreateShop: async function(id, name, passcode) {
            const cleanId = (id || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
            const cleanName = (name || '').trim();
            const cleanPass = (passcode || '').trim();

            if (!cleanId || !cleanName || !cleanPass) {
                throw new Error('يرجى ملء جميع الحقول المطلوبة بدقة');
            }

            const nowSec = Math.floor(Date.now() / 1000);
            await executeQuery(
                `INSERT INTO shops (id, name, passcode, status, created_at, updated_at)
                 VALUES (?, ?, ?, 'active', ?, ?);`,
                [cleanId, cleanName, cleanPass, nowSec, nowSec]
            );

            await logActivity('إنشاء صالة جديدة', `تمت إضافة صالة: ${cleanName} (رمز: ${cleanId})`, cleanId);
            return { id: cleanId, name: cleanName, passcode: cleanPass, status: 'active' };
        },

        adminToggleShopStatus: async function(id, newStatus) {
            const nowSec = Math.floor(Date.now() / 1000);
            await executeQuery("UPDATE shops SET status = ?, updated_at = ? WHERE id = ?;", [newStatus, nowSec, id]);

            const statusText = newStatus === 'blocked' ? 'تجميد الاشتراك' : 'تفعيل الاشتراك';
            await logActivity('تغيير حالة الصالة', `تم ${statusText} للصالة (${id})`, id);

            // If toggling currently active shop, reflect immediately
            if (currentTenant && currentTenant.id === id) {
                currentTenant.status = newStatus;
                saveActiveTenant(currentTenant);
                if (newStatus === 'blocked') {
                    window.CloudDB.showBlockedScreen(currentTenant.name);
                } else {
                    window.CloudDB.hideBlockedScreen();
                }
            }
        },

        adminDeleteShop: async function(id) {
            await executeQuery("DELETE FROM shops WHERE id = ?;", [id]);
            await executeQuery("DELETE FROM app_state WHERE tenant_id = ?;", [id]);
            await executeQuery("DELETE FROM invoices WHERE tenant_id = ?;", [id]);

            await logActivity('حذف صالة', `تم حذف الصالة (${id}) وجميع بياناتها وفواتيرها نهائياً`, id);

            if (currentTenant && currentTenant.id === id) {
                saveActiveTenant(null);
                location.reload();
            }
        },

        adminSwitchToShop: async function(id) {
            const res = await executeQuery("SELECT id, name, passcode, status FROM shops WHERE id = ? LIMIT 1;", [id]);
            if (res && res.rows && res.rows.length > 0) {
                const row = res.rows[0];
                const tenantObj = {
                    id: row[0]?.value,
                    name: row[1]?.value,
                    passcode: row[2]?.value,
                    status: row[3]?.value || 'active'
                };
                saveActiveTenant(tenantObj);
                await logActivity('انتقال الأدمن', `انتقل الأدمن مباشرة إلى صالة: ${tenantObj.name} (${tenantObj.id})`, tenantObj.id);
                return tenantObj;
            }
            throw new Error('الصالة غير موجودة في قاعدة البيانات');
        },

        adminGetActivityLogs: async function(tenantFilter = 'all', limit = 100) {
            let sql = "SELECT id, tenant_id, action, detail, created_at FROM activity_log ";
            let args = [];
            if (tenantFilter && tenantFilter !== 'all') {
                sql += "WHERE tenant_id = ? ";
                args.push(tenantFilter);
            }
            sql += "ORDER BY created_at DESC, id DESC LIMIT ?;";
            args.push(limit);

            const res = await executeQuery(sql, args);
            if (res && res.rows) {
                return res.rows.map(r => {
                    const sec = parseInt(r[4]?.value) || 0;
                    return {
                        id: r[0]?.value,
                        tenantId: r[1]?.value,
                        action: r[2]?.value,
                        detail: r[3]?.value,
                        createdAt: sec ? new Date(sec * 1000).toLocaleString('ar-IQ') : '-'
                    };
                });
            }
            return [];
        },

        adminClearActivityLogs: async function() {
            await executeQuery("DELETE FROM activity_log;");
        }
    };
})();
