/**
 * Scraper Manager
 * Unified interface to manage all three scrapers
 */

import { TayaraScraper } from './scrapers/tayara.scraper.js';
import { MubawabScraper } from './scrapers/mubawab.scraper.js';
import { TunisieAnnonceScraper } from './scrapers/tunisie-annonce.scraper.js';
import type { ScraperConfig, ScrapeResult } from './interfaces/scraper.interface.js';

export class ScraperManager {
  /**
   * Scrape a single source
   */
  async scrapeSource(config: ScraperConfig): Promise<ScrapeResult> {
    console.log(`\n🎯 Starting scrape for: ${config.source}`);
    
    try {
      switch (config.source) {
        case 'tayara': {
          const scraper = new TayaraScraper(config);
          return await scraper.scrape();
        }
        case 'mubawab': {
          const scraper = new MubawabScraper(config);
          return await scraper.scrape();
        }
        case 'tunisie-annonce': {
          const scraper = new TunisieAnnonceScraper(config);
          return await scraper.scrape();
        }
        default:
          throw new Error(`Unknown source: ${config.source}`);
      }
    } catch (error: any) {
      console.error(`❌ Error scraping ${config.source}:`, error);
      return {
        source: config.source,
        success: false,
        propertiesScraped: 0,
        errors: [error.message],
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 0,
      };
    }
  }

  /**
   * Scrape multiple sources in parallel
   */
  async scrapeAll(configs: ScraperConfig[]): Promise<ScrapeResult[]> {
    console.log(`\n🚀 Starting scrape for ${configs.length} sources...\n`);
    
    const results: ScrapeResult[] = [];

    // Run scrapers sequentially to avoid overwhelming the system
    for (const config of configs) {
      const result = await this.scrapeSource(config);
      results.push(result);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SCRAPING SUMMARY');
    console.log('='.repeat(60));
    
    const totalProperties = results.reduce((sum, r) => sum + r.propertiesScraped, 0);
    const successCount = results.filter(r => r.success).length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);

    console.log(`✅ Successful: ${successCount}/${configs.length}`);
    console.log(`📦 Total properties scraped: ${totalProperties}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    
    results.forEach(result => {
      console.log(`\n  ${result.success ? '✅' : '❌'} ${result.source}: ${result.propertiesScraped} properties`);
      if (result.filePath) {
        console.log(`     📁 ${result.filePath}`);
      }
      if (result.errors.length > 0) {
        result.errors.forEach(err => console.log(`     ⚠️  ${err}`));
      }
    });

    console.log('='.repeat(60) + '\n');

    return results;
  }

  /**
   * Close all browser instances (called by queue worker)
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleanup complete');
  }
}

// Allow running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new ScraperManager();
  
  const configs: ScraperConfig[] = [
    { source: 'tayara', maxPages: 2 },
    { source: 'mubawab', maxPages: 2, governorates: ['Tunis'], propertyTypes: ['apartment'] },
    { source: 'tunisie-annonce', maxPages: 2, propertyTypes: ['apartment'] },
  ];

  manager.scrapeAll(configs).then(results => {
    const allSuccessful = results.every(r => r.success);
    process.exit(allSuccessful ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
