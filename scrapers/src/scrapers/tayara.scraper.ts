/**
 * Tayara.tn scraper
 *
 * Strategy:
 * 1) Crawl listing pages and collect item URLs
 * 2) Open each detail page to extract high-quality fields
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  ScraperConfig,
  ScrapedProperty,
  ScrapeResult,
} from '../interfaces/scraper.interface.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanText(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// Parse price safely from string or <data value="">
function parsePriceFromHtml(html: string): number | undefined {
  // 1. Try <data value="...">
  const dataMatch = html.match(/<data[^>]*value="(\d{4,9})"/);
  if (dataMatch) return parseInt(dataMatch[1].replace(/\D/g, ""), 10);

  // 2. Try visibly red span (may have "000 DT" split!)
  const priceMatch = html.match(/(\d{1,3})\D*(\d{3})\D*(DT|TND)/i);
  if (priceMatch)
    return parseInt(priceMatch[1] + priceMatch[2], 10);

  // 3. Try JSON-LD if available
  const ldMatch = html.match(
    /<script[^>]+type="application\/ld\+json"[^>]*?>([\s\S]*?)<\/script>/,
  );
  if (ldMatch) {
    try {
      const obj = JSON.parse(ldMatch[1]);
      if (obj?.offers?.price) return Number(obj.offers.price);
      if (obj?.price) return Number(obj.price);
    } catch {}
  }

  // 4. Try “Prix de Vente : (\d+) MD” — multiply by 1000
  const prixMD = html.match(/Prix de Vente\s*:\s*(\d{2,3})\s*MD/i);
  if (prixMD) return parseInt(prixMD[1], 10) * 1000;

  return undefined;
}

function parseCriteriaSection(html: string): {
  transaction_type?: string;
  size?: number;
  bathrooms?: number;
  bedrooms?: number;
} {
  const crits: any = {};
  // Capture all: <span>Label</span><span>Value</span>
  const regex = /<span[^>]*>([^<]+)<\/span>\s*<span[^>]*>([^<]+)<\/span>/g;
  for (let m; (m = regex.exec(html)); ) {
    const label = m[1].trim().toLowerCase();
    let value = m[2].trim();
    if (/superficie/.test(label)) value = value.replace(/\D/g, "");
    if (/bains?/.test(label)) value = value.replace(/\D/g, "");
    if (/chambres?/.test(label)) value = value.replace(/\D/g, "");
    if (/type de transaction/.test(label)) {
      crits.transaction_type = /vente|à vendre/i.test(value)
        ? "SALE"
        : /louer|à louer/i.test(value)
        ? "RENT"
        : value;
    }
    if (/superficie/.test(label)) crits.size = parseInt(value, 10) || undefined;
    if (/bains?/.test(label)) crits.bathrooms = parseInt(value, 10) || undefined;
    if (/chambres?/.test(label)) crits.bedrooms = parseInt(value, 10) || undefined;
  }
  return crits;
}

function parseLocationFromHtml(html: string): {
  governorate?: string;
  delegation?: string;
  neighborhood?: string;
} {
  const breadcrumbMatches = Array.from(
    html.matchAll(/<span>([^<]+)<\/span>/g)
  ).map((m) => m[1].trim());
  if (breadcrumbMatches.length > 3) {
    // Usually: [Type, Governorate, Delegation, Neighborhood, ...]
    return {
      governorate: breadcrumbMatches[2] || undefined,
      delegation: breadcrumbMatches[3] || undefined,
      neighborhood: breadcrumbMatches[4] || breadcrumbMatches[3] || undefined,
    };
  }
  return {};
}

function filterPropertyImages(all: string[]): string[] {
  return all.filter(
    (src) =>
      src.includes("mediaGateway/resize-image") &&
      !/logo|loader|svg/i.test(src)
  );
}

function parseDescription(html: string): string {
  // 1. Try description <span> or <div> under heading
  let m = html.match(
    /<h2[^>]*>Description<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i
  );
  if (m) return cleanText(m[1]);
  // 2. Try alt: anything after <h2>description
  m = html.match(/<h2[^>]*>Description<\/h2>([\s\S]*?)(<button|<div)/i);
  if (m) return cleanText(m[1]);
  // 3. Fallback: first large <p>
  m = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (m) return cleanText(m[1]);
  return "";
}

// --- MAIN SCRAPER ---
export class TayaraScraper {
  private browser: Browser | null = null;
  private config: ScraperConfig;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      source: 'tayara',
      maxPages: config.maxPages || 5,
      delayMin: config.delayMin || 2000,
      delayMax: config.delayMax || 5000,
      userAgent:
        config.userAgent ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      governorates: config.governorates,
      propertyTypes: config.propertyTypes,
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private randomDelay(): Promise<void> {
    const delay =
      Math.floor(
        Math.random() * (this.config.delayMax! - this.config.delayMin!),
      ) + this.config.delayMin!;
    return this.delay(delay);
  }

  private normalizeUrl(url: string): string {
    return (url || '').split('?')[0].replace(/\/$/, '');
  }

  private extractListingId(url: string): string {
    const clean = this.normalizeUrl(url);
    const segments = clean.split('/').filter(Boolean);

    for (const segment of [...segments].reverse()) {
      if (/^[a-f0-9]{24}$/i.test(segment)) {
        return segment;
      }
    }

    for (const segment of [...segments].reverse()) {
      const digits = segment.match(/(\d{6,})/);
      if (digits) {
        return digits[1];
      }
    }

    return segments[segments.length - 1] || clean;
  }

  private propertyTypeFromUrl(url: string): string {
    const lower = url.toLowerCase();
    if (lower.includes('/terrains-et-fermes/')) return 'LAND';
    if (lower.includes('/maisons-et-villas/')) return 'HOUSE';
    if (lower.includes('/appartements/')) return 'APARTMENT';
    if (lower.includes('/bureaux-et-commerces/')) return 'COMMERCIAL';
    return 'APARTMENT';
  }

  private transactionTypeFromUrl(url: string, title?: string): string {
    const lower = `${url} ${title || ''}`.toLowerCase();
    if (
      lower.includes('location') ||
      lower.includes('louer') ||
      lower.includes('à louer') ||
      lower.includes('a-louer')
    ) {
      return 'RENT';
    }
    return 'SALE';
  }

  private locationFromUrl(url: string): {
    governorate?: string;
    delegation?: string;
    neighborhood?: string;
  } {
    try {
      const pathname = new URL(url).pathname;
      const parts = pathname.split('/').filter(Boolean);
      const itemIndex = parts.findIndex((p) => p === 'item');

      if (itemIndex === -1) {
        return {};
      }

      // /item/{category}/{governorate}/{delegation}/{title}/{id}
      const governorate = parts[itemIndex + 2];
      const delegation = parts[itemIndex + 3];
      const neighborhood = delegation;

      return {
        governorate: governorate
          ? governorate.replace(/-/g, ' ').trim()
          : undefined,
        delegation: delegation ? delegation.replace(/-/g, ' ').trim() : undefined,
        neighborhood: neighborhood
          ? neighborhood.replace(/-/g, ' ').trim()
          : undefined,
      };
    } catch {
      return {};
    }
  }

  private parsePrice(value: string | null | undefined): number | undefined {
    if (!value) return undefined;
    const match = value.replace(/\u00a0/g, ' ').match(/([\d\s.,]{3,})/);
    if (!match) return undefined;
    const parsed = parseInt(match[1].replace(/[\s.,]/g, ''), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return parsed;
  }

  private parseSize(value: string | null | undefined): number | undefined {
    if (!value) return undefined;
    const m = value.match(/(\d+(?:[.,]\d+)?)\s*m(?:²|2)?/i);
    if (!m) return undefined;
    return Math.round(parseFloat(m[1].replace(',', '.')));
  }

  private parseCoordinates(text: string | undefined): { latitude?: number; longitude?: number } {
    if (!text) {
      return {};
    }

    const patterns = [
      /@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/,
      /[?&](?:q|query|ll|sll)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/,
      /(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (!match) continue;

      const latitude = parseFloat(match[1]);
      const longitude = parseFloat(match[2]);
      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        Math.abs(latitude) <= 90 &&
        Math.abs(longitude) <= 180
      ) {
        return { latitude, longitude };
      }
    }

    return {};
  }

  private parseBedrooms(text: string): number | undefined {
    const sPlus = text.match(/s\s*\+\s*(\d+)/i);
    if (sPlus) {
      return parseInt(sPlus[1], 10);
    }

    const chambres = text.match(/(\d+)\s*chambres?/i);
    if (chambres) {
      return parseInt(chambres[1], 10);
    }

    return undefined;
  }

  private async collectListingUrls(page: Page, pageNum: number): Promise<string[]> {
    const urls = [
      `https://www.tayara.tn/ads/c/Immobilier?page=${pageNum}`,
      `https://www.tayara.tn/ads/c/immobilier?page=${pageNum}`,
      `https://www.tayara.tn/ads/c/Immobilier?o=${pageNum}`,
    ];

    let loaded = false;
    for (const url of urls) {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      const hasListings = await page.evaluate(() =>
        Boolean(document.querySelector('a[href*="/item/"]')),
      );

      if (hasListings) {
        loaded = true;
        break;
      }
    }

    if (!loaded) {
      throw new Error('No listing links found on Tayara results page');
    }

    const listingUrls = await page.evaluate(() => {
      const anchors = Array.from(
        document.querySelectorAll('a[href*="/item/"]'),
      ) as HTMLAnchorElement[];

      const urls = anchors
        .map((a) => a.href || a.getAttribute('href') || '')
        .filter((href) => href.includes('/item/'))
        .map((href) =>
          (href.startsWith('http') ? href : `https://www.tayara.tn${href}`)
            .split('?')[0]
            .replace(/\/$/, ''),
        );

      return [...new Set(urls)];
    });

    return listingUrls;
  }

  private async scrapeListingDetails(
    page: Page,
    sourceUrl: string,
  ): Promise<ScrapedProperty | null> {
    await page.goto(sourceUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await this.delay(1200);

    const extracted = await page.evaluate(() => {
      const textFromSelectors = (selectors: string[]): string | undefined => {
        for (const selector of selectors) {
          const el = document.querySelector(selector);
          const text = el?.textContent?.trim();
          if (text) {
            return text;
          }
        }
        return undefined;
      };

      const allText = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();

      const title = textFromSelectors([
        'h1',
        '[data-testid*="title"]',
        '[class*="title"]',
      ]);

      const description = textFromSelectors([
        '[class*="description"]',
        '[data-testid*="description"]',
        'section p',
      ]);

      const priceText = textFromSelectors([
        '[class*="price"]',
        '[data-testid*="price"]',
        'h2',
      ]);

      const locationText = textFromSelectors([
        '[class*="location"]',
        '[class*="address"]',
        '[data-testid*="location"]',
      ]);

      const phoneText = textFromSelectors([
        '[href^="tel:"]',
        '[class*="phone"]',
      ]);

      const coordinateHint = Array.from(document.querySelectorAll('a[href], iframe[src], [data-lat], [data-lng], [data-lon]'))
        .map((el) =>
          el.getAttribute('href') ||
          el.getAttribute('src') ||
          `${el.getAttribute('data-lat') || ''},${el.getAttribute('data-lng') || el.getAttribute('data-lon') || ''}` ||
          '',
        )
        .join(' ');

      const images = Array.from(document.querySelectorAll('img'))
        .map((img) => img.getAttribute('src') || img.getAttribute('data-src') || '')
        .filter((src) => src.startsWith('http') && !src.toLowerCase().includes('logo'));

      return {
        title,
        description,
        priceText,
        locationText,
        phoneText,
        allText,
        images: [...new Set(images)].slice(0, 10),
        coordinateHint,
      };
    });

    const listingId = this.extractListingId(sourceUrl);
    const fromUrlLocation = this.locationFromUrl(sourceUrl);
    const title = extracted.title || `Listing ${listingId}`;
    const detailsText = `${extracted.allText} ${extracted.description || ''} ${title}`;

    const urlLocationParts = fromUrlLocation;
    const parsedSize = this.parseSize(detailsText);
    const parsedBedrooms = this.parseBedrooms(detailsText);
    const parsedCoordinates = this.parseCoordinates(
      `${extracted.coordinateHint || ''} ${extracted.allText}`,
    );

    const property: ScrapedProperty = {
      source_url: this.normalizeUrl(sourceUrl),
      listing_id: listingId,
      source_website: 'tayara.tn',
      title,
      description: extracted.description,
      price: this.parsePrice(extracted.priceText || extracted.allText),
      property_type: this.propertyTypeFromUrl(sourceUrl),
      transaction_type: this.transactionTypeFromUrl(sourceUrl, title),
      governorate: urlLocationParts.governorate,
      delegation: urlLocationParts.delegation,
      neighborhood: urlLocationParts.neighborhood,
      address: extracted.locationText,
      latitude: parsedCoordinates.latitude,
      longitude: parsedCoordinates.longitude,
      size: parsedSize,
      size_unit: parsedSize ? 'm2' : undefined,
      bedrooms: parsedBedrooms,
      images: extracted.images,
      contact_phone: extracted.phoneText,
      scrape_timestamp: new Date().toISOString(),
      price_currency: 'TND',
    };

    if (!property.source_url || !property.listing_id || !property.title) {
      return null;
    }

    return property;
  }

  async scrape(): Promise<ScrapeResult> {
    const startTime = new Date().toISOString();
    const errors: string[] = [];
    const properties: ScrapedProperty[] = [];
    const seenIds = new Set<string>();

    try {
      console.log('Starting Tayara scraper...');

      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const listPage = await this.browser.newPage();
      const detailPage = await this.browser.newPage();

      await listPage.setUserAgent(this.config.userAgent!);
      await detailPage.setUserAgent(this.config.userAgent!);
      await listPage.setViewport({ width: 1920, height: 1080 });
      await detailPage.setViewport({ width: 1920, height: 1080 });

      for (let pageNum = 1; pageNum <= this.config.maxPages!; pageNum++) {
        try {
          console.log(`Scraping page ${pageNum}/${this.config.maxPages}...`);

          const listingUrls = await this.collectListingUrls(listPage, pageNum);
          console.log(`Found ${listingUrls.length} listing URLs on page ${pageNum}`);

          for (const listingUrl of listingUrls) {
            try {
              const listingId = this.extractListingId(listingUrl);
              if (seenIds.has(listingId)) {
                continue;
              }

              const property = await this.scrapeListingDetails(detailPage, listingUrl);
              if (!property) {
                continue;
              }

              seenIds.add(property.listing_id);
              properties.push(property);
            } catch (detailError: any) {
              errors.push(
                `Error scraping listing ${listingUrl}: ${detailError.message}`,
              );
            }

            await this.delay(700);
          }

          if (pageNum < this.config.maxPages!) {
            await this.randomDelay();
          } catch (err: any) {
            errors.push(`[Listing failed ${link}]: ${err.message}`);
            continue;
          }
        } catch (pageError: any) {
          const errorMsg = `Error scraping page ${pageNum}: ${pageError.message}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
        await this.randomDelay();
      }
      // Save to file
      const now = new Date();
      const timestamp =
        now.toISOString().replace(/[:.]/g, '-').split('T')[0] +
        '_' +
        now.toISOString().replace(/[:.]/g, '').split('T')[1].slice(0, 6);
      const dataDir = path.join(__dirname, '../../data/bronze');

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filePath = path.join(dataDir, `tayara_${timestamp}.json`);
      fs.writeFileSync(filePath, JSON.stringify(properties, null, 2));

      console.log(`Saved ${properties.length} properties to ${filePath}`);

      return {
        source: 'tayara',
        success: errors.length === 0,
        propertiesScraped: properties.length,
        errors,
        startTime,
        endTime: new Date().toISOString(),
        duration: Date.now() - Date.parse(startTime),
        filePath,
      };
    } catch (error: any) {
      const endTime = new Date().toISOString();
      console.error('Fatal error in Tayara scraper:', error);
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
      if (this.browser) await this.browser.close();
    }
  }
}