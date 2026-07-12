import { supabaseAdmin } from "./supabase/admin";

export async function getYarnTypeRates(): Promise<Record<string, number>> {
  const { data, error } = await supabaseAdmin.from("YarnType").select("name, kgPerBag");
  if (error) throw error;

  const rates: Record<string, number> = {};
  for (const row of data ?? []) {
    rates[row.name] = row.kgPerBag;
  }
  return rates;
}

export async function setYarnTypeRate(name: string, kgPerBag: number) {
  const { error } = await supabaseAdmin
    .from("YarnType")
    .upsert({ name, kgPerBag }, { onConflict: "name" });
  if (error) throw error;
}
