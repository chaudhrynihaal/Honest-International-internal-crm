import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

const updatePaymentSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  note: z.string().trim().optional().nullable(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updatePaymentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { amount, note } = parsed.data;

  try {
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "This payment no longer exists." }, { status: 404 });
    }

    const [entries, charges, otherDebits] = await Promise.all([
      prisma.entry.findMany({
        where: { contactId: existing.contactId, type: "sent", ratePerKg: { not: null } },
        select: { quantity: true, ratePerKg: true },
      }),
      prisma.charge.aggregate({ _sum: { amount: true }, where: { contactId: existing.contactId } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { contactId: existing.contactId, id: { not: id } },
      }),
    ]);

    const totalCredits =
      entries.reduce((sum, e) => sum + (e.ratePerKg ?? 0) * e.quantity, 0) + (charges._sum.amount ?? 0);
    const balanceExcludingThis = totalCredits - (otherDebits._sum.amount ?? 0);

    if (amount > balanceExcludingThis + 0.01) {
      return NextResponse.json(
        { error: `Amount exceeds the outstanding balance (${balanceExcludingThis.toFixed(2)})` },
        { status: 400 },
      );
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: { amount, note: note || null },
    });

    return NextResponse.json({ payment });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "This payment no longer exists." }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to update payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.payment.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
