export interface AdminStats {
  userCount: number;
  superAdminCount: number;
  accountCount: number;
  transactionCount: number;
  logins24h: number;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  isSuperAdmin: boolean;
  currency: string;
  createdAt: Date;
  accountCount: number;
  transactionCount: number;
  lastLoginAt: Date | null;
}

export interface AdminAuditRow {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  detail: string | null;
  createdAt: Date;
}

export interface AdminAuditResult {
  rows: AdminAuditRow[];
  totalCount: number;
}

export interface AdminUserDetail extends AdminUserRow {
  timezone: string;
  recentLogs: AdminAuditRow[];
}
