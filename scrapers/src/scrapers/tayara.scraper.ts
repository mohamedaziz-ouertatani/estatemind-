/**
 * Tayara.tn Scraper - Updated selectors
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
      console.log('Starting Tayara scraper...');
      
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await this.browser.newPage();
      await page.setUserAgent(this.config.userAgent!);
      await page.setViewport({ width: 1920, height: 1080 });

      for (let pageNum = 1; pageNum <= this.config.maxPages!; pageNum++) {
        try {
          console.log('Scraping page ' + pageNum + '/' + this.config.maxPages + '...');
          
          const urls = [
            'https://www.tayara.tn/ads/c/Immobilier?page=' + pageNum,
            'https://www.tayara.tn/ads/c/immobilier?page=' + pageNum,
          ];

          let loaded = false;
          for (const url of urls) {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            const hasListings = await page.evaluate(() =>
              Boolean(document.querySelector('article, [data-testid*="ad"], a[href*="/item/"]'))
            );

            if (hasListings) {
              loaded = true;
              break;
            }
          }

          if (!loaded) {
            throw new Error('No listing nodes found on Tayara results page');
          }

          const pageProperties = await page.evaluate(() => {
            const listings = document.querySelectorAll('article, [data-testid*="ad"], [class*="listing"]');
            const results: any[] = [];

            listings.forEach((listing) => {
              try {
                const linkElement = listing.querySelector('a[href*="/item/"], a') as HTMLAnchorElement;
                const sourceUrl = (linkElement?.href || '').split('?')[0];
                const listingId = sourceUrl.split('/item/')[1]?.split('/')[0] || sourceUrl.split('/').filter(Boolean).pop() || '';

                let title = '';
                const titleSelectors = ['h2', 'h3', 'h4', '[class*="title"]', 'a'];
                for (const sel of titleSelectors) {
                  const el = listing.querySelector(sel);
                  if (el?.textContent?.trim()) {
                    title = el.textContent.trim();
                    break;
                  }
                }

                let priceText = '';
                const priceSelectors = ['[class*="price"]', 'span', 'div'];
                for (const sel of priceSelectors) {
                  const elements = listing.querySelectorAll(sel);
                  for (const el of elements) {
                    const text = el.textContent?.trim() || '';
                    if (text.match(/\d+.*TND|DT/i) || text.match(/^\d+[\d\s.,]*$/)) {
                      priceText = text;
                      break;
                    }
                  }
                  if (priceText) break;
                }
                
                const priceMatch = priceText.match(/[\d\s]+/);
                const price = priceMatch ? parseInt(priceMatch[0].replace(/\s/g, '')) : undefined;

                let locationText = '';
                const locationSelectors = ['[class*="location"]', '[class*="address"]', 'span', 'div'];
                for (const sel of locationSelectors) {
                  const elements = listing.querySelectorAll(sel);
                  for (const el of elements) {
                    const text = el.textContent?.trim() || '';
                    if (text.includes(',') || text.match(/Tunis|Ariana|Sousse|Sfax/i)) {
                      locationText = text;
                      break;
                    }
                  }
                  if (locationText) break;
                }
                
                const locationParts = locationText.split(',').map(s => s.trim()).filter(s => s);

                const allText = listing.textContent || '';

                const bedroomMatch = allText.match(/S\+(\d+)/i) || allText.match(/(\d+)\s*chambres?/i);
                const bedrooms = bedroomMatch ? parseInt(bedroomMatch[1]) : undefined;

                const sizeMatch = allText.match(/(\d+)\s*m[²2]/i);
                const size = sizeMatch ? parseInt(sizeMatch[1]) : undefined;

                const imageElements = listing.querySelectorAll('img');
                const images: string[] = [];
                imageElements.forEach(img => {
                  const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
                  if (src && !src.includes('placeholder') && !src.includes('logo') && src.includes('http')) {
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
                    images: images.length > 0 ? images.slice(0, 5) : undefined,
                  });
                }
              } catch (err) {
                console.error('Error extracting listing:', err);
              }
            });

            return results;
          });

          const timestamp = new Date().toISOString();
          pageProperties.forEach(prop => {
            properties.push({
              ...prop,
              source_website: 'tayara.tn',
              scrape_timestamp: timestamp,
              price_currency: 'TND',
              size_unit: 'm2',
              transaction_type: 'SALE',
              property_type: 'APARTMENT',
            });
          });

          console.log('Found ' + pageProperties.length + ' properties on page ' + pageNum);

          if (pageNum < this.config.maxPages!) {
            await this.randomDelay();
          }
        } catch (pageError: any) {
          const errorMsg = 'Error scraping page ' + pageNum + ': ' + pageError.message;
          console.error(errorMsg);
          errors.push(errorMsg);
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

      const filePath = path.join(dataDir, 'tayara_' + timestamp + '.json');
      fs.writeFileSync(filePath, JSON.stringify(properties, null, 2));

      console.log('Saved ' + properties.length + ' properties to ' + filePath);

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
      console.error('Fatal error in Tayara scraper:', error);
      return {
        source: 'tayara',
        success: false,
        propertiesScraped: properties.length,
        errors: [...errors, 'Fatal error: ' + error.message],
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
