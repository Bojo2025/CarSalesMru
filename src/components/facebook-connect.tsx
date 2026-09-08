import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, Facebook, RefreshCw, Upload, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { FB_CITY_LINKS, FB_LOGIN_NEXT, FB_MARKET_CARS } from "@/lib/facebook";
import { importFacebookListings, type ListingsPayload } from "@/lib/listings.functions";

export function FacebookConnect({
  payload,
  onPayload,
}: {
  payload: ListingsPayload;
  onPayload: (next: ListingsPayload) => void;
}) {
  const [open, setOpen] = useState(false);
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fbCount = useMemo(
    () => payload.listings.filter((l) => l.source === "facebook").length,
    [payload.listings],
  );
  const importedCount = useMemo(
    () => payload.listings.filter((l) => l.id.startsWith("facebook_imp_")).length,
    [payload.listings],
  );

  function openMarketplace() {
    window.open(FB_LOGIN_NEXT, "_blank", "noopener,noreferrer");
    setNotice(
      "Marketplace opened. Prefer Scrape Facebook first; paste only if you need ads search engines have not indexed yet.",
    );
  }

  async function scrapeLive() {
    setBusy(true);
    setNotice(null);
    try {
      const next = await importFacebookListings({ data: { live: true } });
      onPayload(next);
      setNotice(
        `Facebook scrape finished. ${next.facebookCount} Marketplace cars on the lot now (${next.importedCount} from pastes).`,
      );
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Facebook scrape failed.");
    } finally {
      setBusy(false);
    }
  }

  async function importDaily() {
    if (!paste.trim()) {
      setNotice("Paste Marketplace links and ad text first, then click Import pasted ads.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const next = await importFacebookListings({
        data: { paste },
      });
      onPayload(next);
      if (next.imported === 0) {
        setNotice(next.errors.facebook ?? "Nothing usable in that paste.");
      } else {
        setNotice(
          `Imported ${next.newlyImported} new ad${next.newlyImported === 1 ? "" : "s"} (${next.imported} found in paste). ${next.facebookCount} Facebook cars on the lot now.`,
        );
        setPaste("");
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not import Marketplace ads.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" aria-label="Facebook Marketplace">
          <Facebook className="size-4" />
          <span className="hidden sm:inline">Facebook</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm" />
        <Dialog.Content className="border-border bg-surface data-[state=open]:animate-in fixed top-1/2 left-1/2 z-50 flex max-h-[min(92dvh,760px)] w-[min(calc(100%-1.5rem),34rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-xl border p-5 shadow-lg sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-display text-2xl tracking-wide uppercase">
                Facebook Marketplace
              </Dialog.Title>
              <Dialog.Description className="text-muted mt-1 text-sm">
                {fbCount} Facebook ads on the lot
                {importedCount ? ` · ${importedCount} pasted` : null}. Facebook blocks direct
                scrapes — LotMoris pulls publicly indexed Marketplace ads, and you can paste more.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="border-border hover:bg-surface-2 inline-flex size-11 items-center justify-center rounded-md border"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="rounded-lg border border-accent/40 bg-bg p-4">
            <p className="text-xs font-medium tracking-[0.14em] uppercase">Scrape Facebook ads</p>
            <p className="text-muted mt-1 text-sm">
              Fetches Mauritius Marketplace cars that are publicly indexed (plus the starter list).
              Use the main site <span className="text-fg">Refresh</span> to update all sources at
              once.
            </p>
            <Button className="mt-3 w-full" disabled={busy} onClick={() => void scrapeLive()}>
              <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
              {busy ? "Scraping…" : "Scrape Facebook now"}
            </Button>
          </div>

          <ol className="flex flex-col gap-3">
            <li className="bg-surface-2 rounded-lg p-4">
              <p className="text-xs font-medium tracking-[0.14em] uppercase">Optional: open live feed</p>
              <p className="text-muted mt-1 text-sm">
                Opens Mauritius → Cars if you want to copy ads that scrape missed.
              </p>
              <Button className="mt-3 w-full sm:w-auto" variant="outline" onClick={openMarketplace}>
                <Facebook className="size-4" />
                Open Mauritius cars
              </Button>
            </li>

            <li className="bg-surface-2 rounded-lg p-4">
              <p className="text-xs font-medium tracking-[0.14em] uppercase">Optional: paste more ads</p>
              <p className="text-muted mt-1 text-sm">
                Paste listing links (<span className="text-fg">facebook.com/marketplace/item/…</span>
                ) and ad text. Several ads at once is fine.
              </p>
              <textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                rows={5}
                placeholder={
                  "https://www.facebook.com/marketplace/item/123456789/\nToyota Aqua 2022  Rs 830,000  White  5539 0931  Les Pailles"
                }
                className="border-border bg-bg text-fg placeholder:text-subtle mt-2 w-full resize-y rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                className="mt-3 w-full"
                variant="secondary"
                disabled={busy || !paste.trim()}
                onClick={() => void importDaily()}
              >
                <Upload className="size-4" />
                {busy ? "Importing…" : "Import pasted ads"}
              </Button>
            </li>
          </ol>

          {notice ? <p className="text-sm">{notice}</p> : null}

          <ul className="flex flex-wrap gap-2">
            <li>
              <a
                href={FB_MARKET_CARS}
                target="_blank"
                rel="noreferrer"
                className="border-border hover:bg-surface-2 inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs"
              >
                All cars
                <ExternalLink className="size-3" />
              </a>
            </li>
            {FB_CITY_LINKS.map((city) => (
              <li key={city.href}>
                <a
                  href={city.href}
                  target="_blank"
                  rel="noreferrer"
                  className="border-border hover:bg-surface-2 inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs"
                >
                  {city.label}
                  <ExternalLink className="size-3" />
                </a>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
