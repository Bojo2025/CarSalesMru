import { FACEBOOK_INDEXED_ADS } from "./facebook-seed.ts";
import {
  extractBrand,
  extractColor,
  extractPhone,
  parseKm,
  parsePostedAt,
  parsePrice,
  parseYear,
} from "./scrape.server.ts";
import { BRANDS, SOURCE_META, type CarListing } from "./listings.ts";

const TOWNS = [
  "Port Louis",
  "Curepipe",
  "Quatre Bornes",
  "Rose Hill",
  "Beau Bassin",
  "Vacoas",
  "Phoenix",
  "Grand Baie",
  "Moka",
  "Flacq",
  "Mahébourg",
  "Mahebourg",
  "Rose Belle",
  "Terre Rouge",
  "Goodlands",
  "Pamplemousses",
  "Tamarin",
  "Flic en Flac",
  "Les Pailles",
  "The Vale",
  "D'Epinay",
  "Dagotière",
  "Dagotiere",
  "New Grove",
  "Grand Bel Air",
  "Grand Port",
  "Rivière Du Rempart",
  "Plaines Wilhems",
];

const ITEM_RE =
  /https?:\/\/(?:www\.|m\.|web\.)?(?:facebook\.com|fb\.com)\/marketplace\/item\/(\d+)/gi;
const ITEM_PATH_RE = /(?:facebook\.com|fb\.com)\/marketplace\/item\/(\d+)/gi;
const ITEM_ID_ONLY_RE = /marketplace\/item\/(\d+)/gi;

function extractTown(raw: string): string | null {
  for (const town of TOWNS) {
    if (new RegExp(`\\b${town.replace(/[’']/g, "['’]?")}\\b`, "i").test(raw)) {
      return town.replace("Mahebourg", "Mahébourg").replace("Dagotiere", "Dagotière");
    }
  }
  if (/\bMauritius\b/i.test(raw)) return "Mauritius";
  return null;
}

function extractGear(raw: string): string | null {
  if (/\b(automatic|auto)\b/i.test(raw)) return "Automatic";
  if (/\b(manual|manuel)\b/i.test(raw)) return "Manual";
  return null;
}

function extractFuel(raw: string): string | null {
  if (/\bhybrid|plug-in\b/i.test(raw)) return "Hybrid";
  if (/\bdiesel\b/i.test(raw)) return "Diesel";
  if (/\bpetrol|essence\b/i.test(raw)) return "Petrol";
  return null;
}

function keepFacebook(row: CarListing, assumeMauritius = false): boolean {
  const known = new Set(BRANDS.map((b) => b.toLowerCase()));
  if (!known.has(row.brand.toLowerCase())) return false;
  if (row.priceMur != null && row.priceMur < 20_000) return false;
  if (!row.model) return false;
  if (!assumeMauritius && !row.location && !/mauritius/i.test(row.title)) return false;
  if (row.postedAt) {
    const t = new Date(row.postedAt).getTime();
    if (!Number.isNaN(t) && t < Date.now() - 90 * 24 * 60 * 60 * 1000) return false;
  }
  return true;
}

function tidyFacebookModel(model: string, brand: string, year: number | null): string {
  let m = model.replace(new RegExp(`^${brand}\\s+`, "i"), "");
  if (year) m = m.replace(new RegExp(`\\b${year}\\b`, "g"), "");
  m = m.replace(/https?:\/\/\S+/gi, " ");
  m = m.replace(/(?:Rs|MUR|₨)\s*[\d\s,./-]*/gi, " ");
  m = m.replace(/\b(?:tel|call|contact|phone)[:\s]*[\d\s./-]*/gi, " ");
  m = m.replace(
    /\b(?:year|engine|mileage|milleage|transmission|gearbox|colour|color|price|listed|for sale|automatic|manual|petrol|diesel|hybrid|full options?|well maintained|negotiable|neg)\b[:\s]*/gi,
    " ",
  );
  m = m.replace(/\b\d[\d\s,]*\s*(cc|km|kms)\b/gi, " ");
  const loc = TOWNS.map((t) => t.replace(/[èé]/g, "e")).concat(["Mauritius"]).join("|");
  m = m.replace(new RegExp(`\\b(?:${loc}).*$`, "i"), " ");
  m = m.replace(/[^A-Za-z0-9+.\- ]+/g, " ").replace(/\s{2,}/g, " ").trim();
  return m.split(/\s+/).filter(Boolean).slice(0, 4).join(" ");
}

function itemIdFromUrl(url: string): string | null {
  const m = url.match(/marketplace\/item\/(\d+)/i);
  return m?.[1] ?? null;
}

function normalizePaste(paste: string): string {
  let raw = paste.replace(/\u00a0/g, " ");
  // Recover item links from HTML / rich copy
  raw = raw.replace(
    /href=["']([^"']*marketplace\/item\/\d+[^"']*)["']/gi,
    (_m, href: string) => ` ${href} `,
  );
  raw = raw.replace(/\\u002F/g, "/").replace(/\\\//g, "/");
  return raw.trim();
}

function collectItemIds(raw: string): string[] {
  const ids = new Set<string>();
  for (const re of [ITEM_RE, ITEM_PATH_RE, ITEM_ID_ONLY_RE]) {
    re.lastIndex = 0;
    for (const match of raw.matchAll(re)) {
      if (match[1]) ids.add(match[1]);
    }
  }
  return [...ids];
}

export function listingFromFacebookText(
  url: string,
  text: string,
  imported = false,
  opts?: { assumeMauritius?: boolean },
): CarListing | null {
  const id = itemIdFromUrl(url);
  if (!id) return null;
  const { brand, model: rawModel } = extractBrand(text);
  const { priceMur, negotiable } = parsePrice(text);
  const year = parseYear(text);
  const model = tidyFacebookModel(rawModel, brand, year);
  const location = extractTown(text) ?? (opts?.assumeMauritius ? "Mauritius" : null);
  if (!location && !/mauritius/i.test(text) && !opts?.assumeMauritius) return null;
  const row: CarListing = {
    id: imported ? `facebook_imp_${id}` : `facebook_${id}`,
    source: "facebook",
    sourceLabel: SOURCE_META.facebook.label,
    sourceUrl: `https://www.facebook.com/marketplace/item/${id}/`,
    title: `${year ? year + " " : ""}${brand} ${model}`.trim(),
    brand,
    model,
    year,
    color: extractColor(text),
    phone: extractPhone(text),
    priceMur,
    negotiable,
    mileageKm: parseKm(text),
    transmission: extractGear(text),
    fuel: extractFuel(text),
    location: location ?? "Mauritius",
    imageUrl: null,
    postedAt: parsePostedAt(text) ?? new Date().toISOString(),
    scrapedAt: new Date().toISOString(),
  };
  return keepFacebook(row, Boolean(opts?.assumeMauritius)) ? row : null;
}

/**
 * Parse one or many Marketplace ads from a daily paste.
 * Accepts plain text, multiple item links, or HTML copied from Facebook.
 * Pastes from Mauritius Marketplace pages may omit the word "Mauritius" on each card.
 */
export function listingsFromPaste(paste: string): CarListing[] {
  const raw = normalizePaste(paste);
  if (!raw) return [];
  const assumeMauritius =
    /mauritius|106248356079603|108648475832509|106069382765976|port louis|curepipe|quatre bornes/i.test(
      raw,
    );
  const found = new Map<string, CarListing>();
  const ids = collectItemIds(raw);

  if (ids.length > 0) {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const url = `https://www.facebook.com/marketplace/item/${id}/`;
      const lower = raw.toLowerCase();
      const marker = `marketplace/item/${id}`;
      const idIndex = lower.indexOf(marker);
      const nextId = ids[i + 1];
      const nextIndex =
        nextId != null ? lower.indexOf(`marketplace/item/${nextId}`, idIndex + 1) : -1;
      const end = nextIndex > idIndex ? nextIndex : raw.length;
      // Segment is this link through the start of the next link (ad text usually follows the URL).
      const chunk = idIndex >= 0 ? raw.slice(idIndex, end) : raw;
      const row =
        listingFromFacebookText(url, chunk, true, { assumeMauritius }) ??
        listingFromFacebookText(url, `${chunk}\nMauritius`, true, { assumeMauritius: true });
      if (row) found.set(row.id, row);
    }
    return [...found.values()];
  }

  // No URLs: try double-newline blocks that still mention a known brand + price
  const blocks = raw.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  for (const block of blocks.length ? blocks : [raw]) {
    const urlMatch = block.match(ITEM_RE) ?? block.match(ITEM_PATH_RE);
    if (!urlMatch) continue;
    const row = listingFromFacebookText(urlMatch[0], block, true, { assumeMauritius });
    if (row) found.set(row.id, row);
  }
  return [...found.values()];
}

export function scrapeFacebook(): CarListing[] {
  const out: CarListing[] = [];
  const seen = new Set<string>();
  for (const ad of FACEBOOK_INDEXED_ADS) {
    const row = listingFromFacebookText(ad.url, ad.text, false);
    if (!row || seen.has(row.id) || !keepFacebook(row)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

const FB_SEARCH_QUERIES = [
  "site:facebook.com/marketplace/item Mauritius Toyota Rs",
  "site:facebook.com/marketplace/item Mauritius Honda Rs",
  "site:facebook.com/marketplace/item Mauritius Nissan Rs",
  "site:facebook.com/marketplace/item Mauritius Aqua Fit Vitz",
  "site:facebook.com/marketplace/item Port Louis car Rs Mauritius",
  "site:facebook.com/marketplace/item Curepipe car Rs Mauritius",
  "site:facebook.com/marketplace/item Quatre Bornes car Rs",
  "site:facebook.com/marketplace/item Mauritius BMW Mercedes Rs",
];

async function fetchDuckDuckGoHtml(query: string): Promise<string> {
  const body = new URLSearchParams({ q: query });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      body,
      redirect: "follow",
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function listingsFromSearchHtml(html: string): CarListing[] {
  if (!html || /anomaly-modal|bots use DuckDuckGo/i.test(html)) return [];
  const decoded = html
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/gi, "/")
    .replace(/\\u002F/g, "/")
    .replace(/%2F/gi, "/");
  const found = new Map<string, CarListing>();
  const idRe = /marketplace\/item\/(\d{8,})/gi;
  const ids = [...new Set([...decoded.matchAll(idRe)].map((m) => m[1]))];
  for (const id of ids) {
    const marker = `marketplace/item/${id}`;
    const idx = decoded.toLowerCase().indexOf(marker.toLowerCase());
    const window =
      idx >= 0
        ? decoded.slice(Math.max(0, idx - 120), Math.min(decoded.length, idx + 420))
        : "";
    const textBlob = `${window} Mauritius`.replace(/<[^>]+>/g, " ");
    const row = listingFromFacebookText(
      `https://www.facebook.com/marketplace/item/${id}/`,
      textBlob,
      false,
      { assumeMauritius: true },
    );
    if (row) found.set(row.id, row);
  }
  return [...found.values()];
}

function isUsableFacebookPhoto(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    // Site logos / favicons, not listing photos
    if (path.includes("rsrc.php")) return false;
    if (/\.(ico|svg)(\?|$)/i.test(path)) return false;
    return (
      host.endsWith(".fbcdn.net") ||
      host === "fbcdn.net" ||
      host.endsWith(".fbsbx.com") ||
      host === "fbsbx.com" ||
      host === "lookaside.fbsbx.com"
    );
  } catch {
    return false;
  }
}

function normalizeMarketplaceItemUrl(itemUrl: string): string {
  try {
    const u = new URL(itemUrl);
    const m = u.pathname.match(/\/marketplace\/item\/(\d+)/i);
    if (m) return `https://www.facebook.com/marketplace/item/${m[1]}/`;
  } catch {
    /* fall through */
  }
  return itemUrl.endsWith("/") ? itemUrl : `${itemUrl}/`;
}

function extractOgImage(html: string): string | null {
  const patterns = [
    /property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    /content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    /property=["']og:image:url["'][^>]*content=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const cleaned = m[1].replace(/&amp;/g, "&").trim();
      if (isUsableFacebookPhoto(cleaned)) return cleaned;
    }
  }
  return null;
}

async function fetchMarketplacePreviewImage(itemUrl: string): Promise<string | null> {
  const target = normalizeMarketplaceItemUrl(itemUrl);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    // Facebook serves OG preview tags to the externalhit crawler UA
    const res = await fetch(target, {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    if (res.ok) {
      const html = await res.text();
      const og = extractOgImage(html);
      if (og) return og;
    }
  } catch {
    /* try microlink fallback */
  } finally {
    clearTimeout(timer);
  }

  const ctrl2 = new AbortController();
  const timer2 = setTimeout(() => ctrl2.abort(), 8_000);
  try {
    const api = `https://api.microlink.io/?url=${encodeURIComponent(target)}`;
    const res = await fetch(api, {
      signal: ctrl2.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      status?: string;
      data?: { image?: { url?: string } | string };
    };
    if (json.status && json.status !== "success") return null;
    const raw = json.data?.image;
    const url = typeof raw === "string" ? raw : raw?.url;
    if (!url || typeof url !== "string") return null;
    const cleaned = url.replace(/&amp;/g, "&").trim();
    if (!isUsableFacebookPhoto(cleaned)) return null;
    return cleaned;
  } catch {
    return null;
  } finally {
    clearTimeout(timer2);
  }
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }
  const n = Math.min(limit, Math.max(items.length, 1));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return out;
}

/** Best-effort: attach Marketplace preview photos (Facebook blocks direct scrapes). */
export async function enrichFacebookImages(
  listings: CarListing[],
  opts?: { limit?: number; concurrency?: number },
): Promise<CarListing[]> {
  const limit = opts?.limit ?? 24;
  const concurrency = opts?.concurrency ?? 4;
  const need = listings.filter((l) => l.source === "facebook" && !l.imageUrl).slice(0, limit);
  if (need.length === 0) return listings;

  const images = await mapPool(need, concurrency, async (row) => {
    const imageUrl = await fetchMarketplacePreviewImage(row.sourceUrl);
    return { id: row.id, imageUrl };
  });

  const byId = new Map(images.map((x) => [x.id, x.imageUrl]));
  return listings.map((row) => {
    const imageUrl = byId.get(row.id);
    return imageUrl ? { ...row, imageUrl } : row;
  });
}

/** Seed ads + best-effort live discovery via public search indexes (Facebook blocks direct scrapes). */
export async function scrapeFacebookLive(): Promise<CarListing[]> {
  const byUrl = new Map<string, CarListing>();
  for (const row of scrapeFacebook()) byUrl.set(row.sourceUrl, row);

  const htmls = await Promise.all(FB_SEARCH_QUERIES.map((q) => fetchDuckDuckGoHtml(q)));
  for (const html of htmls) {
    for (const row of listingsFromSearchHtml(html)) {
      byUrl.set(row.sourceUrl, row);
    }
  }

  return enrichFacebookImages([...byUrl.values()], { limit: 28, concurrency: 4 });
}
