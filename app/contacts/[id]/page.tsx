import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getContactBalance } from "@/lib/ledger";
import { getFactoryStockSummary } from "@/lib/factoryStock";
import { formatPKR } from "@/lib/currency";
import { ContactDetailHeader } from "@/components/ContactDetailHeader";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function formatDate(d: Date) {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ContactDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);

  const [contact, balance, allContacts, factoryStock, total, entries] = await Promise.all([
    prisma.contact.findUnique({ where: { id } }),
    getContactBalance(id),
    prisma.contact.findMany({ orderBy: { name: "asc" } }),
    getFactoryStockSummary(),
    prisma.entry.count({ where: { contactId: id } }),
    prisma.entry.findMany({
      where: { contactId: id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  if (!contact) notFound();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const contactOptions = allContacts.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role as "knitter" | "dyer",
  }));

  return (
    <div className="flex flex-col gap-6">
      <ContactDetailHeader
        contact={{ id: contact.id, name: contact.name, role: contact.role as "knitter" | "dyer", phone: contact.phone }}
        balance={balance}
        contacts={contactOptions}
        factoryStock={factoryStock}
      />

      <div className="card p-5">
        <h2 className="text-base font-semibold text-foreground">Entry History</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs font-semibold uppercase tracking-wide text-foreground/50">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Quantity</th>
                <th className="px-3 py-2">Yarn Type</th>
                <th className="px-3 py-2">Rate / Bill</th>
                <th className="px-3 py-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-black/5 last:border-0 hover:bg-primary-light/40">
                  <td className="px-3 py-3 whitespace-nowrap text-foreground/70">{formatDate(e.createdAt)}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        e.type === "sent" ? "bg-secondary/10 text-secondary" : "bg-success/10 text-success"
                      }`}
                    >
                      {e.type}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-medium text-foreground">
                    {e.quantity.toLocaleString()} {e.unit}
                  </td>
                  <td className="px-3 py-3 text-foreground/60">{e.yarnType ?? "—"}</td>
                  <td className="px-3 py-3 text-foreground/60">
                    {e.ratePerKg ? (
                      <div className="flex flex-col">
                        <span>{formatPKR(e.ratePerKg)}/kg</span>
                        <span className="font-medium text-foreground">
                          {formatPKR(e.ratePerKg * e.quantity)}
                        </span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 text-foreground/60">{e.note ?? "—"}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-foreground/40">
                    No entries yet for this contact.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-foreground/60">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Link
                href={`/contacts/${id}?page=${Math.max(1, page - 1)}`}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${
                  page <= 1 ? "pointer-events-none opacity-30" : "hover:bg-primary-light hover:text-primary"
                }`}
                aria-disabled={page <= 1}
              >
                <ChevronLeft size={16} />
                Prev
              </Link>
              <Link
                href={`/contacts/${id}?page=${Math.min(totalPages, page + 1)}`}
                className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${
                  page >= totalPages ? "pointer-events-none opacity-30" : "hover:bg-primary-light hover:text-primary"
                }`}
                aria-disabled={page >= totalPages}
              >
                Next
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
