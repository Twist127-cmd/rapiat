import { requireSuperAdmin } from "@/server/guards";
import { listUsers, UsersManager } from "@/modules/superadmin";

export const dynamic = "force-dynamic";

export default async function SuperadminUsersPage() {
  const admin = await requireSuperAdmin();
  const users = await listUsers();
  return <UsersManager users={users} currentUserId={admin.id} />;
}
