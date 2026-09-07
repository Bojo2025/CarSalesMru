import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FiltersBar } from "@/components/filters-bar";
import { applyFilters, EMPTY_FILTERS, type ListingFilters } from "@/lib/filters";
import { FacebookConnect } from "@/components/facebook-connect";
import { ListingGrid, ListingSkeleton } from "@/components/listing-grid";
import { SiteHeader } from "@/components/site-header";
import { SOURCE_META, type SourceId } from "@/lib/listings";
import { getListings, refreshListings, type ListingsPayload } from "@/lib/listings.functions";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      return await getListings({ data: { refresh: false } });
    } catch {
      return {
        listings: [],
        okSources: [],
        errors: {},
        scrapedAt: null,
        fromCache: true,
      } satisfies ListingsPayload;
    }
  },
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  const [payload, setPayload] = useState<ListingsPayload>(initial);
  const [busy, setBusy] = useState(initial.listings.length === 0);
  const [filters, setFilters] = useState<ListingFilters>(EMPTY_FILTERS);

  useEffect(() => {
    if (initial.listings.length > 0) return;
    let cancelled = false;
    void (async () => {
      setBusy(true);
      try {
        const next = await getListings({ data: { refresh: true } });
        if (!cancelled) setPayload(next);
      } catch {
        /* keep empty */
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initial.listings.length]);

  const filtered = useMemo(
    () => applyFilters(payload.listings, filters),
    [payload.listings, filters],
  );

  async function onRefresh() {
    setBusy(true);
    try {
      const next = await refreshListings();
      setPayload(next);
    } finally {
      setBusy(false);
    }
  }

  const hasActiveFilter =
    Boolean(filters.q) ||
    filters.brand !== "all" ||
    filters.color !== "all" ||
    filters.source !== "all" ||
    filters.maxPrice !== "all";

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        onRefresh={onRefresh}
        refreshing={busy}
        extra={<FacebookConnect payload={payload} onPayload={setPayload} />}
      />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <section className="max-w-2xl">
          <p className="text-accent text-xs font-medium tracking-[0.18em] uppercase">
            Mauritius car sales
          </p>
          <h1 className="font-display mt-2 text-4xl leading-[0.95] font-semibold tracking-wide uppercase sm:text-6xl">
            One lot.
            <br />
            The whole island.
          </h1>
          <p className="text-muted mt-4 max-w-xl text-sm sm:text-base">
            Photos, brand, colour and the seller’s number — pulled from the main Mauritius
            classifieds, dealer lots and Facebook Marketplace. Only ads listed in the last
            three months.
          </p>
        </section>

        <FiltersBar listings={payload.listings} filters={filters} onChange={setFilters} />

        <div className="text-muted flex flex-wrap items-center justify-between gap-2 text-sm">
          <p>
            <span className="text-fg font-medium tabular-nums">{filtered.length}</span> cars
            {hasActiveFilter ? ` of ${payload.listings.length}` : null}
          </p>
          {payload.scrapedAt ? (
            <p className="text-xs">
              Updated {new Date(payload.scrapedAt).toLocaleString("en-MU")}
            </p>
          ) : null}
        </div>

        {busy && payload.listings.length === 0 ? (
          <div className="flex flex-col gap-4">
            <p className="text-muted text-sm">Collecting live ads from Mauritius sites…</p>
            <ListingSkeleton />
          </div>
        ) : (
          <ListingGrid listings={filtered} />
        )}

        {payload.listings.length === 0 && !busy ? (
          <p className="text-muted text-sm">
            Couldn’t reach the listing sites just now. Tap Refresh to try again.
          </p>
        ) : null}
      </main>
      <footer className="border-border mt-auto border-t">
        <div className="text-muted mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-xs sm:px-6">
          <p className="text-fg font-medium">Sources</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {(Object.keys(SOURCE_META) as SourceId[]).map((id) => (
              <li key={id}>
                <a
                  href={SOURCE_META[id].home}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-fg underline-offset-2 hover:underline"
                >
                  {SOURCE_META[id].label}
                </a>
              </li>
            ))}
          </ul>
          <p>
            LotMoris gathers public listings so you can compare in one place. Always confirm
            details with the seller on the original site. Mauritius only · ads under 90 days.
          </p>
        </div>
      </footer>
    </div>
  );
}
