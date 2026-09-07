import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, Facebook, Upload, X } from "lucide-react";
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
      "Marketplace opened. Copy listing links + text from cars for sale in Mauritius, then paste them below and click Import.",
    );
  }

  async function importDaily() {
    if (!paste.trim()) {
      setNotice("Paste Marketplace links and ad text first, then click Import today’s ads.");
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

  async function reloadSeed() {
    setBusy(true);
    setNotice(null);
    try {
      const next = await importFacebookListings({ data: { paste: "" } });
      onPayload(next);
      setNotice(
        `Reloaded indexed ads. ${next.facebookCount} Facebook cars on the lot (${next.importedCount} from your daily imports).`,
      );
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not reload Facebook ads.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" aria-label="Import Facebook Marketplace ads">
          <Facebook className="size-4" />
          <span className="hidden sm:inline">Import FB</span>
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out fixed inset-0 z-50 bg-bg/80 backdrop-blur-sm" />
        <Dialog.Content className="border-border bg-surface data-[state=open]:animate-in fixed top-1/2 left-1/2 z-50 flex max-h-[min(92dvh,760px)] w-[min(calc(100%-1.5rem),34rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-xl border p-5 shadow-lg sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-display text-2xl tracking-wide uppercase">
                Daily Facebook import
              </Dialog.Title>
              <Dialog.Description className="text-muted mt-1 text-sm">
                {fbCount} Facebook ads on the lot
                {importedCount ? ` · ${importedCount} from your imports` : null}. Facebook has no
                public Marketplace API — paste ads once a day from your browser.
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

          <ol className="flex flex-col gap-3">
            <li className="bg-surface-2 rounded-lg p-4">
              <p className="text-xs font-medium tracking-[0.14em] uppercase">1. Open Marketplace</p>
              <p className="text-muted mt-1 text-sm">
                Opens Mauritius → Cars. Sign in on Facebook if asked. Stay on that tab to copy ads.
              </p>
              <Button className="mt-3 w-full sm:w-auto" onClick={openMarketplace}>
                <Facebook className="size-4" />
                Open Mauritius cars
              </Button>
            </li>

            <li className="bg-surface-2 rounded-lg p-4">
              <p className="text-xs font-medium tracking-[0.14em] uppercase">2. Copy ads</p>
              <p className="text-muted mt-1 text-sm">
                For each car (or a batch): copy the listing link (
                <span className="text-fg">facebook.com/marketplace/item/…</span>) and the visible
                text — brand, price, colour, phone, town. Paste several ads together; one blank line
                between them is fine.
              </p>
            </li>

            <li className="rounded-lg border border-accent/40 bg-bg p-4">
              <p className="text-xs font-medium tracking-[0.14em] uppercase">3. Import today’s ads</p>
              <textarea
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                rows={7}
                placeholder={
                  "https://www.facebook.com/marketplace/item/123456789/\nToyota Aqua 2022  Rs 830,000  White  5539 0931  Les Pailles\n\nhttps://www.facebook.com/marketplace/item/987654321/\nHonda Fit 2018 Rs 495,000 Port Louis"
                }
                className="border-border bg-surface text-fg placeholder:text-subtle mt-2 w-full resize-y rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                className="mt-3 w-full"
                disabled={busy || !paste.trim()}
                onClick={() => void importDaily()}
              >
                <Upload className="size-4" />
                {busy ? "Importing…" : "Import today’s ads"}
              </Button>
            </li>
          </ol>

          {notice ? <p className="text-sm">{notice}</p> : null}

          <div className="border-border flex flex-col gap-2 border-t pt-4">
            <p className="text-xs font-medium tracking-[0.14em] uppercase">Also on this lot</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={busy}
              onClick={() => void reloadSeed()}
            >
              Reload starter Facebook ads
            </Button>
            <ul className="mt-1 flex flex-wrap gap-2">
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
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
