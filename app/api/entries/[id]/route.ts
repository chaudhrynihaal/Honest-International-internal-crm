import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { restoreFactoryStock } from "@/lib/factoryStock";
import { getUser } from "@/lib/supabase/server";

const updateEntrySchema = z.object({
  ratePerKg: z.coerce.number().positive("Rate must be greater than 0").optional(),
  note: z.string().trim().optional().nullable(),
  createdAt: z.coerce.date().optional(),
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
  const parsed = updateEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { ratePerKg, note, createdAt } = parsed.data;

  const { data: entry, error } = await supabaseAdmin
    .from("Entry")
    .update({
      ...(ratePerKg !== undefined ? { ratePerKg } : {}),
      ...(note !== undefined ? { note } : {}),
      ...(createdAt ? { createdAt: createdAt.toISOString() } : {}),
    })
    .eq("id", id)
    .select("*, contact:Contact(*)")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "This entry no longer exists (it may have been deleted elsewhere)." },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entry });
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
    const { data: entry } = await supabaseAdmin.from("Entry").select("*").eq("id", id).maybeSingle();

    if (entry) {
      if (entry.type === "sent" && entry.unit === "bags" && entry.yarnType) {
        await restoreFactoryStock(entry.yarnType, entry.quantity);
      }
      await supabaseAdmin.from("Entry").delete().eq("id", id);
    }
  } catch {
    // best-effort, matches previous swallow-all behavior
  }

  return NextResponse.json({ ok: true });
}
