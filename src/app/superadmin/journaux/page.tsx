import { listAuditLogs, listAuditActions, AuditLogView } from "@/modules/superadmin";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

const PAGE = 100;

export default async function SuperadminLogsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const page = Math.max(0, Number(str(sp.page) ?? "0") || 0);
  const filters = {
    action: str(sp.action),
    text: str(sp.text),
    from: str(sp.from),
    to: str(sp.to),
  };

  const [result, actions] = await Promise.all([
    listAuditLogs({ ...filters, take: PAGE, skip: page * PAGE }),
    listAuditActions(),
  ]);

  return <AuditLogView result={result} actions={actions} filters={filters} page={page} />;
}
