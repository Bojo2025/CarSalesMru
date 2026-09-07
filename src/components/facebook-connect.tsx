import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, Facebook, X } from "lucide-react";
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
  const [openedFb, setOpenedFb] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fbCount = useMemo(
    () => payload.listings.filter((l) => l.source === "facebook").length,
    [payload.listings],
  );

  function openFacebookLogin() {
    window.open(FB_LOGIN_NEXT, "_blank", "noopener,noreferrer");
    setOpenedFb(true);
    setNotice("Facebook opened in a new tab. Copy a public Marketplace ad if you want to paste it here.");
  }

  async function pullAds(withPaste = false) {
    setBusy(true);
    setNotice(null);
    try {
      const next = await importFacebookListings({
        data: { paste: withPaste ? paste : "" },
      });
      onPayload(next);
      if (withPaste && next.imported === 0) {
        setNotice(next.errors.facebook ?? "Nothing new in that paste.");
      } else {
        setNotice(
          `${next.facebookCount} Mauritius Marketplace cars from the last 90 days are on LotMoris.`,
        );
        if (withPaste) setPaste("");
      }
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not pull Marketplace ads.");
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
        <Dialog.Content className="border-border bg-surface data-[state=open]:animate-in fixed top-1/2 left-1/2 z-50 flex max-h-[min(92dvh,720px)] w-[min(calc(100%-1.5rem),32rem)] -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-xl border p-5 shadow-lg sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="font-display text-2xl tracking-wide uppercase">
                Facebook Marketplace
              </Dialog.Title>
              <Dialog.Description className="text-muted mt-1 text-sm">
                Mauritius cars from the last 90 days. {fbCount} ads on the lot now.
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

          <p className="text-muted text-sm">
            Facebook does not offer a public Marketplace API. LotMoris never asks for your
            Facebook password. Indexed Mauritius car ads ship with the site; you can also paste
            a public Marketplace listing to add it.
          </p>

          <ol className="flex flex-col gap-3">
            <li className="bg-surface-2 rounded-lg p-4">
              <p className="text-xs font-medium tracking-[0.14em] uppercase">1. Open Facebook</p>
              <p className="text-muted mt-1 text-sm">
                Opens Marketplace → Cars for Mauritius in a new tab. Sign in there if you want to
                copy a live ad.
              </p>
              <Button className="mt-3 w-full sm:w-auto" onClick={openFacebookLogin}>
                <Facebook className="size-4" />
                Open Marketplace
              </Button>
            </li>
            <li className="bg-surface-2 rounded-lg p-4">
              <p className="text-xs font-medium tracking-[0.14em] uppercase">2. Load indexed ads</p>
              <p className="text-muted mt-1 text-sm">
                Reloads the Mauritius Marketplace cars already indexed on LotMoris (last 90 days).
              </p>
              <Button
                className="mt-3 w-full sm:w-auto"
                variant={openedFb ? "default" : "secondary"}
                disabled={busy}
                onClick={() => void pullAds(false)}
              >
                {busy ? "Loading ads…" : "Load Marketplace cars"}
              </Button>
            </li>
          </ol>

          <div>
            <p className="text-xs font-medium tracking-[0.14em] uppercase">Add ads from your feed</p>
            <p className="text-muted mt-1 text-sm">
              While you are logged in on Facebook, copy a listing link
              (facebook.com/marketplace/item/…) and the ad text — brand, price, colour, phone —
              then paste it here.
            </p>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={4}
              placeholder="https://www.facebook.com/marketplace/item/…&#10;Toyota Aqua 2022  Rs 830,000  White  5539 0931  Les Pailles"
              className="border-border bg-bg text-fg placeholder:text-subtle mt-2 w-full resize-y rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button
              className="mt-2"
              variant="outline"
              disabled={busy || !paste.trim()}
              onClick={() => void pullAds(true)}
            >
              Add pasted ads
            </Button>
          </div>

          {notice ? <p className="text-sm">{notice}</p> : null}

          <div>
            <p className="text-xs font-medium tracking-[0.14em] uppercase">Open live Marketplace</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              <li>
                <a
                  href={FB_MARKET_CARS}
                  target="_blank"
                  rel="noreferrer"
                  className="border-border hover:bg-surface-2 inline-flex h-11 items-center gap-1.5 rounded-md border px-3 text-sm"
                >
                  All cars
                  <ExternalLink className="size-3.5" />
                </a>
              </li>
              {FB_CITY_LINKS.map((city) => (
                <li key={city.href}>
                  <a
                    href={city.href}
                    target="_blank"
                    rel="noreferrer"
                    className="border-border hover:bg-surface-2 inline-flex h-11 items-center gap-1.5 rounded-md border px-3 text-sm"
                  >
                    {city.label}
                    <ExternalLink className="size-3.5" />
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
