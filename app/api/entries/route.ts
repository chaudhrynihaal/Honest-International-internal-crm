import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
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

  const where = contactId ? { contactId } : {};

  const [entries, total] = await Promise.all([
    prisma.entry.findMany({
      where,
      include: { contact: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.entry.count({ where }),
  ]);

  return NextResponse.json({ entries, total, page, pageSize });
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
    const entry = await prisma.$transaction(async (tx) => {
      let resolvedContactId = contactId;

      if (!resolvedContactId && newContact) {
        const contact = await tx.contact.create({
          data: { name: newContact.name, role: newContact.role },
        });
        resolvedContactId = contact.id;
      }

      if (!resolvedContactId) {
        throw new Error("A contact is required");
      }

      if (type === "sent" && unit === "bags" && yarnType) {
        await deductFactoryStock(tx, yarnType, quantity);
      }

      return tx.entry.create({
        data: {
          contactId: resolvedContactId,
          type,
          unit,
          quantity,
          yarnType: yarnType || null,
          ratePerKg: ratePerKg ?? null,
          note: note || null,
          ...(createdAt ? { createdAt } : {}),
        },
        include: { contact: true },
      });
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error && err.message === "A contact is required") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
