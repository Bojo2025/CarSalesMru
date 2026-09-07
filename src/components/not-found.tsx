import { Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start gap-4 px-4 py-16 sm:px-6">
        <p className="text-accent text-xs font-medium tracking-[0.18em] uppercase">404</p>
        <h1 className="font-display text-4xl uppercase">Page not found</h1>
        <p className="text-muted text-sm">That route is not on the lot.</p>
        <Button asChild>
          <Link to="/">Back to the lot</Link>
        </Button>
      </main>
    </div>
  );
}
