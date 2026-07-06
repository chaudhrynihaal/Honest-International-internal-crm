import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";
import type { FactoryStockSummaryRow } from "./types";

export async function getFactoryStockLots() {
  return prisma.factoryStock.findMany({
    orderBy: [{ yarnType: "asc" }, { boughtAt: "asc" }],
  });
}

export async function getFactoryStockSummary(): Promise<FactoryStockSummaryRow[]> {
  const lots = await prisma.factoryStock.findMany();
  const map = new Map<string, FactoryStockSummaryRow>();

  for (const lot of lots) {
    const existing = map.get(lot.yarnType);
    if (existing) {
      existing.totalBags += lot.bags;
      existing.lotCount += 1;
    } else {
      map.set(lot.yarnType, { yarnType: lot.yarnType, totalBags: lot.bags, lotCount: 1 });
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

export async function deductFactoryStock(
  tx: Prisma.TransactionClient,
  yarnType: string,
  quantity: number,
) {
  const lots = await tx.factoryStock.findMany({
    where: { yarnType, bags: { gt: 0 } },
    orderBy: { boughtAt: "asc" },
  });

  const available = lots.reduce((sum, lot) => sum + lot.bags, 0);
  if (available < quantity) {
    throw new InsufficientStockError(yarnType, available, quantity);
  }

  let remaining = quantity;
  for (const lot of lots) {
    if (remaining <= 0) break;
    const take = Math.min(lot.bags, remaining);
    await tx.factoryStock.update({
      where: { id: lot.id },
      data: { bags: lot.bags - take },
    });
    remaining -= take;
  }
}

export async function restoreFactoryStock(
  tx: Prisma.TransactionClient,
  yarnType: string,
  quantity: number,
) {
  const lot = await tx.factoryStock.findFirst({
    where: { yarnType },
    orderBy: { boughtAt: "desc" },
  });

  if (lot) {
    await tx.factoryStock.update({
      where: { id: lot.id },
      data: { bags: lot.bags + quantity },
    });
  } else {
    await tx.factoryStock.create({
      data: { yarnType, bags: quantity, rate: 0 },
    });
  }
}
