import { supabaseAdmin } from "./supabase/admin";
import type { LedgerRow } from "./types";

interface EntryRow {
  id: string;
  type: string;
  unit: string;
  quantity: number;
  yarnType: string | null;
  ratePerKg: number | null;
  note: string | null;
  createdAt: string;
}

interface ChargeRow {
  id: string;
  amount: number;
  note: string | null;
  createdAt: string;
}

interface PaymentRow {
  id: string;
  amount: number;
  note: string | null;
  createdAt: string;
}

export async function getLedgerSummary(): Promise<LedgerRow[]> {
  const { data, error } = await supabaseAdmin
    .from("Contact")
    .select("id, name, role, entries:Entry(type, unit, quantity, createdAt)");

  if (error) throw error;

  const contacts = (data ?? []) as unknown as Array<{
    id: string;
    name: string;
    role: string;
    entries: Array<{ type: string; unit: string; quantity: number; createdAt: string }>;
  }>;

  return contacts.map((c) => {
    let totalSentBags = 0;
    let totalReceivedBags = 0;
    let totalSentKg = 0;
    let totalReceivedKg = 0;
    let lastEntryAt: string | null = null;

    for (const e of c.entries) {
      if (e.unit === "bags") {
        if (e.type === "sent") totalSentBags += e.quantity;
        else totalReceivedBags += e.quantity;
      } else {
        if (e.type === "sent") totalSentKg += e.quantity;
        else totalReceivedKg += e.quantity;
      }
      if (!lastEntryAt || e.createdAt > lastEntryAt) lastEntryAt = e.createdAt;
    }

    return {
      id: c.id,
      name: c.name,
      role: c.role as LedgerRow["role"],
      totalSentBags,
      totalReceivedBags,
      totalSentKg,
      totalReceivedKg,
      balanceBags: totalSentBags - totalReceivedBags,
      balanceKg: totalSentKg - totalReceivedKg,
      lastEntryAt,
    };
  });
}

export async function getContactBalance(contactId: string) {
  const { data, error } = await supabaseAdmin
    .from("Entry")
    .select("type, unit, quantity")
    .eq("contactId", contactId);

  if (error) throw error;

  let totalSentBags = 0;
  let totalReceivedBags = 0;
  let totalSentKg = 0;
  let totalReceivedKg = 0;

  for (const e of data ?? []) {
    if (e.unit === "bags") {
      if (e.type === "sent") totalSentBags += e.quantity;
      else totalReceivedBags += e.quantity;
    } else {
      if (e.type === "sent") totalSentKg += e.quantity;
      else totalReceivedKg += e.quantity;
    }
  }

  return {
    totalSentBags,
    totalReceivedBags,
    totalSentKg,
    totalReceivedKg,
    balanceBags: totalSentBags - totalReceivedBags,
    balanceKg: totalSentKg - totalReceivedKg,
  };
}

export interface BillLine {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export interface CreditLine extends BillLine {
  source: "entry" | "charge";
  quantity: number | null;
  unit: string | null;
  yarnType: string | null;
  ratePerKg: number | null;
  note: string | null;
}

export interface DebitLine extends BillLine {
  note: string | null;
}

export interface ContactTAccount {
  id: string;
  name: string;
  role: "knitter" | "dyer";
  note: string | null;
  credits: CreditLine[];
  debits: DebitLine[];
  totalCredits: number;
  totalDebits: number;
  balance: number;
}

export async function getContactTAccounts(): Promise<ContactTAccount[]> {
  const { data, error } = await supabaseAdmin
    .from("Contact")
    .select(
      "id, name, role, note, entries:Entry(id, type, unit, quantity, yarnType, ratePerKg, note, createdAt), charges:Charge(id, amount, note, createdAt), payments:Payment(id, amount, note, createdAt)",
    )
    .in("role", ["knitter", "dyer"])
    .order("name", { ascending: true });

  if (error) throw error;

  const contacts = (data ?? []) as unknown as Array<{
    id: string;
    name: string;
    role: string;
    note: string | null;
    entries: EntryRow[];
    charges: ChargeRow[];
    payments: PaymentRow[];
  }>;

  return contacts.map((c) => {
    const entryCredits: CreditLine[] = c.entries
      .filter((e) => e.type === "sent" && e.ratePerKg !== null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((e) => ({
        id: e.id,
        source: "entry",
        date: e.createdAt,
        description: `${e.quantity.toLocaleString()} ${e.unit}${e.yarnType ? ` · ${e.yarnType}` : ""}`,
        amount: (e.ratePerKg ?? 0) * e.quantity,
        quantity: e.quantity,
        unit: e.unit,
        yarnType: e.yarnType,
        ratePerKg: e.ratePerKg ?? 0,
        note: e.note,
      }));

    const chargeCredits: CreditLine[] = [...c.charges]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((ch) => ({
        id: ch.id,
        source: "charge",
        date: ch.createdAt,
        description: ch.note || "Manual charge",
        amount: ch.amount,
        quantity: null,
        unit: null,
        yarnType: null,
        ratePerKg: null,
        note: ch.note,
      }));

    const credits = [...entryCredits, ...chargeCredits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const debits: DebitLine[] = [...c.payments]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((p) => ({
        id: p.id,
        date: p.createdAt,
        description: p.note || "Payment",
        amount: p.amount,
        note: p.note,
      }));

    const totalCredits = credits.reduce((sum, l) => sum + l.amount, 0);
    const totalDebits = debits.reduce((sum, l) => sum + l.amount, 0);

    return {
      id: c.id,
      name: c.name,
      role: c.role as "knitter" | "dyer",
      note: c.note,
      credits,
      debits,
      totalCredits,
      totalDebits,
      balance: totalCredits - totalDebits,
    };
  });
}
