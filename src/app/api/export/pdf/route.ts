import { renderToBuffer } from "@react-pdf/renderer";
import type { NextRequest } from "next/server";

import { getUserContext } from "@/server/data-access";
import { getExportBundle } from "@/modules/reports/services/reports.service";
import { buildReportDocument, type ReportRow } from "@/modules/reports/pdf/report-document";
import { formatMonthLabel, formatShortDateInTz } from "@/lib/dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseMonth(value: string | null): Date {
  const now = new Date();
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    return new Date(Number(value.slice(0, 4)), Number(value.slice(5, 7)) - 1, 1);
  }
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function GET(request: NextRequest) {
  const ctx = await getUserContext();
  const monthDate = parseMonth(request.nextUrl.searchParams.get("month"));
  const { summary, categories, transactions } = await getExportBundle(ctx, monthDate);
  const { currency, timezone } = ctx;

  const rows: ReportRow[] = transactions.map((t) => ({
    date: formatShortDateInTz(t.date, timezone),
    label:
      t.type === "TRANSFER"
        ? `Transfert → ${t.transferAccount?.name ?? ""}`
        : (t.category?.name ?? t.note ?? "Sans catégorie"),
    account: t.account.name,
    signedCents: t.type === "EXPENSE" ? -t.amountCents : t.amountCents,
  }));

  const doc = buildReportDocument({
    monthLabel: formatMonthLabel(monthDate),
    currency,
    generatedAt: formatShortDateInTz(new Date(), timezone),
    summary,
    categories: categories.map((c) => ({ name: c.name, amountCents: c.amountCents })),
    rows,
  });

  const buffer = await renderToBuffer(doc);
  const monthParam = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="rapiat-${monthParam}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
