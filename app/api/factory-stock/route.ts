import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { newId } from "@/lib/id";
import { getFactoryStockSummary } from "@/lib/factoryStock";
import { getUser } from "@/lib/supabase/server";

const createLotSchema = z.object({
  yarnType: z.string().trim().min(1, "Yarn type is required"),
  bags: z.coerce.number().positive("Bags must be greater than 0"),
  rate: z.coerce.number().positive("Rate must be greater than 0"),
  boughtAt: z.coerce.date().optional(),
});

export async function GET() {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [lotsRes, summary] = await Promise.all([
    supabaseAdmin
      .from("FactoryStock")
      .select("*")
      .order("yarnType", { ascending: true })
      .order("boughtAt", { ascending: true }),
    getFactoryStockSummary(),
  ]);

  if (lotsRes.error) {
    return NextResponse.json({ error: lotsRes.error.message }, { status: 500 });
  }

  return NextResponse.json({ lots: lotsRes.data, summary });
}

export async function POST(request: Request) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createLotSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { yarnType, bags, rate, boughtAt } = parsed.data;

  const { data: lot, error } = await supabaseAdmin
    .from("FactoryStock")
    .insert({
      id: newId(),
      yarnType,
      bags,
      rate,
      ...(boughtAt ? { boughtAt: boughtAt.toISOString() } : {}),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ lot }, { status: 201 });
}
