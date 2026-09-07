import assert from "node:assert/strict";
import test from "node:test";
import { formatPhone, formatPrice, telHref, waHref } from "./listings.ts";

test("formatPrice uses Mauritian rupees", () => {
  assert.equal(formatPrice(830000), "Rs 830,000");
  assert.equal(formatPrice(null), "Price on request");
  assert.equal(formatPrice(null, true), "Negotiable");
});

test("formatPhone and tel links use +230 for 8-digit mobiles", () => {
  assert.equal(formatPhone("55390931"), "+230 5539 0931");
  assert.equal(formatPhone("23057701022"), "+230 5770 1022");
  assert.equal(telHref("55390931"), "tel:+23055390931");
  assert.equal(waHref("55390931"), "https://wa.me/23055390931");
});
