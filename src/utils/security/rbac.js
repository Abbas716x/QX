/**
 * 716QX Role-Based Access Control (RBAC) System
 * In-Memory session authentication with zero sensitive storage in localStorage.
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'tenant_admin',
  CASHIER: 'cashier',
  GUEST: 'guest'
};

export const PERMISSIONS = {
  // Super Admin permissions
  VIEW_ADMIN_DASHBOARD: 'view_admin_dashboard',
  MANAGE_SHOPS: 'manage_shops',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  CLEAR_AUDIT_LOGS: 'clear_audit_logs',
  AI_ANALYTICS: 'ai_analytics',
  VIEW_GLOBAL_REVENUE: 'view_global_revenue',

  // Tenant / POS permissions
  ACCESS_POS: 'access_pos',
  MANAGE_TABLES: 'manage_tables',
  PROCESS_CHECKOUT: 'process_checkout',
  MANAGE_DEBTS: 'manage_debts',
  EDIT_MENU: 'edit_menu',
  EXPORT_INVOICES: 'export_invoices',
  SWITCH_TENANT: 'switch_tenant'
};

const ROLE_PERMISSIONS_MAP = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.TENANT_ADMIN]: [
    PERMISSIONS.ACCESS_POS,
    PERMISSIONS.MANAGE_TABLES,
    PERMISSIONS.PROCESS_CHECKOUT,
    PERMISSIONS.MANAGE_DEBTS,
    PERMISSIONS.EDIT_MENU,
    PERMISSIONS.EXPORT_INVOICES,
    PERMISSIONS.SWITCH_TENANT
  ],
  [ROLES.CASHIER]: [
    PERMISSIONS.ACCESS_POS,
    PERMISSIONS.MANAGE_TABLES,
    PERMISSIONS.PROCESS_CHECKOUT,
    PERMISSIONS.MANAGE_DEBTS,
    PERMISSIONS.SWITCH_TENANT
  ],
  [ROLES.GUEST]: []
};

// In-Memory Role State
let activeUserRole = ROLES.GUEST;
let activeRoleExpiry = 0;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

export function setUserRole(role) {
  if (Object.values(ROLES).includes(role)) {
    activeUserRole = role;
    activeRoleExpiry = Date.now() + SESSION_TTL_MS;
  }
}

export function getUserRole() {
  if (Date.now() > activeRoleExpiry && activeUserRole !== ROLES.GUEST) {
    activeUserRole = ROLES.GUEST;
  }
  return activeUserRole;
}

export function clearUserRole() {
  activeUserRole = ROLES.GUEST;
  activeRoleExpiry = 0;
}

export function hasPermission(permission) {
  const currentRole = getUserRole();
  const allowed = ROLE_PERMISSIONS_MAP[currentRole] || [];
  return allowed.includes(permission);
}

export function isSuperAdmin() {
  return getUserRole() === ROLES.SUPER_ADMIN;
}
