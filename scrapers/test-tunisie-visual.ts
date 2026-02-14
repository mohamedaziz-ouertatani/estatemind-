import puppeteer from 'puppeteer';

async function testMubawab() {
  console.log('Testing Mubawab with visual browser...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  const url = 'https://www.mubawab.tn/fr/sc/appartements-a-vendre';
  console.log('Going to:', url);
  
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('\nExtracting data...');
  
  const data = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a[href]'));
    console.log('Total links:', allLinks.length);
    
    const propertyLinks = allLinks.filter(a => {
      const href = a.getAttribute('href') || '';
      return href.includes('.html') && href.match(/\d+/);
    });
    
    console.log('Property links found:', propertyLinks.length);
    
    if (propertyLinks.length > 0) {
      const firstLink = propertyLinks[0];
      console.log('First link href:', firstLink.getAttribute('href'));
      console.log('First link text:', firstLink.textContent?.substring(0, 100));
      
      let parent = firstLink.parentElement;
      let depth = 0;
      while (parent && depth < 10) {
        console.log(`Parent ${depth}:`, parent.tagName, parent.className);
        parent = parent.parentElement;
        depth++;
      }
    }
    
    return {
      totalLinks: allLinks.length,
      propertyLinks: propertyLinks.length,
      sampleHrefs: propertyLinks.slice(0, 5).map(a => a.getAttribute('href'))
    };
  });
  
  console.log('\nResults:', JSON.stringify(data, null, 2));
  
  console.log('\nBrowser staying open for 60 seconds...');
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  await browser.close();
}

testMubawab().catch(console.error);
