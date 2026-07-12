import { NextResponse } from "next/server";
import { z } from "zod";
import { setYarnTypeRate } from "@/lib/yarnTypes";
import { getUser } from "@/lib/supabase/server";

const updateYarnTypeSchema = z.object({
  kgPerBag: z.number().positive("Kg per bag must be greater than 0"),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateYarnTypeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  await setYarnTypeRate(name, parsed.data.kgPerBag);

  return NextResponse.json({ ok: true });
}
