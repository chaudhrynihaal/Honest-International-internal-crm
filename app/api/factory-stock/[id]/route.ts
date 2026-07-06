import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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

  try {
    const lot = await prisma.factoryStock.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ lot });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json(
        { error: "This stock lot no longer exists (it may have been deleted elsewhere)." },
        { status: 404 },
      );
    }
    const message = err instanceof Error ? err.message : "Failed to update stock";
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

  await prisma.factoryStock.delete({ where: { id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}
