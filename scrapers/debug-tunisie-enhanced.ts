import puppeteer from 'puppeteer';
import fs from 'fs';

async function debugTunisieAnnonce() {
  console.log('Debugging TunisieAnnonce.com with enhanced inspection...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Navigating to Tunisie Annonce...');
  await page.goto('http://www.tunisie-annonce.com/', { 
    waitUntil: 'networkidle0',
    timeout: 60000 
  });
  
  console.log('Waiting for content to load...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('Looking for immobilier section...');
  const immobilierLink = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const immoLink = links.find(a => {
      const text = a.textContent || '';
      const href = a.href || '';
      return text.toLowerCase().includes('immobilier') ||
             text.toLowerCase().includes('immo') ||
             href.includes('immobilier');
    });
    return immoLink ? immoLink.href : null;
  });
  
  if (immobilierLink) {
    console.log('Found immobilier link:', immobilierLink);
    await page.goto(immobilierLink, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  const html = await page.content();
  fs.writeFileSync('tunisie-page.html', html);
  console.log('HTML saved to tunisie-page.html');
  
  const analysis = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a[href]'));
    const propertyLinks = allLinks.filter(a => {
      const href = a.getAttribute('href') || '';
      const text = (a.textContent || '').toLowerCase();
      return href.includes('detail') || 
             href.includes('annonce') || 
             text.includes('dt') || 
             text.includes('tnd') ||
             text.match(/\d+\s*m/);
    });
    
    const containers = new Set();
    propertyLinks.forEach(link => {
      let parent = link.parentElement;
      let depth = 0;
      while (parent && depth < 5) {
        if (parent.className) containers.add(parent.className);
        if (parent.tagName) containers.add(parent.tagName.toLowerCase());
        parent = parent.parentElement;
        depth++;
      }
    });
    
    const sampleLink = propertyLinks[0];
    const sampleHTML = sampleLink ? sampleLink.outerHTML.substring(0, 500) : 'No links found';
    
    const mainContent = document.querySelector('main') || document.querySelector('#content') || document.body;
    const allDivs = mainContent.querySelectorAll('div, tr, li');
    
    const itemsWithLinks = Array.from(allDivs).filter(el => {
      const links = el.querySelectorAll('a[href]');
      const imgs = el.querySelectorAll('img');
      return links.length >= 1 && links.length <= 10 && imgs.length >= 1;
    }).map(el => ({
      tag: el.tagName.toLowerCase(),
      className: el.className,
      id: el.id,
      childCount: el.children.length,
      hasImage: el.querySelector('img') ? 'yes' : 'no'
    }));
    
    return {
      totalLinks: allLinks.length,
      propertyLinks: propertyLinks.length,
      containerClasses: Array.from(containers),
      sampleLink: sampleHTML,
      potentialItems: itemsWithLinks.slice(0, 10),
      pageText: document.body.innerText.substring(0, 1000)
    };
  });
  
  console.log('\n=== Analysis Results ===');
  console.log('Total links on page:', analysis.totalLinks);
  console.log('Property-related links:', analysis.propertyLinks);
  console.log('\nContainer classes/tags found:');
  analysis.containerClasses.slice(0, 20).forEach(cls => {
    console.log('  -', cls);
  });
  
  console.log('\nSample property link HTML:');
  console.log(analysis.sampleLink);
  
  console.log('\nPotential listing items:');
  analysis.potentialItems.forEach((item, i) => {
    const className = item.className || 'none';
    const id = item.id || 'none';
    console.log(`  ${i + 1}. <${item.tag}> class="${className}" id="${id}" children=${item.childCount} hasImage=${item.hasImage}`);
  });
  
  console.log('\nPage text preview:');
  console.log(analysis.pageText);
  
  await page.screenshot({ path: 'debug-tunisie-full.png', fullPage: true });
  console.log('\nScreenshot saved: debug-tunisie-full.png');
  
  console.log('\nBrowser will stay open for inspection. Press Ctrl+C when done.');
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  await browser.close();
}

debugTunisieAnnonce().catch(console.error);
