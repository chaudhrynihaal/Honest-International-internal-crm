import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { newId } from "@/lib/id";
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

  const { data: items, error } = await supabaseAdmin
    .from("ChecklistItem")
    .select("*")
    .order("done", { ascending: true })
    .order("createdAt", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  const { data: item, error } = await supabaseAdmin
    .from("ChecklistItem")
    .insert({
      id: newId(),
      task,
      meta: meta || null,
      dueDate: dueDate ? dueDate.toISOString() : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  const { id, done, task, meta, dueDate } = parsed.data;

  const { data: item, error } = await supabaseAdmin
    .from("ChecklistItem")
    .update({
      ...(done !== undefined ? { done } : {}),
      ...(task !== undefined ? { task } : {}),
      ...(meta !== undefined ? { meta: meta || null } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? dueDate.toISOString() : null } : {}),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item });
}
