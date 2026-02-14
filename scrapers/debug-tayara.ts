import puppeteer from 'puppeteer';
import fs from 'fs';

async function debugTayara() {
  console.log('🔍 Debugging Tayara.tn HTML structure...\n');
  
  const browser = await puppeteer.launch({ headless: false }); // Show browser
  const page = await browser.newPage();
  
  await page.goto('https://www.tayara.tn/ads/c/Immobilier?page=1', { 
    waitUntil: 'networkidle2',
    timeout: 30000 
  });
  
  console.log('✅ Page loaded\n');
  
  // Wait a bit to see the page
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Get HTML structure
  const structure = await page.evaluate(() => {
    // Try multiple possible selectors
    const selectors = [
      'article.listing-card',
      'div[data-testid="listing-card"]',
      'div.listing',
      'div[class*="card"]',
      'div[class*="listing"]',
      'article',
      'div[class*="ad"]',
      'a[href*="/item/"]'
    ];
    
    const results = {};
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      results[selector] = elements.length;
    });
    
    // Get all class names on page
    const allClasses = new Set();
    document.querySelectorAll('[class]').forEach(el => {
      el.classList.forEach(cls => {
        if (cls.includes('list') || cls.includes('card') || cls.includes('ad') || cls.includes('item')) {
          allClasses.add(cls);
        }
      });
    });
    
    return {
      counts: results,
      relevantClasses: Array.from(allClasses),
      pageTitle: document.title,
      bodyClasses: document.body.className
    };
  });
  
  console.log('📊 Selector Counts:');
  Object.entries(structure.counts).forEach(([selector, count]) => {
    console.log('   ' + selector + ': ' + count + ' elements');
  });
  
  console.log('\n📝 Relevant CSS Classes Found:');
  structure.relevantClasses.slice(0, 20).forEach(cls => {
    console.log('   .' + cls);
  });
  
  console.log('\n📄 Page Title:', structure.pageTitle);
  
  // Take screenshot
  await page.screenshot({ path: 'debug-tayara.png', fullPage: true });
  console.log('\n📸 Screenshot saved: debug-tayara.png');
  
  // Save HTML
  const html = await page.content();
  fs.writeFileSync('debug-tayara.html', html);
  console.log('💾 HTML saved: debug-tayara.html');
  
  console.log('\n⏸️  Browser will stay open for 30 seconds for manual inspection...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  await browser.close();
}

debugTayara().catch(console.error);
