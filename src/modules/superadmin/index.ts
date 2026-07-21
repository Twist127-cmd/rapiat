/** Superadmin module public surface (console-only). */
export {
  getStats,
  listUsers,
  getUserDetail,
  listAuditLogs,
  listAuditActions,
} from "./services/superadmin.service";
export { UsersManager } from "./components/UsersManager";
export { AuditLogView } from "./components/AuditLogView";
export { SuperadminNav } from "./components/SuperadminNav";
export type {
  AdminStats,
  AdminUserRow,
  AdminUserDetail,
  AdminAuditRow,
  AdminAuditResult,
} from "./types";
