import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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

  const charge = await prisma.charge.create({
    data: { contactId, amount, note: note || null, ...(createdAt ? { createdAt } : {}) },
  });

  return NextResponse.json({ charge }, { status: 201 });
}
