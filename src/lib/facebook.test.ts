import assert from "node:assert/strict";
import test from "node:test";
import { listingsFromPaste } from "./facebook.server.ts";

test("listingsFromPaste imports multiple Marketplace item links", () => {
  const paste = `
https://www.facebook.com/marketplace/item/111111111111111/
Toyota Aqua 2022 Rs 830,000 White Tel 55390931 Les Pailles Mauritius

https://www.facebook.com/marketplace/item/222222222222222/
Honda Fit 2018 Rs 495000 Port Louis Mauritius
`;
  const rows = listingsFromPaste(paste);
  assert.equal(rows.length, 2);
  assert.ok(rows.every((r) => r.id.startsWith("facebook_imp_")));
  const byBrand = Object.fromEntries(rows.map((r) => [r.brand, r]));
  assert.ok(byBrand.Toyota);
  assert.ok(byBrand.Honda);
  assert.equal(byBrand.Toyota.priceMur, 830000);
  assert.equal(byBrand.Honda.priceMur, 495000);
});

test("listingsFromPaste recovers item URLs from HTML hrefs", () => {
  const paste = `
<a href="https://www.facebook.com/marketplace/item/333333333333333/">Toyota CHR 2021 Rs 1,200,000 Port Louis Mauritius</a>
`;
  const rows = listingsFromPaste(paste);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].sourceUrl, "https://www.facebook.com/marketplace/item/333333333333333/");
});
