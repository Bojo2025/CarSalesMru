import { FACEBOOK_INDEXED_ADS } from "./facebook-seed";
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

const ITEM_RE = /https?:\/\/(?:www\.|m\.)?facebook\.com\/marketplace\/item\/(\d+)/gi;

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

function keepFacebook(row: CarListing): boolean {
  const known = new Set(BRANDS.map((b) => b.toLowerCase()));
  if (!known.has(row.brand.toLowerCase())) return false;
  if (row.priceMur != null && row.priceMur < 20_000) return false;
  if (!row.model) return false;
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

export function listingFromFacebookText(
  url: string,
  text: string,
  imported = false,
): CarListing | null {
  const id = itemIdFromUrl(url);
  if (!id) return null;
  const { brand, model: rawModel } = extractBrand(text);
  const { priceMur, negotiable } = parsePrice(text);
  const year = parseYear(text);
  const model = tidyFacebookModel(rawModel, brand, year);
  const location = extractTown(text);
  if (!location && !/mauritius/i.test(text)) return null;
  return {
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
    postedAt: parsePostedAt(text) ?? new Date(Date.now() - 5 * 86_400_000).toISOString(),
    scrapedAt: new Date().toISOString(),
  };
}

export function listingsFromPaste(paste: string): CarListing[] {
  const raw = paste.replace(/\u00a0/g, " ").trim();
  if (!raw) return [];
  const found = new Map<string, CarListing>();

  const urls = [...raw.matchAll(ITEM_RE)];
  if (urls.length > 0) {
    for (let i = 0; i < urls.length; i++) {
      const match = urls[i];
      const url = match[0];
      const start = match.index ?? 0;
      const end = i + 1 < urls.length ? (urls[i + 1].index ?? raw.length) : raw.length;
      const chunk = raw.slice(start, end);
      const row = listingFromFacebookText(url, `${chunk}\n${raw}`, true);
      if (row) found.set(row.id, row);
    }
  } else {
    const blocks = raw.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
    for (const block of blocks.length ? blocks : [raw]) {
      const urlMatch = block.match(ITEM_RE);
      if (!urlMatch) continue;
      const row = listingFromFacebookText(urlMatch[0], block, true);
      if (row) found.set(row.id, row);
    }
  }
  return [...found.values()].filter(keepFacebook);
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
