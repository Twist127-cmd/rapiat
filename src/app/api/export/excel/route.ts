import ExcelJS from "exceljs";
import type { NextRequest } from "next/server";

import { getUserContext } from "@/server/data-access";
import { getExportBundle } from "@/modules/reports/services/reports.service";
import { formatMonthLabel, formatShortDateInTz } from "@/lib/dates";
import { fromCents } from "@/lib/money";
import { TRANSACTION_TYPE_LABELS, EXPENSE_KIND_LABELS } from "@/config/constants";

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

  const wb = new ExcelJS.Workbook();
  wb.creator = "Rapiat";
  wb.created = monthDate;

  // --- Summary sheet ---
  const summarySheet = wb.addWorksheet("Synthèse");
  summarySheet.columns = [
    { header: "Indicateur", key: "k", width: 28 },
    { header: "Montant", key: "v", width: 18 },
  ];
  summarySheet.addRows([
    { k: "Mois", v: formatMonthLabel(monthDate) },
    { k: "Revenus", v: fromCents(summary.incomeCents) },
    { k: "Dépenses fixes", v: fromCents(summary.fixedExpenseCents) },
    { k: "Dépenses variables", v: fromCents(summary.variableExpenseCents) },
    { k: "Dépenses totales", v: fromCents(summary.totalExpenseCents) },
    { k: "Solde net", v: fromCents(summary.netCents) },
    { k: "Taux d'épargne (%)", v: summary.savingsRatePercent },
  ]);
  summarySheet.getRow(1).font = { bold: true };

  // --- Categories sheet ---
  const catSheet = wb.addWorksheet("Par catégorie");
  catSheet.columns = [
    { header: "Catégorie", key: "name", width: 28 },
    { header: `Montant (${currency})`, key: "amount", width: 18 },
  ];
  catSheet.getRow(1).font = { bold: true };
  for (const c of categories) {
    catSheet.addRow({ name: c.name, amount: fromCents(c.amountCents) });
  }

  // --- Transactions sheet ---
  const txSheet = wb.addWorksheet("Transactions");
  txSheet.columns = [
    { header: "Date", key: "date", width: 14 },
    { header: "Type", key: "type", width: 12 },
    { header: "Compte", key: "account", width: 20 },
    { header: "Catégorie", key: "category", width: 20 },
    { header: "Nature", key: "kind", width: 12 },
    { header: `Montant (${currency})`, key: "amount", width: 16 },
    { header: "Note", key: "note", width: 30 },
    { header: "Tags", key: "tags", width: 20 },
  ];
  txSheet.getRow(1).font = { bold: true };
  for (const t of transactions) {
    txSheet.addRow({
      date: formatShortDateInTz(t.date, timezone),
      type: TRANSACTION_TYPE_LABELS[t.type as keyof typeof TRANSACTION_TYPE_LABELS],
      account:
        t.type === "TRANSFER"
          ? `${t.account.name} → ${t.transferAccount?.name ?? ""}`
          : t.account.name,
      category: t.category?.name ?? "",
      kind: t.expenseKind
        ? EXPENSE_KIND_LABELS[t.expenseKind as keyof typeof EXPENSE_KIND_LABELS]
        : "",
      amount: fromCents(t.type === "EXPENSE" ? -t.amountCents : t.amountCents),
      note: t.note ?? "",
      tags: t.tags.join(", "),
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const monthParam = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rapiat-${monthParam}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
