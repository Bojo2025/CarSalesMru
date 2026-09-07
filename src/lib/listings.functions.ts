import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { CarListing, SourceId } from "@/lib/listings";

export type ListingsPayload = {
  listings: CarListing[];
  okSources: SourceId[];
  errors: Record<string, string>;
  scrapedAt: string | null;
  fromCache: boolean;
};

let memoryCache: ListingsPayload | null = null;

function shouldUseDb(): boolean {
  if (typeof process === "undefined") return false;
  if (process.env.DATABASE_URL) return true;
  return process.env.NODE_ENV !== "production";
}

async function sqlClient() {
  if (!shouldUseDb()) return null;
  const { getSql } = await import("@/lib/db");
  return getSql();
}

async function readCache(): Promise<ListingsPayload | null> {
  if (memoryCache?.listings.length) return memoryCache;
  try {
    const sql = await sqlClient();
    if (!sql) return memoryCache;
    const runs = await sql<{
      ran_at: string;
      ok_sources: string;
      listing_count: number;
      error: string | null;
    }>`select ran_at, ok_sources, listing_count, error from scrape_runs where id = ${"latest"} limit 1`;
    const run = runs[0];
    if (!run) return memoryCache;
    const rows = await sql<{ payload: string }>`
      select payload from listings order by posted_at desc nulls last, scraped_at desc
    `;
    const listings: CarListing[] = [];
    for (const row of rows) {
      try {
        listings.push(JSON.parse(row.payload) as CarListing);
      } catch {
        /* skip */
      }
    }
    const payload: ListingsPayload = {
      listings,
      okSources: run.ok_sources ? (run.ok_sources.split(",").filter(Boolean) as SourceId[]) : [],
      errors: run.error ? { scrape: run.error } : {},
      scrapedAt: run.ran_at,
      fromCache: true,
    };
    memoryCache = payload;
    return payload;
  } catch {
    return memoryCache;
  }
}

async function writeCache(payload: {
  listings: CarListing[];
  okSources: SourceId[];
  errors: Record<string, string>;
  scrapedAt: string;
}) {
  const stored: ListingsPayload = { ...payload, fromCache: true };
  memoryCache = stored;
  try {
    const sql = await sqlClient();
    if (!sql) return;
    await sql`delete from listings`;
    for (const item of payload.listings) {
      await sql`
        insert into listings (id, payload, posted_at, scraped_at)
        values (${item.id}, ${JSON.stringify(item)}, ${item.postedAt}, ${item.scrapedAt})
      `;
    }
    const errText = Object.entries(payload.errors)
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ")
      .slice(0, 1000);
    await sql`delete from scrape_runs where id = ${"latest"}`;
    await sql`
      insert into scrape_runs (id, ran_at, ok_sources, listing_count, error)
      values (
        ${"latest"},
        ${payload.scrapedAt},
        ${payload.okSources.join(",")},
        ${payload.listings.length},
        ${errText || null}
      )
    `;
  } catch {
    /* memory cache still holds the data */
  }
}

async function importedFacebookAds(): Promise<CarListing[]> {
  const fromMemory = (memoryCache?.listings ?? []).filter((l) =>
    l.id.startsWith("facebook_imp_"),
  );
  if (fromMemory.length) return fromMemory;
  const cached = await readCache();
  return (cached?.listings ?? []).filter((l) => l.id.startsWith("facebook_imp_"));
}

async function runScrape(): Promise<ListingsPayload> {
  const imported = await importedFacebookAds();
  const { scrapeAll } = await import("@/lib/scrape.server");
  const result = await scrapeAll();
  const seedUrls = new Set(
    result.listings.filter((l) => l.source === "facebook").map((l) => l.sourceUrl),
  );
  const extra = imported.filter((l) => !seedUrls.has(l.sourceUrl));
  const merged = extra.length
    ? {
        ...result,
        listings: [...result.listings, ...extra],
      }
    : result;
  if (extra.length && !merged.okSources.includes("facebook")) {
    merged.okSources = [...merged.okSources, "facebook"];
  }
  await writeCache(merged);
  return { ...merged, fromCache: false };
}

const empty = (): ListingsPayload => ({
  listings: [],
  okSources: [],
  errors: {},
  scrapedAt: null,
  fromCache: true,
});

export const getListings = createServerFn({ method: "GET" })
  .validator(z.object({ refresh: z.boolean().optional() }).optional())
  .handler(async ({ data }) => {
    const cached = await readCache();
    if (!data?.refresh && cached?.listings.length) {
      if (!cached.listings.some((l) => l.source === "facebook")) {
        const { scrapeFacebook } = await import("@/lib/facebook.server");
        const facebook = scrapeFacebook();
        const okSources = Array.from(new Set([...cached.okSources, "facebook"])) as SourceId[];
        const merged = {
          listings: [...cached.listings, ...facebook],
          okSources,
          errors: cached.errors,
          scrapedAt: cached.scrapedAt ?? new Date().toISOString(),
        };
        await writeCache(merged);
        return { ...merged, fromCache: true };
      }
      return cached;
    }
    try {
      return await runScrape();
    } catch (err) {
      if (cached && cached.listings.length > 0) {
        return {
          ...cached,
          errors: {
            ...cached.errors,
            scrape: err instanceof Error ? err.message : "Refresh failed",
          },
        };
      }
      return {
        ...empty(),
        fromCache: false,
        errors: { scrape: err instanceof Error ? err.message : "Scrape failed" },
      };
    }
  });

export const refreshListings = createServerFn({ method: "POST" }).handler(async () => {
  try {
    return await runScrape();
  } catch (err) {
    const cached = await readCache();
    if (cached && cached.listings.length > 0) {
      return {
        ...cached,
        errors: {
          ...cached.errors,
          scrape: err instanceof Error ? err.message : "Refresh failed",
        },
      };
    }
    throw err;
  }
});

export const getListing = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const mem = memoryCache?.listings.find((l) => l.id === data.id);
    if (mem) return mem;
    try {
      const sql = await sqlClient();
      if (!sql) return null;
      const rows = await sql<{ payload: string }>`
        select payload from listings where id = ${data.id} limit 1
      `;
      if (!rows[0]) return null;
      return JSON.parse(rows[0].payload) as CarListing;
    } catch {
      return null;
    }
  });

export const importFacebookListings = createServerFn({ method: "POST" })
  .validator(
    z.object({
      paste: z.string().max(100_000).optional(),
      /** When true, only keep seed + newly pasted ads (ignore prior imports). */
      replaceImports: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { listingsFromPaste, scrapeFacebook } = await import("@/lib/facebook.server");
    let cached = (await readCache()) ?? empty();
    if (!cached.listings.some((l) => l.source !== "facebook")) {
      try {
        cached = await runScrape();
      } catch {
        /* keep whatever we have */
      }
    }
    const pasted = data.paste?.trim() ? listingsFromPaste(data.paste) : [];
    const seeded = scrapeFacebook();
    const priorImported = data.replaceImports
      ? []
      : cached.listings.filter((l) => l.id.startsWith("facebook_imp_"));
    const existingUrls = new Set(
      [...seeded, ...priorImported].map((l) => l.sourceUrl),
    );
    const newlyImported = pasted.filter((row) => !existingUrls.has(row.sourceUrl));
    const others = cached.listings.filter((l) => l.source !== "facebook");
    const byUrl = new Map<string, CarListing>();
    for (const row of [...seeded, ...priorImported, ...pasted]) {
      byUrl.set(row.sourceUrl, row);
    }
    const facebook = [...byUrl.values()];
    const okSources = Array.from(new Set([...cached.okSources, "facebook"])) as SourceId[];
    const errors = { ...cached.errors };
    delete errors.facebook;
    if (data.paste?.trim() && pasted.length === 0) {
      errors.facebook =
        "No Marketplace car ads found. Paste one or more facebook.com/marketplace/item/… links plus each ad’s text (brand, price, phone, town).";
    }
    const payload = {
      listings: [...others, ...facebook],
      okSources,
      errors,
      scrapedAt: new Date().toISOString(),
    };
    await writeCache(payload);
    return {
      ...payload,
      fromCache: false,
      imported: pasted.length,
      newlyImported: newlyImported.length,
      facebookCount: facebook.length,
      importedCount: facebook.filter((l) => l.id.startsWith("facebook_imp_")).length,
    };
  });
