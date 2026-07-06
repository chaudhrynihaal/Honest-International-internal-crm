import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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

  const [lots, summary] = await Promise.all([
    prisma.factoryStock.findMany({ orderBy: [{ yarnType: "asc" }, { boughtAt: "asc" }] }),
    getFactoryStockSummary(),
  ]);

  return NextResponse.json({ lots, summary });
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
  const lot = await prisma.factoryStock.create({
    data: { yarnType, bags, rate, ...(boughtAt ? { boughtAt } : {}) },
  });

  return NextResponse.json({ lot }, { status: 201 });
}
