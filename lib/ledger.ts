import { prisma } from "./prisma";
import type { LedgerRow } from "./types";

export async function getLedgerSummary(): Promise<LedgerRow[]> {
  const contacts = await prisma.contact.findMany({
    include: {
      entries: { select: { type: true, unit: true, quantity: true, createdAt: true } },
    },
  });

  return contacts.map((c) => {
    let totalSentBags = 0;
    let totalReceivedBags = 0;
    let totalSentKg = 0;
    let totalReceivedKg = 0;
    let lastEntryAt: Date | null = null;

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
      lastEntryAt: lastEntryAt ? lastEntryAt.toISOString() : null,
    };
  });
}

export async function getContactBalance(contactId: string) {
  const [sentBags, receivedBags, sentKg, receivedKg] = await Promise.all([
    prisma.entry.aggregate({ _sum: { quantity: true }, where: { contactId, type: "sent", unit: "bags" } }),
    prisma.entry.aggregate({ _sum: { quantity: true }, where: { contactId, type: "received", unit: "bags" } }),
    prisma.entry.aggregate({ _sum: { quantity: true }, where: { contactId, type: "sent", unit: "kg" } }),
    prisma.entry.aggregate({ _sum: { quantity: true }, where: { contactId, type: "received", unit: "kg" } }),
  ]);

  const totalSentBags = sentBags._sum.quantity ?? 0;
  const totalReceivedBags = receivedBags._sum.quantity ?? 0;
  const totalSentKg = sentKg._sum.quantity ?? 0;
  const totalReceivedKg = receivedKg._sum.quantity ?? 0;

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
  const contacts = await prisma.contact.findMany({
    where: { role: { in: ["knitter", "dyer"] } },
    include: {
      entries: {
        where: { type: "sent", ratePerKg: { not: null } },
        orderBy: { createdAt: "asc" },
      },
      charges: {
        orderBy: { createdAt: "asc" },
      },
      payments: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return contacts.map((c) => {
    const entryCredits: CreditLine[] = c.entries.map((e) => ({
      id: e.id,
      source: "entry",
      date: e.createdAt.toISOString(),
      description: `${e.quantity.toLocaleString()} ${e.unit}${e.yarnType ? ` · ${e.yarnType}` : ""}`,
      amount: (e.ratePerKg ?? 0) * e.quantity,
      quantity: e.quantity,
      unit: e.unit,
      yarnType: e.yarnType,
      ratePerKg: e.ratePerKg ?? 0,
      note: e.note,
    }));

    const chargeCredits: CreditLine[] = c.charges.map((ch) => ({
      id: ch.id,
      source: "charge",
      date: ch.createdAt.toISOString(),
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

    const debits: DebitLine[] = c.payments.map((p) => ({
      id: p.id,
      date: p.createdAt.toISOString(),
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
