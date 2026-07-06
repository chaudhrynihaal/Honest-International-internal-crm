import { NextResponse } from "next/server";
import { getKpis } from "@/lib/kpis";
import { getTrendData } from "@/lib/chart";
import { getUser } from "@/lib/supabase/server";

export async function GET() {
  if (!(await getUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [kpis, trend] = await Promise.all([getKpis(), getTrendData(7)]);
  return NextResponse.json({ kpis, trend });
}
