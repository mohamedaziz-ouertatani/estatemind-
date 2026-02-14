import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ScraperConfig, ScrapedProperty, ScrapeResult } from '../interfaces/scraper.interface.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MubawabScraper {
  private browser: Browser | null = null;
  private config: ScraperConfig;

  private readonly CATEGORIES = [
    { url: 'listing-promotion', type: 'NEUF', transaction: 'SALE', name: 'Immobilier Neuf' },
    { url: 'sc/appartements-a-vendre', type: 'APARTMENT', transaction: 'SALE', name: 'Vente' },
    { url: 'sc/appartements-a-louer', type: 'APARTMENT', transaction: 'RENT', name: 'Location' },
    { url: 'sc/appartements-vacational', type: 'APARTMENT', transaction: 'RENT', name: 'Vacances' },
  ];

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      source: 'mubawab',
      maxPages: config.maxPages || 3,
      delayMin: config.delayMin || 2000,
      delayMax: config.delayMax || 5000,
      userAgent: config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private randomDelay(): Promise<void> {
    const delay = Math.floor(Math.random() * (this.config.delayMax! - this.config.delayMin!)) + this.config.delayMin!;
    return this.delay(delay);
  }

  async scrape(): Promise<ScrapeResult> {
    const startTime = new Date().toISOString();
    const errors: string[] = [];
    const properties: ScrapedProperty[] = [];

    try {
      console.log('Starting Mubawab scraper...');
      
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await this.browser.newPage();
      await page.setUserAgent(this.config.userAgent!);
      await page.setViewport({ width: 1920, height: 1080 });

      for (const category of this.CATEGORIES) {
        console.log(`\nScraping ${category.name}...`);
        
        for (let pageNum = 1; pageNum <= this.config.maxPages!; pageNum++) {
          try {
            console.log(`  Page ${pageNum}/${this.config.maxPages}...`);
            
            const url = category.url.includes(':p:') 
              ? `https://www.mubawab.tn/fr/${category.url.replace(':p:', `:p:${pageNum}`)}`
              : `https://www.mubawab.tn/fr/${category.url}${category.url.includes('listing-promotion') ? `?page=${pageNum}` : `:p:${pageNum}`}`;
            
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await this.delay(2000);

            const pageProperties = await page.evaluate((catType, catTransaction) => {
              const allLinks = Array.from(document.querySelectorAll('a[href]'));
              const propertyLinks = allLinks.filter(a => {
                const href = a.getAttribute('href') || '';
                return href.match(/\/fr\/[a-z]+-\d+\.html/) || href.includes('/detail/');
              });

              const results: any[] = [];
              const seen = new Set();

              propertyLinks.forEach((link) => {
                try {
                  const href = link.getAttribute('href') || '';
                  if (seen.has(href) || !href) return;
                  seen.add(href);

                  const sourceUrl = href.startsWith('http') ? href : 'https://www.mubawab.tn' + href;
                  const listingId = href.match(/\d+/)?.[0] || '';

                  let container = link.closest('li') || link.closest('div[class*="card"]') || link.closest('article');
                  if (!container) {
                    container = link.parentElement;
                    let depth = 0;
                    while (container && depth < 8) {
                      const links = container.querySelectorAll('a[href]').length;
                      if (links >= 1 && links <= 5) break;
                      container = container.parentElement;
                      depth++;
                    }
                  }

                  if (!container) return;

                  const allText = container.textContent || '';
                  
                  const titleEl = container.querySelector('h2, h3, h4, [class*="title"], [class*="Title"]');
                  const title = titleEl?.textContent?.trim() || link.getAttribute('title') || '';

                  const priceMatches = allText.matchAll(/(\d[\d\s.,]*)\s*(DT|TND|د\.ت|Dinar)/gi);
                  let price: number | undefined;
                  for (const match of priceMatches) {
                    const numStr = match[1].replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '');
                    const num = parseInt(numStr);
                    if (num > 100 && num < 10000000) {
                      price = num;
                      break;
                    }
                  }

                  const sizeMatch = allText.match(/(\d+)\s*m[²2]/i);
                  const size = sizeMatch ? parseInt(sizeMatch[1]) : undefined;

                  const bedroomMatch = allText.match(/(\d+)\s*(chambre|bedroom|غرف)/i);
                  const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : undefined;

                  let location = '';
                  const locationEl = container.querySelector('[class*="location"], [class*="Location"], [class*="ville"], [class*="city"]');
                  if (locationEl) {
                    location = locationEl.textContent?.trim() || '';
                  }

                  const images: string[] = [];
                  const imgs = container.querySelectorAll('img');
                  imgs.forEach(img => {
                    const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy') || '';
                    if (src && src.includes('http') && !src.includes('logo') && !src.includes('icon')) {
                      images.push(src);
                    }
                  });

                  if (sourceUrl && title && title.length > 5) {
                    results.push({
                      source_url: sourceUrl,
                      listing_id: listingId,
                      title: title.substring(0, 200),
                      price,
                      size,
                      bedrooms,
                      description: location || undefined,
                      images: images.length > 0 ? images.slice(0, 5) : undefined,
                      property_type: catType,
                      transaction_type: catTransaction,
                    });
                  }
                } catch (err) {
                  console.error('Error extracting listing:', err);
                }
              });

              return results;
            }, category.type, category.transaction);

            const timestamp = new Date().toISOString();
            pageProperties.forEach(prop => {
              properties.push({
                ...prop,
                source_website: 'mubawab.tn',
                governorate: prop.description?.split(',').pop()?.trim() || 'Tunis',
                scrape_timestamp: timestamp,
                price_currency: 'TND',
                size_unit: 'm2',
              });
            });

            console.log(`  Found ${pageProperties.length} properties`);

            if (pageNum < this.config.maxPages!) {
              await this.randomDelay();
            }
          } catch (pageError: any) {
            const errorMsg = `Error scraping ${category.name} page ${pageNum}: ${pageError.message}`;
            console.error(`  ${errorMsg}`);
            errors.push(errorMsg);
          }
        }
      }

      const endTime = new Date().toISOString();
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                       now.toISOString().replace(/[:.]/g, '').split('T')[1].slice(0, 6);
      const dataDir = path.join(__dirname, '../../data/bronze');
      
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filePath = path.join(dataDir, `mubawab_${timestamp}.json`);
      fs.writeFileSync(filePath, JSON.stringify(properties, null, 2));

      console.log(`\nSaved ${properties.length} properties to ${filePath}`);

      return {
        source: 'mubawab',
        success: true,
        propertiesScraped: properties.length,
        errors,
        startTime,
        endTime,
        duration: new Date(endTime).getTime() - new Date(startTime).getTime(),
        filePath,
      };

    } catch (error: any) {
      const endTime = new Date().toISOString();
      console.error('Fatal error in Mubawab scraper:', error);
      return {
        source: 'mubawab',
        success: false,
        propertiesScraped: properties.length,
        errors: [...errors, `Fatal error: ${error.message}`],
        startTime,
        endTime,
        duration: new Date(endTime).getTime() - new Date(startTime).getTime(),
      };
    } finally {
      if (this.browser) {
        await this.browser.close();
        console.log('Browser closed');
      }
    }
  }
}
