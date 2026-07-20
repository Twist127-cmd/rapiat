import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import { formatMoney, formatSignedMoney } from "@/lib/money";

export interface ReportRow {
  date: string;
  label: string;
  account: string;
  signedCents: number;
}

export interface ReportData {
  monthLabel: string;
  currency: string;
  generatedAt: string;
  summary: {
    incomeCents: number;
    fixedExpenseCents: number;
    variableExpenseCents: number;
    totalExpenseCents: number;
    netCents: number;
    savingsRatePercent: number;
  };
  categories: { name: string; amountCents: number }[];
  rows: ReportRow[];
}

const NAVY = "#1e2a4a";
const GOLD = "#c9a227";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: "#1f2937", fontFamily: "Helvetica" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    paddingBottom: 8,
    marginBottom: 16,
  },
  brand: { fontSize: 22, fontFamily: "Helvetica-Bold", color: NAVY },
  subtitle: { color: "#6b7280", marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: NAVY,
    marginTop: 16,
    marginBottom: 6,
  },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryTile: {
    width: "31%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
  },
  summaryLabel: { color: "#6b7280", fontSize: 9 },
  summaryValue: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 3, color: NAVY },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingVertical: 4,
  },
  th: { fontFamily: "Helvetica-Bold", color: "#374151" },
  cDate: { width: "16%" },
  cLabel: { width: "40%" },
  cAccount: { width: "26%" },
  cAmount: { width: "18%", textAlign: "right" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 8,
  },
});

export function buildReportDocument(data: ReportData) {
  const { currency, summary } = data;
  return (
    <Document title={`Rapiat — ${data.monthLabel}`} author="Rapiat">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Rapiat</Text>
            <Text style={styles.subtitle}>Rapport financier · {data.monthLabel}</Text>
          </View>
          <Text style={styles.subtitle}>Généré le {data.generatedAt}</Text>
        </View>

        <Text style={styles.sectionTitle}>Synthèse</Text>
        <View style={styles.summaryGrid}>
          <Tile label="Revenus" value={formatMoney(summary.incomeCents, currency)} />
          <Tile label="Dépenses" value={formatMoney(summary.totalExpenseCents, currency)} />
          <Tile label="Solde net" value={formatSignedMoney(summary.netCents, currency)} />
          <Tile label="Dépenses fixes" value={formatMoney(summary.fixedExpenseCents, currency)} />
          <Tile
            label="Dépenses variables"
            value={formatMoney(summary.variableExpenseCents, currency)}
          />
          <Tile label="Taux d'épargne" value={`${summary.savingsRatePercent}%`} />
        </View>

        <Text style={styles.sectionTitle}>Dépenses par catégorie</Text>
        {data.categories.length === 0 ? (
          <Text style={styles.subtitle}>Aucune dépense.</Text>
        ) : (
          data.categories.map((c) => (
            <View style={styles.row} key={c.name}>
              <Text style={styles.cLabel}>{c.name}</Text>
              <Text style={{ width: "60%", textAlign: "right" }}>
                {formatMoney(c.amountCents, currency)}
              </Text>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>Transactions</Text>
        <View style={styles.row}>
          <Text style={[styles.cDate, styles.th]}>Date</Text>
          <Text style={[styles.cLabel, styles.th]}>Libellé</Text>
          <Text style={[styles.cAccount, styles.th]}>Compte</Text>
          <Text style={[styles.cAmount, styles.th]}>Montant</Text>
        </View>
        {data.rows.map((r, i) => (
          <View style={styles.row} key={`${r.date}-${i}`} wrap={false}>
            <Text style={styles.cDate}>{r.date}</Text>
            <Text style={styles.cLabel}>{r.label}</Text>
            <Text style={styles.cAccount}>{r.account}</Text>
            <Text style={styles.cAmount}>{formatSignedMoney(r.signedCents, currency)}</Text>
          </View>
        ))}

        <Text style={styles.footer} fixed>
          Rapiat — rapport personnel confidentiel
        </Text>
      </Page>
    </Document>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}
