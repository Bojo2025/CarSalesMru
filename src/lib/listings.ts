export type SourceId = "mycar" | "mega" | "carmoris" | "autocloud" | "parbo" | "facebook";

export type CarListing = {
  id: string;
  source: SourceId;
  sourceLabel: string;
  sourceUrl: string;
  title: string;
  brand: string;
  model: string;
  year: number | null;
  color: string | null;
  phone: string | null;
  priceMur: number | null;
  negotiable: boolean;
  mileageKm: number | null;
  transmission: string | null;
  fuel: string | null;
  location: string | null;
  imageUrl: string | null;
  postedAt: string | null;
  scrapedAt: string;
};

export const SOURCE_META: Record<
  SourceId,
  { label: string; home: string; blurb: string }
> = {
  mycar: {
    label: "MyCar.mu",
    home: "https://www.mycar.mu/car/buy",
    blurb: "Mauritius’ largest vehicle marketplace",
  },
  mega: {
    label: "Mega Motors",
    home: "https://motors.mega.mu/",
    blurb: "L’express Mega classifieds",
  },
  carmoris: {
    label: "CarMoris",
    home: "https://www.carmoris.com/en",
    blurb: "Buy & sell cars across the island",
  },
  autocloud: {
    label: "Autocloud",
    home: "https://autocloud.mu/used-cars-for-sale",
    blurb: "Used cars, imports and dealers",
  },
  parbo: {
    label: "Parbo Auto",
    home: "https://www.parboauto.com/",
    blurb: "Reconditioned stock in Floréal",
  },
  facebook: {
    label: "Facebook Marketplace",
    home: "https://www.facebook.com/marketplace/106248356079603/cars/",
    blurb: "Mauritius cars on Marketplace, last 90 days",
  },
};

export const BRANDS = [
  "Toyota",
  "Honda",
  "Nissan",
  "Mazda",
  "Mitsubishi",
  "Suzuki",
  "Hyundai",
  "Kia",
  "BMW",
  "Mercedes-Benz",
  "Mercedes",
  "Audi",
  "Volkswagen",
  "Peugeot",
  "Renault",
  "Citroen",
  "Citroën",
  "Ford",
  "Isuzu",
  "Chevrolet",
  "Land Rover",
  "Range Rover",
  "Jaguar",
  "Mini",
  "MINI",
  "Porsche",
  "Volvo",
  "Subaru",
  "Lexus",
  "Jeep",
  "Fiat",
  "MG",
  "GWM",
  "Haval",
  "Perodua",
  "Proton",
  "Opel",
  "Skoda",
  "Škoda",
  "BYD",
  "Tesla",
  "Daihatsu",
  "Alfa Romeo",
  "Mahindra",
  "Riddara",
] as const;

export const COLOR_NAMES = [
  "White",
  "Pearl White",
  "Black",
  "Silver",
  "Grey",
  "Gray",
  "Charcoal",
  "Red",
  "Blue",
  "Navy",
  "Green",
  "Brown",
  "Beige",
  "Bronze",
  "Gold",
  "Champagne",
  "Orange",
  "Yellow",
  "Maroon",
  "Wine",
  "Purple",
  "Pink",
  "Cream",
  "Ivory",
  "Pearl",
  "Gunmetal",
  "Burgundy",
  "Turquoise",
] as const;

const COLOR_HEX: Record<string, string> = {
  white: "#e8e4dc",
  "pearl white": "#f4f1ea",
  pearl: "#f4f1ea",
  ivory: "#f3ead8",
  cream: "#e6d7b8",
  black: "#1a1a1a",
  silver: "#c5c7ca",
  grey: "#8a8d91",
  gray: "#8a8d91",
  charcoal: "#3a3d41",
  gunmetal: "#4a4e54",
  red: "#9c2b2b",
  maroon: "#6b1d2a",
  wine: "#6b1d2a",
  burgundy: "#6b1d2a",
  blue: "#2c4a7a",
  navy: "#1c2e52",
  green: "#2f5a3a",
  brown: "#5c3d2e",
  beige: "#c8b89a",
  bronze: "#8a6a3e",
  gold: "#b39856",
  champagne: "#d4c4a0",
  orange: "#c45c26",
  yellow: "#c9b24a",
  purple: "#5a3d6b",
  pink: "#c9899b",
  turquoise: "#2f6f6a",
};

export function colorHex(color: string | null | undefined): string {
  if (!color) return "#8a8d91";
  return COLOR_HEX[color.toLowerCase()] ?? "#8a8d91";
}

export function formatPrice(mur: number | null, negotiable?: boolean): string {
  if (mur == null) return negotiable ? "Negotiable" : "Price on request";
  const formatted = new Intl.NumberFormat("en-MU").format(mur);
  return `Rs ${formatted}`;
}

export function formatPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("230") ? digits.slice(3) : digits;
  if (local.length !== 8) return phone;
  return `+230 ${local.slice(0, 4)} ${local.slice(4)}`;
}

export function telHref(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("230") ? digits.slice(3) : digits;
  if (local.length !== 8) return `tel:${phone}`;
  return `tel:+230${local}`;
}

export function waHref(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("230") ? digits.slice(3) : digits;
  if (local.length !== 8) return null;
  return `https://wa.me/230${local}`;
}

export function formatKm(km: number | null): string | null {
  if (km == null) return null;
  return `${new Intl.NumberFormat("en-MU").format(km)} km`;
}

export function listedLabel(iso: string | null): string {
  if (!iso) return "Listed recently";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "Listed recently";
  const days = Math.max(0, Math.round((Date.now() - t) / 86_400_000));
  if (days <= 0) return "Listed today";
  if (days === 1) return "Listed yesterday";
  if (days < 7) return `Listed ${days} days ago`;
  if (days < 14) return "Listed last week";
  const weeks = Math.round(days / 7);
  if (days < 31) return `Listed ${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.max(1, Math.round(days / 30));
  return `Listed ${months} month${months === 1 ? "" : "s"} ago`;
}

export function proxiedImage(url: string | null | undefined): string | null {
  if (!url) return null;
  return `/api/img?u=${encodeURIComponent(url)}`;
}

/** Prefer stored photo; for Facebook, fall back to on-demand Marketplace preview resolve. */
export function listingImageSrc(car: Pick<CarListing, "imageUrl" | "source" | "sourceUrl">): string | null {
  if (car.imageUrl) return proxiedImage(car.imageUrl);
  if (car.source !== "facebook") return null;
  const id = car.sourceUrl.match(/marketplace\/item\/(\d+)/i)?.[1];
  return id ? `/api/img?fb=${encodeURIComponent(id)}` : null;
}
