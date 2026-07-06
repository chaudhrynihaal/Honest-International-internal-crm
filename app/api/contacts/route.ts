import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { newId } from "@/lib/id";
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

  const { data: contacts, error } = await supabaseAdmin
    .from("Contact")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  const { data: contact, error } = await supabaseAdmin
    .from("Contact")
    .insert({ id: newId(), name, role, phone: phone || null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contact }, { status: 201 });
}
