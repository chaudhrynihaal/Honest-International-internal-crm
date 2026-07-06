import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/supabase/server";

const createContactSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  role: z.enum(["knitter", "dyer"]),
  phone: z.string().trim().optional().nullable(),
});

export async function GET() {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await prisma.contact.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ contacts });
}

export async function POST(request: Request) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createContactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, role, phone } = parsed.data;
  const contact = await prisma.contact.create({
    data: { name, role, phone: phone || null },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
