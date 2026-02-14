import { TayaraScraper } from './src/scrapers/tayara.scraper.js';
import { MubawabScraper } from './src/scrapers/mubawab.scraper.js';
import { TunisieAnnonceScraper } from './src/scrapers/tunisie-annonce.scraper.js';

async function runAll() {
  console.log('🚀 Starting multi-source scraping...\n');
  console.log('='.repeat(50));

  const results = [];

  // 1. Tayara
  try {
    console.log('\n1. Scraping Tayara.tn...');
    const tayara = new TayaraScraper({ maxPages: 2 });
    const result1 = await tayara.scrape();
    results.push(result1);
    console.log('   Done: ' + result1.propertiesScraped + ' properties from Tayara');
  } catch (error) {
    console.error('   Tayara failed:', error.message);
  }

  // 2. Mubawab
  try {
    console.log('\n2. Scraping Mubawab.tn...');
    const mubawab = new MubawabScraper({ 
      maxPages: 2, 
      governorates: ['Tunis'], 
      propertyTypes: ['apartment'] 
    });
    const result2 = await mubawab.scrape();
    results.push(result2);
    console.log('   Done: ' + result2.propertiesScraped + ' properties from Mubawab');
  } catch (error) {
    console.error('   Mubawab failed:', error.message);
  }

  // 3. Tunisie Annonce
  try {
    console.log('\n3. Scraping TunisieAnnonce.com...');
    const tunisie = new TunisieAnnonceScraper({ 
      maxPages: 2, 
      propertyTypes: ['apartment'] 
    });
    const result3 = await tunisie.scrape();
    results.push(result3);
    console.log('   Done: ' + result3.propertiesScraped + ' properties from Tunisie Annonce');
  } catch (error) {
    console.error('   Tunisie Annonce failed:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('Scraping completed!\n');
  
  const totalProperties = results.reduce((sum, r) => sum + r.propertiesScraped, 0);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log('Summary:');
  console.log('   Total properties: ' + totalProperties);
  console.log('   Total duration: ' + (totalDuration / 1000).toFixed(2) + 's');
  console.log('   Sources scraped: ' + results.length + '/3');
  
  results.forEach(result => {
    console.log('\n   ' + result.source + ':');
    console.log('     - Properties: ' + result.propertiesScraped);
    console.log('     - Success: ' + result.success);
    console.log('     - Duration: ' + (result.duration / 1000).toFixed(2) + 's');
    if (result.filePath) {
      console.log('     - File: ' + result.filePath.split('\\').pop());
    }
  });

  console.log('\n' + '='.repeat(50));
}

runAll()
  .then(() => {
    console.log('\nAll done!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\nFatal error:', error);
    process.exit(1);
  });
