import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

const createNoteSchema = z.object({
  content: z.string().trim().min(1, "Note can't be empty"),
});

export async function GET() {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notes = await prisma.note.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createNoteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const note = await prisma.note.create({ data: { content: parsed.data.content } });
  return NextResponse.json({ note }, { status: 201 });
}
