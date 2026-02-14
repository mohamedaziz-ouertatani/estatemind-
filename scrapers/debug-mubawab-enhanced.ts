import puppeteer from 'puppeteer';
import fs from 'fs';

async function debugMubawab() {
  console.log('Debugging Mubawab.tn with enhanced inspection...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Navigating to Mubawab...');
  await page.goto('https://www.mubawab.tn/fr/ct/tunis/lst/ad:p:1', { 
    waitUntil: 'networkidle0',
    timeout: 60000 
  });
  
  console.log('Waiting for content to load...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const html = await page.content();
  fs.writeFileSync('mubawab-page.html', html);
  console.log('HTML saved to mubawab-page.html');
  
  const analysis = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a[href]'));
    const propertyLinks = allLinks.filter(a => {
      const href = a.getAttribute('href') || '';
      return href.includes('annonce') || href.includes('ad') || href.includes('propriete');
    });
    
    console.log('Found', propertyLinks.length, 'property links');
    
    const containers = new Set();
    propertyLinks.forEach(link => {
      let parent = link.parentElement;
      let depth = 0;
      while (parent && depth < 5) {
        if (parent.className) {
          containers.add(parent.className);
        }
        if (parent.tagName) {
          containers.add(parent.tagName.toLowerCase());
        }
        parent = parent.parentElement;
        depth++;
      }
    });
    
    const sampleLink = propertyLinks[0];
    const sampleHTML = sampleLink ? sampleLink.outerHTML.substring(0, 500) : 'No links found';
    
    const mainContent = document.querySelector('main') || document.querySelector('#main') || document.body;
    const allDivs = mainContent.querySelectorAll('div');
    
    const divsWithMultipleLinks = Array.from(allDivs).filter(div => {
      const links = div.querySelectorAll('a[href*="annonce"], a[href*="ad"]');
      return links.length >= 2 && links.length <= 50;
    }).map(div => ({
      className: div.className,
      id: div.id,
      childCount: div.children.length,
      linkCount: div.querySelectorAll('a').length
    }));
    
    return {
      totalLinks: allLinks.length,
      propertyLinks: propertyLinks.length,
      containerClasses: Array.from(containers),
      sampleLink: sampleHTML,
      potentialContainers: divsWithMultipleLinks.slice(0, 10),
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
  
  console.log('\nPotential listing containers:');
  analysis.potentialContainers.forEach((cont, i) => {
    const className = cont.className || 'none';
    const id = cont.id || 'none';
    console.log(`  ${i + 1}. class="${className}" id="${id}" children=${cont.childCount} links=${cont.linkCount}`);
  });
  
  console.log('\nPage text preview:');
  console.log(analysis.pageText);
  
  await page.screenshot({ path: 'debug-mubawab-full.png', fullPage: true });
  console.log('\nScreenshot saved: debug-mubawab-full.png');
  
  console.log('\nBrowser will stay open for inspection. Press Ctrl+C when done.');
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  await browser.close();
}

debugMubawab().catch(console.error);
