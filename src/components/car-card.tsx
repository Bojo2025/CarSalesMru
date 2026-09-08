import { Link } from "@tanstack/react-router";
import { MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  colorHex,
  formatPhone,
  formatPrice,
  listedLabel,
  listingImageSrc,
  telHref,
  type CarListing,
} from "@/lib/listings";

export function CarCard({ car }: { car: CarListing }) {
  const img = listingImageSrc(car);
  const [broken, setBroken] = useState(false);
  const phone = formatPhone(car.phone);
  const call = telHref(car.phone);

  return (
    <article className="bg-surface border-border group flex flex-col overflow-hidden rounded-xl border transition-[transform,border-color] duration-200 ease-(--ease-out) hover:-translate-y-0.5 hover:border-muted/40">
      <Link to="/car/$listingId" params={{ listingId: car.id }} className="block">
        <div className="bg-surface-2 relative aspect-[5/4] overflow-hidden">
          {img && !broken ? (
            <img
              src={img}
              alt={`${car.year ? car.year + " " : ""}${car.brand} ${car.model}`}
              className="size-full object-cover transition-transform duration-500 ease-(--ease-out) group-hover:scale-[1.03]"
              loading="lazy"
              onError={() => setBroken(true)}
            />
          ) : (
            <div className="text-subtle flex size-full items-center justify-center text-sm">
              No photo
            </div>
          )}
          <Badge className="absolute top-3 left-3 border-0 bg-bg/80 text-fg backdrop-blur-sm">
            {car.sourceLabel}
          </Badge>
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-subtle text-xs font-medium tracking-wide uppercase">
              {car.year ?? "—"} · {car.brand}
            </p>
            <Link
              to="/car/$listingId"
              params={{ listingId: car.id }}
              className="font-display text-xl leading-tight tracking-wide uppercase"
            >
              {car.model || car.title}
            </Link>
          </div>
          <p className="font-display shrink-0 text-lg leading-none tabular-nums">
            {formatPrice(car.priceMur, car.negotiable)}
          </p>
        </div>
        <div className="text-muted flex flex-wrap gap-x-3 gap-y-1 text-xs">
          {car.color ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-full border border-border"
                style={{ background: colorHex(car.color) }}
                aria-hidden
              />
              {car.color}
            </span>
          ) : null}
          {car.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" />
              {car.location}
            </span>
          ) : null}
          <span>{listedLabel(car.postedAt)}</span>
        </div>
        {phone && call ? (
          <a
            href={call}
            className="border-border bg-surface-2 text-fg hover:bg-bg mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-md border text-sm font-medium"
          >
            <Phone className="size-4" />
            {phone}
          </a>
        ) : (
          <Link
            to="/car/$listingId"
            params={{ listingId: car.id }}
            className="border-border text-muted mt-auto inline-flex h-11 items-center justify-center rounded-md border text-sm"
          >
            View listing
          </Link>
        )}
      </div>
    </article>
  );
}
