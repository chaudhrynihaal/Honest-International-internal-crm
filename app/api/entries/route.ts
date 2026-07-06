import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { newId } from "@/lib/id";
import { deductFactoryStock, InsufficientStockError } from "@/lib/factoryStock";
import { getUser } from "@/lib/supabase/server";

const newContactSchema = z.object({
  name: z.string().trim().min(1),
  role: z.enum(["knitter", "dyer"]),
});

const createEntrySchema = z
  .object({
    contactId: z.string().trim().min(1).optional(),
    newContact: newContactSchema.optional(),
    type: z.enum(["sent", "received"]),
    unit: z.enum(["bags", "kg"]),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    yarnType: z.string().trim().optional(),
    ratePerKg: z.coerce.number().positive("Rate must be greater than 0").optional(),
    note: z.string().trim().optional().nullable(),
    createdAt: z.coerce.date().optional(),
  })
  .refine((data) => data.contactId || data.newContact, {
    message: "A contact is required",
    path: ["contactId"],
  })
  .refine((data) => data.type !== "sent" || data.unit !== "bags" || !!data.yarnType, {
    message: "Yarn type is required when sending bags",
    path: ["yarnType"],
  });

export async function GET(request: Request) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "10")));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from("Entry")
    .select("*, contact:Contact(*)", { count: "exact" })
    .order("createdAt", { ascending: false })
    .range(from, to);

  if (contactId) query = query.eq("contactId", contactId);

  const { data: entries, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries, total: count ?? 0, page, pageSize });
}

export async function POST(request: Request) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { type, unit, quantity, note, createdAt, yarnType, ratePerKg, contactId, newContact } = parsed.data;

  try {
    let resolvedContactId = contactId;

    if (!resolvedContactId && newContact) {
      const { data: contact, error: contactError } = await supabaseAdmin
        .from("Contact")
        .insert({ id: newId(), name: newContact.name, role: newContact.role })
        .select()
        .single();
      if (contactError) throw contactError;
      resolvedContactId = contact.id;
    }

    if (!resolvedContactId) {
      throw new Error("A contact is required");
    }

    if (type === "sent" && unit === "bags" && yarnType) {
      await deductFactoryStock(yarnType, quantity);
    }

    const { data: entry, error: entryError } = await supabaseAdmin
      .from("Entry")
      .insert({
        id: newId(),
        contactId: resolvedContactId,
        type,
        unit,
        quantity,
        yarnType: yarnType || null,
        ratePerKg: ratePerKg ?? null,
        note: note || null,
        ...(createdAt ? { createdAt: createdAt.toISOString() } : {}),
      })
      .select("*, contact:Contact(*)")
      .single();
    if (entryError) throw entryError;

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error && err.message === "A contact is required") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Failed to create entry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
