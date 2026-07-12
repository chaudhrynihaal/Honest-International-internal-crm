import { NextResponse } from "next/server";
import { getContactYarnTypeBreakdown } from "@/lib/ledger";
import { getUser } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const breakdown = await getContactYarnTypeBreakdown(id);

  return NextResponse.json({ breakdown });
}
