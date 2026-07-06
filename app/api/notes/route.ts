import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { newId } from "@/lib/id";
import { getUser } from "@/lib/supabase/server";

const createNoteSchema = z.object({
  content: z.string().trim().min(1, "Note can't be empty"),
});

export async function GET() {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: notes, error } = await supabaseAdmin
    .from("Note")
    .select("*")
    .order("createdAt", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  const now = new Date().toISOString();
  const { data: note, error } = await supabaseAdmin
    .from("Note")
    .insert({ id: newId(), content: parsed.data.content, updatedAt: now })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note }, { status: 201 });
}
