import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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

  try {
    const entry = await prisma.entry.update({
      where: { id },
      data: parsed.data,
      include: { contact: true },
    });

    return NextResponse.json({ entry });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json(
        { error: "This entry no longer exists (it may have been deleted elsewhere)." },
        { status: 404 },
      );
    }
    const message = err instanceof Error ? err.message : "Failed to update entry";
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

  try {
    await prisma.$transaction(async (tx) => {
      const entry = await tx.entry.findUnique({ where: { id } });
      if (!entry) return;

      if (entry.type === "sent" && entry.unit === "bags" && entry.yarnType) {
        await restoreFactoryStock(tx, entry.yarnType, entry.quantity);
      }

      await tx.entry.delete({ where: { id } });
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
