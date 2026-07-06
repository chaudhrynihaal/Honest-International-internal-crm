import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { restoreFactoryStock } from "@/lib/factoryStock";
import { getUser } from "@/lib/supabase/server";

const updateContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").optional(),
  role: z.enum(["knitter", "dyer"]).optional(),
  phone: z.string().trim().optional().nullable(),
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
  const parsed = updateContactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, role, phone, note } = parsed.data;

  const { data: contact, error } = await supabaseAdmin
    .from("Contact")
    .update({
      ...(name !== undefined ? { name } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(note !== undefined ? { note: note || null } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "This contact no longer exists." }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { data: stockAffectingEntries } = await supabaseAdmin
      .from("Entry")
      .select("yarnType, quantity")
      .eq("contactId", id)
      .eq("type", "sent")
      .eq("unit", "bags")
      .not("yarnType", "is", null);

    for (const entry of stockAffectingEntries ?? []) {
      await restoreFactoryStock(entry.yarnType!, entry.quantity);
    }

    // Entry/Payment/Charge rows cascade-delete via the DB foreign keys.
    await supabaseAdmin.from("Contact").delete().eq("id", id);
  } catch {
    // best-effort, matches previous swallow-all behavior
  }

  return NextResponse.json({ ok: true });
}
