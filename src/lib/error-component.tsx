import type { ErrorComponentProps } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return "An unexpected error occurred. Try reloading the page.";
}

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="bg-bg text-fg flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-accent" aria-hidden="true">
        <TriangleAlert className="size-10" strokeWidth={2} />
      </span>
      <h1 className="font-display text-3xl uppercase">Something went wrong</h1>
      <p className="text-muted max-w-md text-sm break-words">{errorMessage(error)}</p>
      <Button asChild>
        <Link to="/">Back to the lot</Link>
      </Button>
    </main>
  );
}
