import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getContactBalance, getContactTAccount, getContactYarnTypes } from "@/lib/ledger";
import { getFactoryStockSummary } from "@/lib/factoryStock";
import { formatPKR } from "@/lib/currency";
import { ContactDetailHeader } from "@/components/ContactDetailHeader";
import { TAccountCard } from "@/components/TAccountCard";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function formatDate(d: string) {
  return new Date(d).toLocaleString(undefined, {
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
  searchParams: Promise<{ page?: string; yarnType?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam, yarnType: yarnTypeFilter } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let entriesQuery = supabaseAdmin
    .from("Entry")
    .select("*", { count: "exact" })
    .eq("contactId", id)
    .order("createdAt", { ascending: false })
    .range(from, to);
  if (yarnTypeFilter) entriesQuery = entriesQuery.eq("yarnType", yarnTypeFilter);

  const [contactRes, balance, tAccount, allContactsRes, factoryStock, entriesRes, yarnTypes] = await Promise.all([
    supabaseAdmin.from("Contact").select("*").eq("id", id).maybeSingle(),
    getContactBalance(id),
    getContactTAccount(id),
    supabaseAdmin.from("Contact").select("*").order("name", { ascending: true }),
    getFactoryStockSummary(),
    entriesQuery,
    getContactYarnTypes(id),
  ]);

  if (contactRes.error) throw contactRes.error;
  if (allContactsRes.error) throw allContactsRes.error;
  if (entriesRes.error) throw entriesRes.error;

  const contact = contactRes.data;
  const allContacts = allContactsRes.data ?? [];
  const entries = entriesRes.data ?? [];
  const total = entriesRes.count ?? 0;

  if (!contact) notFound();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const contactOptions = allContacts.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role as "knitter" | "dyer",
  }));

  function pageHref(targetPage: number) {
    const qs = new URLSearchParams();
    qs.set("page", String(targetPage));
    if (yarnTypeFilter) qs.set("yarnType", yarnTypeFilter);
    return `/contacts/${id}?${qs.toString()}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <ContactDetailHeader
        contact={{ id: contact.id, name: contact.name, role: contact.role as "knitter" | "dyer", phone: contact.phone }}
        balance={balance}
        contacts={contactOptions}
        factoryStock={factoryStock}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card p-5 xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold text-foreground">Entry History</h2>
            {yarnTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <Link
                  href={`/contacts/${id}`}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    !yarnTypeFilter
                      ? "bg-primary text-white"
                      : "bg-black/5 text-foreground/60 hover:bg-primary-light hover:text-primary"
                  }`}
                >
                  All
                </Link>
                {yarnTypes.map((yt) => (
                  <Link
                    key={yt}
                    href={`/contacts/${id}?yarnType=${encodeURIComponent(yt)}`}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      yarnTypeFilter === yt
                        ? "bg-primary text-white"
                        : "bg-black/5 text-foreground/60 hover:bg-primary-light hover:text-primary"
                    }`}
                  >
                    {yt}
                  </Link>
                ))}
              </div>
            )}
          </div>
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
                      {yarnTypeFilter
                        ? `No entries for "${yarnTypeFilter}".`
                        : "No entries yet for this contact."}
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
                  href={pageHref(Math.max(1, page - 1))}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 ${
                    page <= 1 ? "pointer-events-none opacity-30" : "hover:bg-primary-light hover:text-primary"
                  }`}
                  aria-disabled={page <= 1}
                >
                  <ChevronLeft size={16} />
                  Prev
                </Link>
                <Link
                  href={pageHref(Math.min(totalPages, page + 1))}
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

        {tAccount && (
          <div className="xl:col-span-1">
            <TAccountCard account={tAccount} />
          </div>
        )}
      </div>
    </div>
  );
}
