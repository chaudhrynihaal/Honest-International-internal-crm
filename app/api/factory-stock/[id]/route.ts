import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUser } from "@/lib/supabase/server";

const updateLotSchema = z.object({
  yarnType: z.string().trim().min(1, "Yarn type is required").optional(),
  bags: z.coerce.number().min(0, "Bags cannot be negative").optional(),
  rate: z.coerce.number().positive("Rate must be greater than 0").optional(),
  boughtAt: z.coerce.date().optional(),
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
  const parsed = updateLotSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { yarnType, bags, rate, boughtAt } = parsed.data;

  const { data: lot, error } = await supabaseAdmin
    .from("FactoryStock")
    .update({
      ...(yarnType !== undefined ? { yarnType } : {}),
      ...(bags !== undefined ? { bags } : {}),
      ...(rate !== undefined ? { rate } : {}),
      ...(boughtAt ? { boughtAt: boughtAt.toISOString() } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "This stock lot no longer exists (it may have been deleted elsewhere)." },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lot });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await supabaseAdmin.from("FactoryStock").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
