import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { newId } from "@/lib/id";
import { getUser } from "@/lib/supabase/server";

const createChargeSchema = z.object({
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
  const parsed = createChargeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { contactId, amount, note, createdAt } = parsed.data;

  const { data: charge, error } = await supabaseAdmin
    .from("Charge")
    .insert({
      id: newId(),
      contactId,
      amount,
      note: note || null,
      ...(createdAt ? { createdAt: createdAt.toISOString() } : {}),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ charge }, { status: 201 });
}
