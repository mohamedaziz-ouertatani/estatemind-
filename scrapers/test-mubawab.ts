import { MubawabScraper } from './src/scrapers/mubawab.scraper.js';

console.log('🚀 Starting Mubawab scraper test...\n');

const scraper = new MubawabScraper({ 
  maxPages: 2, 
  governorates: ['Tunis'], 
  propertyTypes: ['apartment'] 
});

scraper.scrape()
  .then(result => {
    console.log('\n✅ Mubawab scraping completed!');
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
