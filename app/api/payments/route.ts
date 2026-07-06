import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

const createPaymentSchema = z.object({
  contactId: z.string().trim().min(1, "Contact is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().trim().optional().nullable(),
  createdAt: z.coerce.date().optional(),
});

export async function POST(request: Request) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createPaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { contactId, amount, note, createdAt } = parsed.data;

  const [entries, charges, debits] = await Promise.all([
    prisma.entry.findMany({
      where: { contactId, type: "sent", ratePerKg: { not: null } },
      select: { quantity: true, ratePerKg: true },
    }),
    prisma.charge.aggregate({ _sum: { amount: true }, where: { contactId } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { contactId } }),
  ]);

  const totalCredits =
    entries.reduce((sum, e) => sum + (e.ratePerKg ?? 0) * e.quantity, 0) + (charges._sum.amount ?? 0);
  const balanceDue = totalCredits - (debits._sum.amount ?? 0);

  if (amount > balanceDue + 0.01) {
    return NextResponse.json(
      { error: `Amount exceeds the outstanding balance (${balanceDue.toFixed(2)})` },
      { status: 400 },
    );
  }

  const payment = await prisma.payment.create({
    data: { contactId, amount, note: note || null, ...(createdAt ? { createdAt } : {}) },
  });

  return NextResponse.json({ payment }, { status: 201 });
}
