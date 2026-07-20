/** Reports module public surface. */
export {
  getMonthlySummary,
  getCategoryBreakdown,
  getTrendAndBalance,
  comparePeriods,
} from "./services/reports.service";
export { CategoryDonut, TrendBars, BalanceArea } from "./components/charts";
export { MonthNav } from "./components/MonthNav";
export type {
  MonthlySummary,
  CategoryDatum,
  TrendDatum,
  BalancePoint,
  PeriodComparison,
} from "./types";
