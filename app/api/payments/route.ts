import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { newId } from "@/lib/id";
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

  const [entriesRes, chargesRes, paymentsRes] = await Promise.all([
    supabaseAdmin
      .from("Entry")
      .select("quantity, ratePerKg")
      .eq("contactId", contactId)
      .eq("type", "sent")
      .not("ratePerKg", "is", null),
    supabaseAdmin.from("Charge").select("amount").eq("contactId", contactId),
    supabaseAdmin.from("Payment").select("amount").eq("contactId", contactId),
  ]);

  if (entriesRes.error) return NextResponse.json({ error: entriesRes.error.message }, { status: 500 });
  if (chargesRes.error) return NextResponse.json({ error: chargesRes.error.message }, { status: 500 });
  if (paymentsRes.error) return NextResponse.json({ error: paymentsRes.error.message }, { status: 500 });

  const entryTotal = (entriesRes.data ?? []).reduce((sum, e) => sum + (e.ratePerKg ?? 0) * e.quantity, 0);
  const chargeTotal = (chargesRes.data ?? []).reduce((sum, c) => sum + c.amount, 0);
  const paymentTotal = (paymentsRes.data ?? []).reduce((sum, p) => sum + p.amount, 0);

  const totalCredits = entryTotal + chargeTotal;
  const balanceDue = totalCredits - paymentTotal;

  if (amount > balanceDue + 0.01) {
    return NextResponse.json(
      { error: `Amount exceeds the outstanding balance (${balanceDue.toFixed(2)})` },
      { status: 400 },
    );
  }

  const { data: payment, error } = await supabaseAdmin
    .from("Payment")
    .insert({ id: newId(), contactId, amount, note: note || null, ...(createdAt ? { createdAt: createdAt.toISOString() } : {}) })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ payment }, { status: 201 });
}
