import { Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { SOURCE_META, type CarListing, type SourceId } from "@/lib/listings";
import type { ListingFilters } from "@/lib/filters";
import { cn } from "@/lib/utils";

const PRICE_STOPS = [
  { label: "Any price", value: "all" },
  { label: "Under Rs 400k", value: "400000" },
  { label: "Under Rs 700k", value: "700000" },
  { label: "Under Rs 1.2m", value: "1200000" },
  { label: "Under Rs 2m", value: "2000000" },
];

export function FiltersBar({
  listings,
  filters,
  onChange,
}: {
  listings: CarListing[];
  filters: ListingFilters;
  onChange: (next: ListingFilters) => void;
}) {
  const [open, setOpen] = useState(false);
  const brands = useMemo(() => {
    const set = new Set(listings.map((l) => l.brand).filter(Boolean));
    return [...set].sort();
  }, [listings]);
  const colors = useMemo(() => {
    const set = new Set(
      listings.map((l) => l.color).filter((c): c is string => Boolean(c)),
    );
    return [...set].sort();
  }, [listings]);

  const selectClass =
    "h-11 rounded-md border border-border bg-surface px-3 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search cars</span>
          <Search className="text-subtle pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
            placeholder="Search brand, colour, town…"
            className="pl-9"
          />
        </label>
        <button
          type="button"
          className={cn(
            "border-border inline-flex size-11 shrink-0 items-center justify-center rounded-md border md:hidden",
            open ? "bg-surface-2" : "bg-surface",
          )}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <SlidersHorizontal className="size-4" />
          <span className="sr-only">Filters</span>
        </button>
      </div>
      <div
        className={cn(
          "gap-2 sm:grid-cols-2 lg:grid-cols-4",
          open ? "grid" : "hidden md:grid",
        )}
      >
        <select
          className={selectClass}
          value={filters.brand}
          onChange={(e) => onChange({ ...filters, brand: e.target.value })}
          aria-label="Brand"
        >
          <option value="all">All brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={filters.color}
          onChange={(e) => onChange({ ...filters, color: e.target.value })}
          aria-label="Colour"
        >
          <option value="all">All colours</option>
          {colors.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
          aria-label="Max price"
        >
          {PRICE_STOPS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={filters.source}
          onChange={(e) =>
            onChange({ ...filters, source: e.target.value as ListingFilters["source"] })
          }
          aria-label="Source site"
        >
          <option value="all">All sites</option>
          {(Object.keys(SOURCE_META) as SourceId[]).map((id) => (
            <option key={id} value={id}>
              {SOURCE_META[id].label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
