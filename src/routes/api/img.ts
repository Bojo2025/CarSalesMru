import { createFileRoute } from "@tanstack/react-router";

const ALLOWED = new Set([
  "www.mycar.mu",
  "mycar.mu",
  "cdn1.mega.mu",
  "cdn.mega.mu",
  "motors.mega.mu",
  "carmoris.s3.amazonaws.com",
  "carmoris.com",
  "www.carmoris.com",
  "cdn.autocloud.mu",
  "static.autocloud.mu",
  "autocloud.mu",
  "images.parboauto.com",
  "www.parboauto.com",
  "parboauto.com",
]);

function isAllowedImageHost(hostname: string): boolean {
  if (ALLOWED.has(hostname)) return true;
  const host = hostname.toLowerCase();
  return (
    host.endsWith(".fbcdn.net") ||
    host === "fbcdn.net" ||
    host.endsWith(".facebook.com") ||
    host === "facebook.com" ||
    host.endsWith(".fbsbx.com") ||
    host === "fbsbx.com"
  );
}

export const Route = createFileRoute("/api/img")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const raw = url.searchParams.get("u");
        if (!raw) return new Response("Missing image", { status: 400 });
        let target: URL;
        try {
          target = new URL(raw);
        } catch {
          return new Response("Bad image url", { status: 400 });
        }
        if (target.protocol !== "https:" && target.protocol !== "http:") {
          return new Response("Bad protocol", { status: 400 });
        }
        if (!isAllowedImageHost(target.hostname)) {
          return new Response("Host not allowed", { status: 403 });
        }
        try {
          const host = target.hostname.toLowerCase();
          const needsFbCrawler =
            host === "lookaside.fbsbx.com" ||
            host.endsWith(".fbsbx.com") ||
            /lookaside\/crawler/i.test(target.pathname);
          const res = await fetch(target.toString(), {
            headers: {
              "User-Agent": needsFbCrawler
                ? "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"
                : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
              Referer: "https://www.facebook.com/",
            },
          });
          if (!res.ok) return new Response("Upstream error", { status: 502 });
          let type = res.headers.get("content-type") || "";
          if (!type.startsWith("image/")) {
            const ext = target.pathname.toLowerCase();
            if (ext.endsWith(".webp")) type = "image/webp";
            else if (ext.endsWith(".png")) type = "image/png";
            else if (ext.endsWith(".gif")) type = "image/gif";
            else if (ext.endsWith(".avif")) type = "image/avif";
            else if (ext.endsWith(".jpg") || ext.endsWith(".jpeg") || type.includes("octet-stream"))
              type = "image/jpeg";
            else return new Response("Not an image", { status: 502 });
          }
          return new Response(res.body, {
            headers: {
              "Content-Type": type,
              "Cache-Control": "public, max-age=86400",
            },
          });
        } catch {
          return new Response("Fetch failed", { status: 502 });
        }
      },
    },
  },
});
