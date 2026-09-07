import type { CarListing, SourceId } from "@/lib/listings";

export type ListingFilters = {
  q: string;
  brand: string;
  color: string;
  source: SourceId | "all";
  maxPrice: string;
};

export const EMPTY_FILTERS: ListingFilters = {
  q: "",
  brand: "all",
  color: "all",
  source: "all",
  maxPrice: "all",
};

export function applyFilters(list: CarListing[], f: ListingFilters): CarListing[] {
  const q = f.q.trim().toLowerCase();
  const max = f.maxPrice === "all" ? null : Number(f.maxPrice);
  return list.filter((car) => {
    if (f.brand !== "all" && car.brand !== f.brand) return false;
    if (f.color !== "all" && (car.color || "").toLowerCase() !== f.color.toLowerCase()) {
      return false;
    }
    if (f.source !== "all" && car.source !== f.source) return false;
    if (max != null && (car.priceMur == null || car.priceMur > max)) return false;
    if (!q) return true;
    const hay =
      `${car.title} ${car.brand} ${car.model} ${car.color ?? ""} ${car.location ?? ""} ${car.phone ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}
