import { Link } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function SiteHeader({
  onRefresh,
  refreshing,
  extra,
}: {
  onRefresh?: () => void;
  refreshing?: boolean;
  extra?: ReactNode;
}) {
  return (
    <header className="border-border/80 bg-bg/85 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex min-h-11 items-center gap-3">
          <span className="bg-accent text-primary flex size-8 items-center justify-center rounded-sm" aria-hidden>
            <svg viewBox="0 0 32 32" className="size-5" fill="none">
              <path fill="currentColor" d="M7.2 19.2 10 14.4h12l2.8 4.8H7.2z" />
              <circle cx="10.4" cy="20.6" r="1.6" className="stroke-primary-fg fill-accent" strokeWidth="1.4" />
              <circle cx="21.6" cy="20.6" r="1.6" className="stroke-primary-fg fill-accent" strokeWidth="1.4" />
            </svg>
          </span>
          <span className="font-display text-xl leading-none tracking-wide uppercase">
            LotMoris
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <p className="text-muted hidden text-xs sm:block">Mauritius · last 90 days</p>
          {extra}
          {onRefresh ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh listings"
            >
              <RefreshCw className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}