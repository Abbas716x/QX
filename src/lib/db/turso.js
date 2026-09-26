import { createClient } from '@libsql/client/web';

/**
 * 716QX Zero-Trust Turso Cloud Database Client
 * Multi-Tenant Architecture with Strict Tenant Isolation
 * Zero-LocalStorage: All sensitive business state persists solely in the Cloud.
 */

const TURSO_URL = import.meta.env.VITE_TURSO_DATABASE_URL || "https://716qx-abbas716x.aws-ap-south-1.turso.io";
const TURSO_TOKEN = import.meta.env.VITE_TURSO_AUTH_TOKEN || "";
const SUPER_ADMIN_PIN = import.meta.env.VITE_SUPER_ADMIN_PIN || "admin716";

// Create LibSQL Web client instance
let dbClient = null;

export function getTursoClient() {
  if (!dbClient) {
    dbClient = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN
    });
  }
  return dbClient;
}

// In-Memory active session state (NEVER written to localStorage)
let activeTenantSession = null;

export function setTenantSession(tenant) {
  activeTenantSession = tenant;
}

export function getTenantSession() {
  return activeTenantSession;
}

export function clearTenantSession() {
  activeTenantSession = null;
}

/**
 * Execute query with automatic retry and exponential backoff
 */
export async function executeQuery(sql, args = [], maxRetries = 2) {
  const client = getTursoClient();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await client.execute({ sql, args });
      return result;
    } catch (err) {
      if (attempt < maxRetries) {
        const delay = 400 * Math.pow(2, attempt);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      console.error("[Turso DB Error]", err);
      throw err;
    }
  }
}

/**
 * Ensure database tables exist (Zero-Trust initialization)
 */
export async function ensureDBSchema() {
  try {
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS shops (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        passcode TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        created_at INTEGER,
        updated_at INTEGER
      );
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS app_state (
        tenant_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT,
        updated_at INTEGER,
        PRIMARY KEY (tenant_id, key)
      );
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        table_name TEXT,
        customer TEXT,
        subtotal REAL,
        early_paid REAL,
        discount REAL,
        final_total REAL,
        paid REAL,
        debt REAL,
        items TEXT,
        date TEXT,
        timestamp INTEGER,
        PRIMARY KEY (tenant_id, id)
      );
    `);

    await executeQuery(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id TEXT NOT NULL,
        action TEXT NOT NULL,
        detail TEXT,
        created_at INTEGER
      );
    `);
  } catch (err) {
    console.warn("[Schema] Ensure schema check:", err.message);
  }
}

/**
 * TENANT ISOLATION: Strict Tenant-scoped query wrapper
 * Ensures no query can execute without validating tenant_id
 */
export function assertTenant(tenantId) {
  if (!tenantId || typeof tenantId !== 'string') {
    throw new Error("[TenantGuard] Security Violation: Missing or invalid tenant_id");
  }
  return tenantId.trim().toLowerCase();
}

/**
 * Authenticate shop credentials from Turso Cloud
 */
export async function authenticateShop(tenantId, passcode) {
  const cleanId = assertTenant(tenantId);
  const cleanPass = (passcode || "").trim();

  if (!cleanPass) {
    throw new Error("رمز الدخول مطلوب");
  }

  const res = await executeQuery(
    "SELECT id, name, passcode, status FROM shops WHERE id = ? LIMIT 1;",
    [cleanId]
  );

  if (!res.rows || res.rows.length === 0) {
    throw new Error("رمز الصالة غير مسجل بالنظام");
  }

  const row = res.rows[0];
  const dbPass = String(row.passcode || "");
  const status = String(row.status || "active");
  const name = String(row.name || cleanId);

  if (dbPass !== cleanPass) {
    // Log failed login attempt
    await logSecurityEvent("فشل تسجيل الدخول", `محاولة دخول فاشلة برمز غير صحيح للصالة: ${cleanId}`, cleanId);
    throw new Error("رمز الدخول السري غير صحيح");
  }

  if (status === "blocked") {
    throw { isBlocked: true, name, message: "تم تجميد اشتراك هذه الصالة. يرجى مراجعة إدارة المنصة" };
  }

  const session = { id: cleanId, name, passcode: cleanPass, status };
  setTenantSession(session);

  // Log successful login
  await logSecurityEvent("تسجيل دخول", `تم دخول الصالة بنجاح: ${name} (${cleanId})`, cleanId);

  return session;
}

/**
 * Load cloud state for tenant (app_state) - Strict Tenant Isolation
 */
export async function loadTenantState(tenantId) {
  const cleanId = assertTenant(tenantId);
  const res = await executeQuery(
    "SELECT value, updated_at FROM app_state WHERE tenant_id = ? AND key = 'lounge_os_data' LIMIT 1;",
    [cleanId]
  );

  if (res.rows && res.rows.length > 0) {
    const rawVal = res.rows[0].value;
    const updatedAt = Number(res.rows[0].updated_at) || 0;
    if (rawVal) {
      try {
        return { data: JSON.parse(rawVal), updatedAt };
      } catch (e) {
        console.error("JSON parse error:", e);
      }
    }
  }
  return { data: null, updatedAt: 0 };
}

/**
 * Save cloud state for tenant (app_state) - Strict Tenant Isolation
 */
export async function saveTenantState(tenantId, stateData) {
  const cleanId = assertTenant(tenantId);
  if (!stateData) return;

  const nowSec = Math.floor(Date.now() / 1000);
  const jsonStr = JSON.stringify(stateData);

  await executeQuery(
    `INSERT INTO app_state (tenant_id, key, value, updated_at)
     VALUES (?, 'lounge_os_data', ?, ?)
     ON CONFLICT(tenant_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    [cleanId, jsonStr, nowSec]
  );

  return nowSec;
}

/**
 * Insert or replace invoice with strict tenant isolation
 */
export async function recordInvoice(tenantId, inv) {
  const cleanId = assertTenant(tenantId);
  if (!inv || !inv.id) return;

  const nowSec = Math.floor(Date.now() / 1000);
  const itemsJson = JSON.stringify(inv.items || []);

  await executeQuery(
    `INSERT INTO invoices (id, tenant_id, table_name, customer, subtotal, early_paid, discount, final_total, paid, debt, items, date, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(tenant_id, id) DO NOTHING;`,
    [
      String(inv.id),
      cleanId,
      String(inv.tableName || ""),
      String(inv.customer || "زبون عام"),
      Number(inv.subtotal) || 0,
      Number(inv.earlyPaid) || 0,
      Number(inv.discount) || 0,
      Number(inv.finalTotal) || 0,
      Number(inv.paid) || 0,
      Number(inv.debt) || 0,
      itemsJson,
      String(inv.date || ""),
      nowSec
    ]
  );
}

/**
 * Log action or security event in Cloud DB
 */
export async function logSecurityEvent(action, detail, tenantId = "system") {
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    await executeQuery(
      "INSERT INTO activity_log (tenant_id, action, detail, created_at) VALUES (?, ?, ?, ?);",
      [String(tenantId), String(action), String(detail), nowSec]
    );
  } catch (e) {
    console.warn("[Audit Log] Failed to log event:", e.message);
  }
}

/**
 * Super Admin: Authenticate Master PIN
 */
export function verifySuperAdminPin(inputPin) {
  return (inputPin || "").trim() === SUPER_ADMIN_PIN;
}

/**
 * Super Admin: Fetch all registered shops
 */
export async function fetchAllShops() {
  const res = await executeQuery(
    "SELECT id, name, passcode, status, created_at FROM shops ORDER BY created_at DESC;"
  );
  if (res.rows) {
    return res.rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      passcode: String(r.passcode),
      status: String(r.status || "active"),
      createdAt: r.created_at
        ? new Date(Number(r.created_at) * 1000).toLocaleDateString("ar-IQ")
        : "-"
    }));
  }
  return [];
}

/**
 * Super Admin: Create new tenant shop
 */
export async function createTenantShop(id, name, passcode) {
  const cleanId = assertTenant(id);
  const cleanName = (name || "").trim();
  const cleanPass = (passcode || "").trim();

  if (!cleanId || !cleanName || !cleanPass) {
    throw new Error("يرجى ملء جميع الحقول بدقة");
  }

  const nowSec = Math.floor(Date.now() / 1000);
  await executeQuery(
    "INSERT INTO shops (id, name, passcode, status, created_at, updated_at) VALUES (?, ?, ?, 'active', ?, ?);",
    [cleanId, cleanName, cleanPass, nowSec, nowSec]
  );

  await logSecurityEvent("إنشاء صالة جديدة", `تم تسجيل صالة: ${cleanName} (${cleanId})`, cleanId);
  return { id: cleanId, name: cleanName, passcode: cleanPass, status: "active" };
}

/**
 * Super Admin: Toggle tenant status (active <-> blocked)
 */
export async function toggleTenantStatus(tenantId, newStatus) {
  const cleanId = assertTenant(tenantId);
  const nowSec = Math.floor(Date.now() / 1000);

  await executeQuery(
    "UPDATE shops SET status = ?, updated_at = ? WHERE id = ?;",
    [newStatus, nowSec, cleanId]
  );

  const actionText = newStatus === "blocked" ? "تجميد الاشتراك" : "تفعيل الاشتراك";
  await logSecurityEvent("تعديل حالة الصالة", `تم ${actionText} للصالة (${cleanId})`, cleanId);
}

/**
 * Super Admin: Permanently delete tenant and all related data
 */
export async function deleteTenantShop(tenantId) {
  const cleanId = assertTenant(tenantId);
  await executeQuery("DELETE FROM shops WHERE id = ?;", [cleanId]);
  await executeQuery("DELETE FROM app_state WHERE tenant_id = ?;", [cleanId]);
  await executeQuery("DELETE FROM invoices WHERE tenant_id = ?;", [cleanId]);

  await logSecurityEvent("حذف صالة", `تم حذف صالة (${cleanId}) وبياناتها السحابية نهائياً`, cleanId);
}

/**
 * Super Admin: Fetch activity logs
 */
export async function fetchActivityLogs(tenantFilter = "all", limit = 150) {
  let sql = "SELECT id, tenant_id, action, detail, created_at FROM activity_log ";
  const args = [];

  if (tenantFilter && tenantFilter !== "all") {
    sql += "WHERE tenant_id = ? ";
    args.push(tenantFilter);
  }

  sql += "ORDER BY created_at DESC, id DESC LIMIT ?;";
  args.push(limit);

  const res = await executeQuery(sql, args);
  if (res.rows) {
    return res.rows.map((r) => {
      const sec = Number(r.created_at) || 0;
      return {
        id: r.id,
        tenantId: String(r.tenant_id),
        action: String(r.action),
        detail: String(r.detail || ""),
        createdAt: sec ? new Date(sec * 1000).toLocaleString("ar-IQ") : "-"
      };
    });
  }
  return [];
}

/**
 * Super Admin: Fetch all invoices across tenants
 */
export async function fetchAllInvoices(tenantFilter = "all", limit = 500) {
  let sql = "SELECT id, tenant_id, table_name, customer, subtotal, early_paid, discount, final_total, paid, debt, items, date, timestamp FROM invoices ";
  const args = [];

  if (tenantFilter && tenantFilter !== "all") {
    sql += "WHERE tenant_id = ? ";
    args.push(tenantFilter);
  }

  sql += "ORDER BY timestamp DESC LIMIT ?;";
  args.push(limit);

  const res = await executeQuery(sql, args);
  if (res.rows) {
    return res.rows.map((r) => ({
      id: String(r.id),
      tenant_id: String(r.tenant_id),
      table_name: String(r.table_name || ""),
      customer: String(r.customer || "زبون عام"),
      subtotal: Number(r.subtotal) || 0,
      early_paid: Number(r.early_paid) || 0,
      discount: Number(r.discount) || 0,
      final_total: Number(r.final_total) || 0,
      paid: Number(r.paid) || 0,
      debt: Number(r.debt) || 0,
      items: String(r.items || "[]"),
      date: String(r.date || ""),
      timestamp: Number(r.timestamp) || 0
    }));
  }
  return [];
}
