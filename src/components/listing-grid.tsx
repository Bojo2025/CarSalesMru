import { CarCard } from "@/components/car-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { CarListing } from "@/lib/listings";

export function ListingGrid({ listings }: { listings: CarListing[] }) {
  if (listings.length === 0) {
    return (
      <div className="border-border bg-surface rounded-xl border px-6 py-16 text-center">
        <p className="font-display text-2xl uppercase tracking-wide">No cars match</p>
        <p className="text-muted mx-auto mt-2 max-w-sm text-sm">
          Try another brand, colour or price. Listings refresh from Mauritius sites throughout the
          day.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((car) => (
        <CarCard key={car.id} car={car} />
      ))}
    </div>
  );
}

export function ListingSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="border-border overflow-hidden rounded-xl border">
          <Skeleton className="aspect-[5/4] rounded-none" />
          <div className="space-y-3 p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
