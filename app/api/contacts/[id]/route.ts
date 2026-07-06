import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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

  try {
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(note !== undefined ? { note: note || null } : {}),
      },
    });

    return NextResponse.json({ contact });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "This contact no longer exists." }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Failed to update contact";
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

  await prisma
    .$transaction(async (tx) => {
      const stockAffectingEntries = await tx.entry.findMany({
        where: { contactId: id, type: "sent", unit: "bags", yarnType: { not: null } },
      });

      for (const entry of stockAffectingEntries) {
        await restoreFactoryStock(tx, entry.yarnType!, entry.quantity);
      }

      await tx.contact.delete({ where: { id } });
    })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
