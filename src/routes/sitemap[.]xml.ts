import { createFileRoute } from "@tanstack/react-router";
import { getListings } from "@/lib/listings.functions";

function siteOrigin(request: Request): string {
  const fromEnv =
    process.env.SITE_URL?.replace(/\/$/, "") ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/^https?:\/\//, "")}`
      : null);
  if (fromEnv) return fromEnv;
  try {
    return new URL(request.url).origin;
  } catch {
    return "https://car-sales-mru.vercel.app";
  }
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function urlEntry(loc: string, lastmod?: string | null, priority = "0.5"): string {
  const parts = [`    <loc>${xmlEscape(loc)}</loc>`];
  if (lastmod) {
    const d = new Date(lastmod);
    if (!Number.isNaN(d.getTime())) {
      parts.push(`    <lastmod>${d.toISOString()}</lastmod>`);
    }
  }
  parts.push(`    <priority>${priority}</priority>`);
  return `  <url>\n${parts.join("\n")}\n  </url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = siteOrigin(request);
        let listings: Array<{ id: string; scrapedAt?: string | null; postedAt?: string | null }> =
          [];
        let scrapedAt: string | null = null;
        try {
          const payload = await getListings({ data: { refresh: false } });
          listings = payload.listings ?? [];
          scrapedAt = payload.scrapedAt;
        } catch {
          /* homepage-only sitemap if cache/scrape unavailable */
        }

        const urls = [
          urlEntry(`${origin}/`, scrapedAt, "1.0"),
          ...listings.map((row) =>
            urlEntry(
              `${origin}/car/${encodeURIComponent(row.id)}`,
              row.scrapedAt ?? row.postedAt ?? scrapedAt,
              "0.7",
            ),
          ),
        ];

        const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;

        return new Response(body, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
