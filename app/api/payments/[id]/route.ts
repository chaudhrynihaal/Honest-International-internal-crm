import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
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

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("Payment")
    .select("contactId")
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "This payment no longer exists." }, { status: 404 });
  }

  const [entriesRes, chargesRes, otherPaymentsRes] = await Promise.all([
    supabaseAdmin
      .from("Entry")
      .select("quantity, ratePerKg")
      .eq("contactId", existing.contactId)
      .eq("type", "sent")
      .not("ratePerKg", "is", null),
    supabaseAdmin.from("Charge").select("amount").eq("contactId", existing.contactId),
    supabaseAdmin.from("Payment").select("amount").eq("contactId", existing.contactId).neq("id", id),
  ]);

  if (entriesRes.error) return NextResponse.json({ error: entriesRes.error.message }, { status: 500 });
  if (chargesRes.error) return NextResponse.json({ error: chargesRes.error.message }, { status: 500 });
  if (otherPaymentsRes.error)
    return NextResponse.json({ error: otherPaymentsRes.error.message }, { status: 500 });

  const entryTotal = (entriesRes.data ?? []).reduce((sum, e) => sum + (e.ratePerKg ?? 0) * e.quantity, 0);
  const chargeTotal = (chargesRes.data ?? []).reduce((sum, c) => sum + c.amount, 0);
  const otherPaymentsTotal = (otherPaymentsRes.data ?? []).reduce((sum, p) => sum + p.amount, 0);

  const totalCredits = entryTotal + chargeTotal;
  const balanceExcludingThis = totalCredits - otherPaymentsTotal;

  if (amount > balanceExcludingThis + 0.01) {
    return NextResponse.json(
      { error: `Amount exceeds the outstanding balance (${balanceExcludingThis.toFixed(2)})` },
      { status: 400 },
    );
  }

  const { data: payment, error } = await supabaseAdmin
    .from("Payment")
    .update({ amount, note: note || null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "This payment no longer exists." }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ payment });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await supabaseAdmin.from("Payment").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
