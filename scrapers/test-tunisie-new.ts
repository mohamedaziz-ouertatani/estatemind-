import { TunisieAnnonceScraper } from "./src/scrapers/tunisie-annonce.scraper.js";

async function testTunisieAnnonce() {
  console.log("🚀 Starting Tunisie Annonce scraper test...\n");

  const scraper = new TunisieAnnonceScraper({
    maxPages: 2,
    delayMin: 2000,
    delayMax: 4000,
  });

  const startTime = Date.now();
  const result = await scraper.scrape();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n✅ Tunisie Annonce scraping completed!");
  console.log("📊 Result:");
  console.log(`   Properties scraped: ${result.propertiesScraped}`);
  console.log(`   Success: ${result.success}`);
  console.log(`   Duration: ${duration}s`);
  if (result.filePath) {
    console.log(`   File saved: ${result.filePath}`);
  }
  if (result.errors.length > 0) {
    console.log(`   Errors: ${result.errors.length}`);
    result.errors.forEach((err) => console.log(`     - ${err}`));
  }
}

testTunisieAnnonce().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
