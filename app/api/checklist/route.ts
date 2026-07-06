import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

const createSchema = z.object({
  task: z.string().trim().min(1, "Task is required"),
  meta: z.string().trim().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});

const patchSchema = z.object({
  id: z.string().trim().min(1),
  done: z.boolean().optional(),
  task: z.string().trim().min(1).optional(),
  meta: z.string().trim().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});

export async function GET() {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.checklistItem.findMany({
    orderBy: [{ done: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { task, meta, dueDate } = parsed.data;
  const item = await prisma.checklistItem.create({
    data: { task, meta: meta || null, dueDate: dueDate || null },
  });

  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { id, ...rest } = parsed.data;

  const item = await prisma.checklistItem.update({
    where: { id },
    data: rest,
  });

  return NextResponse.json({ item });
}
