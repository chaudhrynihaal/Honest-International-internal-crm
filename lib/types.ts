export type ContactRole = "knitter" | "dyer";
export type EntryType = "sent" | "received";
export type EntryUnit = "bags" | "kg";

export interface LedgerRow {
  id: string;
  name: string;
  role: ContactRole;
  totalSentBags: number;
  totalReceivedBags: number;
  totalSentKg: number;
  totalReceivedKg: number;
  balanceBags: number;
  balanceKg: number;
  lastEntryAt: string | null;
}

export interface KpiCardData {
  key: string;
  label: string;
  value: number;
  unit: string;
  changePct: number | null;
}

export interface TrendPoint {
  date: string;
  label: string;
  bagsSent: number;
  kgReceived: number;
}

export interface FactoryStockLot {
  id: string;
  yarnType: string;
  bags: number;
  rate: number;
  boughtAt: string;
  createdAt: string;
}

export interface FactoryStockSummaryRow {
  yarnType: string;
  totalBags: number;
  lotCount: number;
}
