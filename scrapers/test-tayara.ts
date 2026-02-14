import { TayaraScraper } from './src/scrapers/tayara.scraper.js';

console.log('🚀 Starting Tayara scraper test...\n');

const scraper = new TayaraScraper({ maxPages: 2 });

scraper.scrape()
  .then(result => {
    console.log('\n✅ Tayara scraping completed!');
    console.log('📊 Result:');
    console.log('   Properties scraped:', result.propertiesScraped);
    console.log('   Success:', result.success);
    console.log('   Duration:', result.duration, 'ms');
    if (result.filePath) {
      console.log('   File saved:', result.filePath);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
