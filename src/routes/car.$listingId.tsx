import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, MapPin, Phone } from "lucide-react";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  colorHex,
  formatKm,
  formatPhone,
  formatPrice,
  listedLabel,
  listingImageSrc,
  telHref,
  waHref,
} from "@/lib/listings";
import { getListing } from "@/lib/listings.functions";

export const Route = createFileRoute("/car/$listingId")({
  loader: async ({ params }) => {
    const car = await getListing({ data: { id: params.listingId } });
    return { car };
  },
  component: CarPage,
});

function CarPage() {
  const { car } = Route.useLoaderData();
  if (!car) {
    return (
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start gap-4 px-4 py-16 sm:px-6">
          <h1 className="font-display text-4xl uppercase">Listing not found</h1>
          <p className="text-muted text-sm">It may have expired or not been scraped yet.</p>
          <Button asChild>
            <Link to="/">Back to the lot</Link>
          </Button>
        </main>
      </div>
    );
  }

  const img = listingImageSrc(car);
  const phone = formatPhone(car.phone);
  const call = telHref(car.phone);
  const wa = waHref(car.phone);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-10">
        <div>
          <Link
            to="/"
            className="text-muted hover:text-fg mb-4 inline-flex h-11 items-center gap-2 text-sm"
          >
            <ArrowLeft className="size-4" />
            All cars
          </Link>
          <div className="bg-surface-2 overflow-hidden rounded-xl">
            {img ? (
              <img src={img} alt={car.title} className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="text-subtle flex aspect-[4/3] items-center justify-center">
                No photo
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-5 lg:pt-14">
          <div>
            <p className="text-subtle text-xs font-medium tracking-[0.16em] uppercase">
              {car.sourceLabel} · {listedLabel(car.postedAt)}
            </p>
            <h1 className="font-display mt-1 text-4xl leading-none font-semibold tracking-wide uppercase sm:text-5xl">
              {car.year ? `${car.year} ` : ""}
              {car.brand}
            </h1>
            <p className="text-muted mt-2 text-lg">{car.model || car.title}</p>
          </div>
          <p className="font-display text-3xl tabular-nums">
            {formatPrice(car.priceMur, car.negotiable)}
          </p>
          <dl className="border-border divide-border grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border">
            <Spec label="Colour">
              {car.color ? (
                <span className="inline-flex items-center gap-2">
                  <span
                    className="size-3 rounded-full border border-border"
                    style={{ background: colorHex(car.color) }}
                  />
                  {car.color}
                </span>
              ) : (
                "—"
              )}
            </Spec>
            <Spec label="Phone">{phone ?? "See original ad"}</Spec>
            <Spec label="Mileage">{formatKm(car.mileageKm) ?? "—"}</Spec>
            <Spec label="Gearbox">{car.transmission ?? "—"}</Spec>
            <Spec label="Fuel">{car.fuel ?? "—"}</Spec>
            <Spec label="Town">{car.location ?? "Mauritius"}</Spec>
          </dl>
          <div className="flex flex-col gap-2 sm:flex-row">
            {call ? (
              <Button asChild className="flex-1">
                <a href={call}>
                  <Phone className="size-4" />
                  Call {phone}
                </a>
              </Button>
            ) : null}
            {wa ? (
              <Button asChild variant="secondary" className="flex-1">
                <a href={wa} target="_blank" rel="noreferrer">
                  WhatsApp
                </a>
              </Button>
            ) : null}
          </div>
          <a
            href={car.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-fg inline-flex h-11 items-center gap-2 text-sm"
          >
            <ExternalLink className="size-4" />
            View on {car.sourceLabel}
          </a>
          <p className="text-subtle flex items-start gap-2 text-xs">
            <MapPin className="mt-0.5 size-3 shrink-0" />
            Confirm the car in person. LotMoris only lists Mauritius ads from the last 90 days.
          </p>
        </div>
      </main>
    </div>
  );
}

function Spec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="text-subtle text-xs tracking-wide uppercase">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}
