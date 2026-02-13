/**
 * Tayara.tn Scraper
 * Scrapes property listings from Tayara.tn using Puppeteer
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { ScraperConfig, ScrapedProperty, ScrapeResult } from '../interfaces/scraper.interface.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TayaraScraper {
  private browser: Browser | null = null;
  private config: ScraperConfig;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      source: 'tayara',
      maxPages: config.maxPages || 5,
      delayMin: config.delayMin || 2000,
      delayMax: config.delayMax || 5000,
      userAgent: config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      governorates: config.governorates,
      propertyTypes: config.propertyTypes,
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
      console.log('🚀 Starting Tayara scraper...');
      
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await this.browser.newPage();
      await page.setUserAgent(this.config.userAgent!);
      await page.setViewport({ width: 1920, height: 1080 });

      // Scrape multiple pages
      for (let pageNum = 1; pageNum <= this.config.maxPages!; pageNum++) {
        try {
          console.log(`📄 Scraping page ${pageNum}/${this.config.maxPages}...`);
          
          const url = `https://www.tayara.tn/ads/c/Immobilier?page=${pageNum}`;
          await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

          // Wait for listings to load
          await page.waitForSelector('article.listing-card, div[data-testid="listing-card"]', { timeout: 10000 }).catch(() => {
            console.log('⚠️  No listings found on this page');
          });

          // Extract property data from page
          const pageProperties = await page.evaluate(() => {
            const listings = document.querySelectorAll('article.listing-card, div[data-testid="listing-card"]');
            const results: any[] = [];

            listings.forEach((listing) => {
              try {
                // Get link
                const linkElement = listing.querySelector('a[href*="/item/"]') as HTMLAnchorElement;
                const sourceUrl = linkElement?.href || '';
                const listingId = sourceUrl.split('/item/')[1]?.split('?')[0] || '';

                // Get title
                const title = listing.querySelector('h2, h3, [class*="title"]')?.textContent?.trim() || '';

                // Get price
                const priceText = listing.querySelector('[class*="price"], .price, [data-testid="price"]')?.textContent?.trim() || '';
                const priceMatch = priceText.match(/[\d\s]+/);
                const price = priceMatch ? parseInt(priceMatch[0].replace(/\s/g, '')) : undefined;

                // Get location
                const locationText = listing.querySelector('[class*="location"], .location')?.textContent?.trim() || '';
                const locationParts = locationText.split(',').map(s => s.trim());

                // Get description or features
                const description = listing.querySelector('[class*="description"], .description')?.textContent?.trim() || '';

                // Extract bedrooms from title (S+X format)
                const bedroomMatch = title.match(/S\+(\d+)/i);
                const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : undefined;

                // Extract size from title or description
                const sizeMatch = (title + ' ' + description).match(/(\d+)\s*m[²2]/i);
                const size = sizeMatch ? parseInt(sizeMatch[1]) : undefined;

                // Get images
                const imageElements = listing.querySelectorAll('img[src*="tayara"], img[data-src*="tayara"]');
                const images: string[] = [];
                imageElements.forEach(img => {
                  const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
                  if (src && !src.includes('placeholder')) {
                    images.push(src);
                  }
                });

                if (sourceUrl && title) {
                  results.push({
                    source_url: sourceUrl,
                    listing_id: listingId,
                    title,
                    price,
                    governorate: locationParts[locationParts.length - 1] || undefined,
                    delegation: locationParts[locationParts.length - 2] || undefined,
                    neighborhood: locationParts[0] || undefined,
                    bedrooms,
                    size,
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
              source_website: 'tayara.tn',
              scrape_timestamp: timestamp,
              price_currency: 'TND',
              size_unit: 'm2',
              transaction_type: 'SALE',
              property_type: 'APARTMENT', // Default, can be refined
            });
          });

          console.log(`✅ Found ${pageProperties.length} properties on page ${pageNum}`);

          // Random delay between pages
          if (pageNum < this.config.maxPages!) {
            await this.randomDelay();
          }
        } catch (pageError: any) {
          const errorMsg = `Error scraping page ${pageNum}: ${pageError.message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      // Save results to file
      const endTime = new Date().toISOString();
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                       now.toISOString().replace(/[:.]/g, '').split('T')[1].slice(0, 6);
      const dataDir = path.join(__dirname, '../../data/bronze');
      
      // Ensure directory exists
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filePath = path.join(dataDir, `tayara_${timestamp}.json`);
      fs.writeFileSync(filePath, JSON.stringify(properties, null, 2));

      console.log(`💾 Saved ${properties.length} properties to ${filePath}`);

      return {
        source: 'tayara',
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
      console.error('❌ Fatal error in Tayara scraper:', error);
      return {
        source: 'tayara',
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
  const scraper = new TayaraScraper({ maxPages: 2 });
  scraper.scrape().then(result => {
    console.log('\n📊 Scrape Result:', result);
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
