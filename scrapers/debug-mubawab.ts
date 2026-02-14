import puppeteer from 'puppeteer';

async function debugMubawab() {
  console.log('Debugging Mubawab.tn HTML structure...\n');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('https://www.mubawab.tn/fr/ct/tunis/lst/ad:p:1', { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });
  
  console.log('Page loaded\n');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const structure = await page.evaluate(() => {
    const selectors = [
      'ul.ulListing li.listingBox',
      'div[class*="listing"]',
      'article',
      'div[class*="card"]',
      'li[class*="list"]',
      'div.searchResultCard',
      'a[href*="/fr/"]'
    ];
    
    const results = {};
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      results[selector] = elements.length;
    });
    
    const allClasses = new Set();
    document.querySelectorAll('[class]').forEach(el => {
      el.classList.forEach(cls => {
        if (cls.includes('list') || cls.includes('card') || cls.includes('result') || cls.includes('property')) {
          allClasses.add(cls);
        }
      });
    });
    
    return {
      counts: results,
      relevantClasses: Array.from(allClasses).slice(0, 30),
      pageTitle: document.title
    };
  });
  
  console.log('Selector Counts:');
  Object.entries(structure.counts).forEach(([selector, count]) => {
    console.log('   ' + selector + ': ' + count + ' elements');
  });
  
  console.log('\nRelevant CSS Classes Found:');
  structure.relevantClasses.forEach(cls => {
    console.log('   .' + cls);
  });
  
  console.log('\nPage Title:', structure.pageTitle);
  
  await page.screenshot({ path: 'debug-mubawab.png', fullPage: true });
  console.log('\nScreenshot saved: debug-mubawab.png');
  
  console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  await browser.close();
}

debugMubawab().catch(console.error);
