/**
 * Simple validation script to test key scraper functions
 * Run with: npx tsx scrapers/src/scrapers/test-tunisie-functions.ts
 */

import { TunisieAnnonceScraper } from "./tunisie-annonce.scraper.js";
import { validateProperty } from "../utils/validators.js";
import type { ScrapedProperty } from "../interfaces/scraper.interface.js";

console.log("🧪 Testing Tunisie Annonce Scraper Functions\n");

// Test 1: Price parsing
console.log("Test 1: Price Parsing");
const scraper = new TunisieAnnonceScraper();
const testPrices = [
  { input: "260000 Dinars", expected: 260000 },
  { input: "1,100 TND", expected: 1100 },
  { input: "150 000 DT", expected: 150000 },
  { input: "500 dinar", expected: undefined }, // Too low
];

testPrices.forEach((test) => {
  const result = (scraper as any).parsePrice(test.input);
  const status = result === test.expected ? "✓" : "✗";
  console.log(
    `  ${status} "${test.input}" => ${result} (expected: ${test.expected})`,
  );
});

// Test 2: Image filtering
console.log("\nTest 2: Image Filtering");
const testImages = [
  "http://www.tunisie-annonce.com//images/space.gif",
  "http://www.tunisie-annonce.com/upload2/202310/photos/91639_20231013_094630.jpg",
  "http://www.tunisie-annonce.com//images/puce_bleu.gif",
  "http://www.tunisie-annonce.com/upload2/202401/photos/12345.jpg",
];

const filtered = (scraper as any).filterRealImages(testImages);
console.log(`  Input: ${testImages.length} images`);
console.log(`  Output: ${filtered.length} images`);
console.log(
  `  ${filtered.length === 2 ? "✓" : "✗"} Expected 2 images (only /upload2/)`,
);
filtered.forEach((img) => console.log(`    - ${img}`));

// Test 3: Property validation
console.log("\nTest 3: Property Validation");

const testProperties: Partial<ScrapedProperty>[] = [
  {
    listing_id: "12345",
    source_url: "http://example.com",
    title: "Test Property",
    price: 250000,
    size: 120,
    bedrooms: 3,
    source_website: "test",
    scrape_timestamp: new Date().toISOString(),
  },
  {
    listing_id: "3450699",
    source_url: "http://example.com",
    title: "Bad Property",
    price: 250000,
    size: 3450699, // listing_id as size - SHOULD FAIL
    bedrooms: 3,
    source_website: "test",
    scrape_timestamp: new Date().toISOString(),
  },
  {
    listing_id: "12346",
    source_url: "http://example.com",
    title: "Invalid Price",
    price: 500, // Too low - SHOULD FAIL
    size: 100,
    bedrooms: 2,
    source_website: "test",
    scrape_timestamp: new Date().toISOString(),
  },
  {
    listing_id: "12347",
    source_url: "http://example.com",
    title: "Breadcrumb Issue",
    price: 200000,
    neighborhood: "Accueil  >Annonces Immobilier >Villa", // SHOULD FAIL
    source_website: "test",
    scrape_timestamp: new Date().toISOString(),
  },
];

testProperties.forEach((prop, idx) => {
  const result = validateProperty(prop as ScrapedProperty);
  console.log(`  Property ${idx + 1}: ${result.valid ? "✓ Valid" : "✗ Invalid"}`);
  if (!result.valid) {
    result.warnings.forEach((w) => console.log(`    - ${w}`));
  }
});

console.log("\n✅ Function tests completed!");
