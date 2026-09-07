# LotMoris

Every car for sale in Mauritius, in one place.

LotMoris is a TanStack Start app that gathers public classifieds from the island’s main listing sites so you can compare photos, brand, colour, price and the seller’s number without hopping between five websites. Only ads from the last 90 days are kept.

## Features

- Live scrape of [MyCar.mu](https://www.mycar.mu/car/buy), [Mega Motors](https://motors.mega.mu/), [CarMoris](https://www.carmoris.com/en), [Autocloud](https://autocloud.mu/used-cars-for-sale) and [Parbo Auto](https://www.parboauto.com/)
- Facebook Marketplace Mauritius cars from an indexed seed, plus paste-import of public Marketplace item links
- Search and filters: brand, colour, source, max price
- Listing detail with call and WhatsApp links
- Image proxy so listing photos load from this origin
- Local cache in embedded Postgres (PGLite); optional Neon/Postgres in production

## Requirements

- Node.js 22 or newer

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Leave `DATABASE_URL` empty for local development. The app starts an in-memory Postgres (PGLite) and applies `migrations/0002_listings.sql` on boot.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build and DB migrate |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript |
| `npm test` | Parser unit tests |
| `npm run lint` | ESLint |

## Deploy

The Vite config uses Nitro’s Vercel preset.

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Set `DATABASE_URL` to a Postgres URL (for example a [Neon](https://neon.tech) pooled connection string).
4. Deploy. Build command is `npm run build`.

On each deploy, `scripts/migrate.mjs` applies pending files in `migrations/` when `DATABASE_URL` is set.

## How listings are collected

Server functions in `src/lib/listings.functions.ts` call `scrapeAll()` in `src/lib/scrape.server.ts`. Each source fetches public HTML, parses it with Cheerio, and maps ads into a shared `CarListing` shape. Results are cached in memory and, when a database is available, in the `listings` table.

Facebook Marketplace is not scraped live (there is no public API). `src/lib/facebook-seed.ts` holds indexed Mauritius ads; visitors can paste a public `facebook.com/marketplace/item/…` listing to add another.

Respect the source sites. Confirm price, condition and ownership with the seller on the original ad before you buy.

## Stack

- [TanStack Start](https://tanstack.com/start) + React 19
- Vite 8, Tailwind CSS 4
- Cheerio (HTML parsing)
- PGLite locally, `pg` against Postgres in production
