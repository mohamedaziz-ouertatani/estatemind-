/**
 * TunisieAnnonce.com Scraper
 * Scrapes property listings from TunisieAnnonce.com using Puppeteer
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ScraperConfig, ScrapedProperty, ScrapeResult } from '../interfaces/scraper.interface.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TunisieAnnonceScraper {
  private browser: Browser | null = null;
  private config: ScraperConfig;

  // Property type URL mappings
  private readonly PROPERTY_TYPE_MAP: Record<string, string> = {
    'apartment': 'appartements',
    'villa': 'villas',
    'house': 'maisons',
    'land': 'terrains',
  };

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      source: 'tunisie-annonce',
      maxPages: config.maxPages || 5,
      delayMin: config.delayMin || 2000,
      delayMax: config.delayMax || 5000,
      userAgent: config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      propertyTypes: config.propertyTypes || ['apartment'],
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
      console.log('🚀 Starting TunisieAnnonce scraper...');
      
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await this.browser.newPage();
      await page.setUserAgent(this.config.userAgent!);
      await page.setViewport({ width: 1920, height: 1080 });

      // Scrape each property type
      for (const propertyType of this.config.propertyTypes!) {
        const typeSlug = this.PROPERTY_TYPE_MAP[propertyType] || 'appartements';
        
        // Scrape multiple pages
        for (let pageNum = 1; pageNum <= this.config.maxPages!; pageNum++) {
          try {
            console.log(`📄 Scraping ${propertyType} - page ${pageNum}...`);
            
            const url = `https://www.tunisieannonce.com/annonces/${typeSlug}/${pageNum}.html`;
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            // Wait for listings to load
            await page.waitForSelector('div.card-annonce, div.annonce-item, article', { timeout: 10000 }).catch(() => {
              console.log('⚠️  No listings found on this page');
            });

            // Extract property data from page
            const pageProperties = await page.evaluate(() => {
              const listings = document.querySelectorAll('div.card-annonce, div.annonce-item, article, div[class*="listing"]');
              const results: any[] = [];

              listings.forEach((listing) => {
                try {
                  // Get link
                  const linkElement = listing.querySelector('a[href*="annonce"]') as HTMLAnchorElement;
                  const sourceUrl = linkElement?.href || '';
                  const listingId = sourceUrl.split('/').pop()?.split('.')[0] || '';

                  // Get title
                  const title = listing.querySelector('h2, h3, h4, [class*="title"]')?.textContent?.trim() || '';

                  // Get price
                  const priceText = listing.querySelector('[class*="price"], .prix')?.textContent?.trim() || '';
                  const priceMatch = priceText.match(/[\d\s]+/);
                  const price = priceMatch ? parseInt(priceMatch[0].replace(/\s/g, '')) : undefined;

                  // Get location
                  const locationText = listing.querySelector('[class*="location"], .lieu, [class*="ville"]')?.textContent?.trim() || '';
                  const locationParts = locationText.split(',').map(s => s.trim());

                  // Get description
                  const description = listing.querySelector('[class*="description"], .desc')?.textContent?.trim() || '';

                  // Extract size from title or description
                  const sizeMatch = (title + ' ' + description).match(/(\d+)\s*m[²2]/i);
                  const size = sizeMatch ? parseInt(sizeMatch[1]) : undefined;

                  // Extract bedrooms
                  const bedroomMatch = (title + ' ' + description).match(/(\d+)\s*chambre/i);
                  const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : undefined;

                  // Get images
                  const imageElements = listing.querySelectorAll('img[src*="tunisieannonce"], img[data-src]');
                  const images: string[] = [];
                  imageElements.forEach(img => {
                    const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
                    if (src && !src.includes('placeholder') && !src.includes('logo')) {
                      images.push(src);
                    }
                  });

                  if (sourceUrl && title) {
                    results.push({
                      source_url: sourceUrl,
                      listing_id: listingId,
                      title,
                      price,
                      size,
                      bedrooms,
                      governorate: locationParts[locationParts.length - 1] || undefined,
                      delegation: locationParts[locationParts.length - 2] || undefined,
                      neighborhood: locationParts[0] || undefined,
                      description: description || undefined,
                      images: images.length > 0 ? images : undefined,
                    });
                  }
                } catch (err) {
                  console.error('Error extracting listing:', err);
                }
              });

              return results;
            });

            // Add metadata to each property
            const timestamp = new Date().toISOString();
            pageProperties.forEach(prop => {
              properties.push({
                ...prop,
                source_website: 'tunisieannonce.com',
                scrape_timestamp: timestamp,
                price_currency: 'TND',
                size_unit: 'm2',
                transaction_type: 'SALE',
                property_type: propertyType.toUpperCase(),
              });
            });

            console.log(`✅ Found ${pageProperties.length} properties`);

            // Random delay between pages
            if (pageNum < this.config.maxPages!) {
              await this.randomDelay();
            }
          } catch (pageError: any) {
            const errorMsg = `Error scraping ${propertyType} page ${pageNum}: ${pageError.message}`;
            console.error(`❌ ${errorMsg}`);
            errors.push(errorMsg);
          }
        }
      }

      // Save results to file
      const endTime = new Date().toISOString();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                       new Date().toISOString().replace(/[:.]/g, '').split('T')[1].slice(0, 6);
      const dataDir = path.join(__dirname, '../../data/bronze');
      
      // Ensure directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filePath = path.join(dataDir, `tunisie-annonce_${timestamp}.json`);
      fs.writeFileSync(filePath, JSON.stringify(properties, null, 2));

      console.log(`💾 Saved ${properties.length} properties to ${filePath}`);

      return {
        source: 'tunisie-annonce',
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
      console.error('❌ Fatal error in TunisieAnnonce scraper:', error);
      return {
        source: 'tunisie-annonce',
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
        console.log('🔒 Browser closed');
      }
    }
  }
}

// Allow running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new TunisieAnnonceScraper({ maxPages: 2, propertyTypes: ['apartment'] });
  scraper.scrape().then(result => {
    console.log('\n📊 Scrape Result:', result);
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
