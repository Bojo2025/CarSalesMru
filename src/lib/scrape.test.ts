import assert from "node:assert/strict";
import test from "node:test";
import {
  extractBrand,
  extractColor,
  extractPhone,
  parsePrice,
  parseYear,
} from "./scrape.server.ts";

test("parsePrice reads MUR amounts", () => {
  assert.deepEqual(parsePrice("Rs 830,000 negotiable"), {
    priceMur: 830000,
    negotiable: true,
  });
  assert.equal(parsePrice("Rs 500").priceMur, null);
});

test("extractBrand prefers the longest matching make", () => {
  assert.deepEqual(extractBrand("2022 Toyota Aqua Hybrid"), {
    brand: "Toyota",
    model: "Aqua Hybrid",
  });
  assert.equal(extractBrand("Mercedes C200").brand, "Mercedes-Benz");
});

test("extractColor and extractPhone read listing text", () => {
  assert.equal(extractColor("Colour Silver Tel 57722062"), "Silver");
  assert.equal(extractPhone("Call 5539 0931 Les Pailles"), "55390931");
  assert.equal(parseYear("Year 2022 Automatic"), 2022);
});
