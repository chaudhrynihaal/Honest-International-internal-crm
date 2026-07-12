import { supabaseAdmin } from "./supabase/admin";
import { newId } from "./id";
import { getYarnTypeRates } from "./yarnTypes";
import type { FactoryStockLot, FactoryStockSummaryRow } from "./types";

export async function getFactoryStockLots(): Promise<FactoryStockLot[]> {
  const { data, error } = await supabaseAdmin
    .from("FactoryStock")
    .select("*")
    .order("yarnType", { ascending: true })
    .order("boughtAt", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getFactoryStockSummary(): Promise<FactoryStockSummaryRow[]> {
  const [{ data, error }, rates] = await Promise.all([
    supabaseAdmin.from("FactoryStock").select("yarnType, bags"),
    getYarnTypeRates(),
  ]);
  if (error) throw error;

  const map = new Map<string, FactoryStockSummaryRow>();

  for (const lot of data ?? []) {
    const existing = map.get(lot.yarnType);
    if (existing) {
      existing.totalBags += lot.bags;
      existing.lotCount += 1;
    } else {
      map.set(lot.yarnType, {
        yarnType: lot.yarnType,
        totalBags: lot.bags,
        lotCount: 1,
        kgPerBag: rates[lot.yarnType] ?? 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => a.yarnType.localeCompare(b.yarnType));
}

export class InsufficientStockError extends Error {
  constructor(yarnType: string, available: number, requested: number) {
    super(
      `Only ${available.toLocaleString()} bags of "${yarnType}" available in factory stock (requested ${requested.toLocaleString()}).`,
    );
    this.name = "InsufficientStockError";
  }
}

// Note: unlike the previous Prisma $transaction-based version, this deducts
// across lots via sequential updates (not a single atomic transaction).
export async function deductFactoryStock(yarnType: string, quantity: number) {
  const { data: lots, error } = await supabaseAdmin
    .from("FactoryStock")
    .select("id, bags")
    .eq("yarnType", yarnType)
    .gt("bags", 0)
    .order("boughtAt", { ascending: true });

  if (error) throw error;

  const available = (lots ?? []).reduce((sum, lot) => sum + lot.bags, 0);
  if (available < quantity) {
    throw new InsufficientStockError(yarnType, available, quantity);
  }

  let remaining = quantity;
  for (const lot of lots ?? []) {
    if (remaining <= 0) break;
    const take = Math.min(lot.bags, remaining);
    const { error: updateError } = await supabaseAdmin
      .from("FactoryStock")
      .update({ bags: lot.bags - take })
      .eq("id", lot.id);
    if (updateError) throw updateError;
    remaining -= take;
  }
}

export async function restoreFactoryStock(yarnType: string, quantity: number) {
  const { data: lot, error } = await supabaseAdmin
    .from("FactoryStock")
    .select("id, bags")
    .eq("yarnType", yarnType)
    .order("boughtAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  if (lot) {
    const { error: updateError } = await supabaseAdmin
      .from("FactoryStock")
      .update({ bags: lot.bags + quantity })
      .eq("id", lot.id);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabaseAdmin
      .from("FactoryStock")
      .insert({ id: newId(), yarnType, bags: quantity, rate: 0 });
    if (insertError) throw insertError;
  }
}
