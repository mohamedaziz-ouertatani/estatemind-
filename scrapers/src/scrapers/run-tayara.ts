import { TayaraScraper } from "./tayara.scraper.js";

async function run() {
  console.log("🚀 Starting Tayara scraper...\n");

  const scraper = new TayaraScraper({
    maxPages: 2,
    delayMin: 2000,
    delayMax: 5000,
  });

  try {
    const result = await scraper.scrape();

    console.log("\n✅ Scraping completed!");
    console.log("📊 Summary:");
    console.log(`   Properties: ${result.propertiesScraped}`);
    console.log(`   Success: ${result.success}`);
    console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);
    if (result.filePath) {
      console.log(`   Saved to: ${result.filePath}`);
    }
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors: ${result.errors.length}`);
      result.errors.forEach((err) => console.log(`     - ${err}`));
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  }
}

run();
