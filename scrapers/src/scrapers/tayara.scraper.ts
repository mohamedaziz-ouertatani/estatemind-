/**
 * Tayara.tn scraper – hardened, logged, and fixed extraction
 */

import puppeteer, { Browser, Page } from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type {
  ScraperConfig,
  ScrapedProperty,
  ScrapeResult,
} from "../interfaces/scraper.interface.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TayaraScraper {
  private browser: Browser | null = null;
  private config: ScraperConfig;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      source: "tayara",
      maxPages: config.maxPages || 3,
      delayMin: config.delayMin || 1500,
      delayMax: config.delayMax || 3500,
      userAgent:
        config.userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      governorates: config.governorates,
      propertyTypes: config.propertyTypes,
    };
  }

  private log(msg: string) {
    console.log(`🟦 [TAYARA] ${msg}`);
  }

  private async delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private randomDelay() {
    const ms =
      Math.floor(
        Math.random() * (this.config.delayMax! - this.config.delayMin!),
      ) + this.config.delayMin!;
    return this.delay(ms);
  }

  private normalizeUrl(url: string) {
    return url.split("?")[0].replace(/\/$/, "");
  }

  private extractListingId(url: string) {
    const clean = this.normalizeUrl(url);
    return clean.split("/").filter(Boolean).pop()!;
  }

  private parsePrice(text?: string) {
    if (!text) return undefined;
    const digits = text.replace(/[^\d]/g, "");
    const n = Number(digits);
    if (!Number.isFinite(n) || n <= 0) return undefined;
    return Math.floor(n);
  }

  private parseSize(text?: string) {
    if (!text) return undefined;
    const m = text.match(/(\d{2,4})\s?(m²|m2)/i);
    if (!m) return undefined;
    return Number(m[1]);
  }

  private parseBedrooms(text?: string) {
    if (!text) return undefined;
    const s = text.match(/S\+(\d+)/i);
    if (s) return Number(s[1]);
    const b = text.match(/(\d+)\s*(chambres?|pièces?)/i);
    if (b) return Number(b[1]);
    return undefined;
  }

  private async safeGoto(page: Page, url: string) {
    for (let i = 0; i < 3; i++) {
      try {
        await page.goto(url, {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });
        return;
      } catch (err) {
        this.log(`Retry ${i + 1}/3 for ${url}`);
        await this.delay(3000);
      }
    }
    throw new Error(`Navigation failed after retries: ${url}`);
  }

  private async collectListingUrls(page: Page, pageNum: number) {
    const url = `https://www.tayara.tn/ads/c/Immobilier?page=${pageNum}`;
    this.log(`Collecting URLs from page ${pageNum}: ${url}`);

    await this.safeGoto(page, url);
    await page.waitForSelector('a[href*="/item/"]', { timeout: 30000 });

    const urls = await page.$$eval('a[href*="/item/"]', (els) => [
      ...new Set(els.map((a) => (a as HTMLAnchorElement).href.split("?")[0])),
    ]);

    this.log(`Found ${urls.length} listings on page ${pageNum}`);
    return urls;
  }

  private async scrapeListingDetails(page: Page, sourceUrl: string) {
    this.log(`Scraping listing: ${sourceUrl}`);

    await this.safeGoto(page, sourceUrl);
    await page.waitForSelector("h1", { timeout: 30000 });

    const extracted = await page.evaluate(() => {
      const title = document.querySelector("h1")?.textContent?.trim() || "";
      const description =
        document.querySelector('[data-testid="description"]')?.textContent ||
        document.querySelector("section")?.innerText ||
        "";

      const price =
        document.querySelector('[data-testid="price"]')?.textContent ||
        document.querySelector('[class*="price"]')?.textContent ||
        "";

      const attributes = Array.from(document.querySelectorAll("li"))
        .map((li) => li.innerText)
        .join(" ");

      const images = Array.from(document.querySelectorAll("img"))
        .map((i) => i.src)
        .filter((src) => src.includes("tayara.tn"));

      return {
        title,
        description,
        price,
        attributes,
        text: document.body.innerText,
        images,
      };
    });

    const listingId = this.extractListingId(sourceUrl);
    const mergedText = `${extracted.title} ${extracted.description} ${extracted.attributes} ${extracted.text}`;

    const size = this.parseSize(mergedText);
    const bedrooms = this.parseBedrooms(mergedText);
    const price = this.parsePrice(extracted.price);

    if (!mergedText.toLowerCase().includes("vente")) {
      this.log(`Skipped non-sale listing ${listingId}`);
      return null;
    }

    const property: ScrapedProperty = {
      source_url: this.normalizeUrl(sourceUrl),
      listing_id: listingId,
      source_website: "tayara.tn",
      title: extracted.title || `Listing ${listingId}`,
      description: extracted.description || "No description",
      price,
      property_type: "APARTMENT",
      transaction_type: "SALE",
      governorate: "Unknown",
      delegation: "Unknown",
      neighborhood: undefined,
      address: undefined,
      size,
      size_unit: size ? "m2" : undefined,
      bedrooms,
      images: extracted.images.slice(0, 6),
      contact_phone: undefined,
      scrape_timestamp: new Date().toISOString(),
      price_currency: "TND",
    };

    this.log(
      `Extracted: id=${listingId}, price=${price}, size=${size}, bedrooms=${bedrooms}`,
    );

    return property;
  }

  async scrape(): Promise<ScrapeResult> {
    const startTime = new Date().toISOString();
    const errors: string[] = [];
    const properties: ScrapedProperty[] = [];
    const seen = new Set<string>();

    this.log("Launching browser...");

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await this.browser.newPage();
      const detailPage = await this.browser.newPage();
      await page.setUserAgent(this.config.userAgent!);

      for (let pageNum = 1; pageNum <= this.config.maxPages!; pageNum++) {
        try {
          const urls = await this.collectListingUrls(page, pageNum);

          for (const url of urls) {
            try {
              const id = this.extractListingId(url);
              if (seen.has(id)) continue;

              const property = await this.scrapeListingDetails(detailPage, url);
              if (property) properties.push(property);
              seen.add(id);

              await this.delay(800);
            } catch (err: any) {
              errors.push(`Listing failed ${url}: ${err.message}`);
              this.log(`❌ Listing failed: ${url}`);
            }
          }

          await this.randomDelay();
        } catch (err: any) {
          errors.push(`Page ${pageNum} failed: ${err.message}`);
          this.log(`❌ Page ${pageNum} failed`);
        }
      }

      const outDir = path.join(__dirname, "../../data/bronze");
      fs.mkdirSync(outDir, { recursive: true });

      const filePath = path.join(
        outDir,
        `tayara_${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      );

      fs.writeFileSync(filePath, JSON.stringify(properties, null, 2));
      this.log(`Saved ${properties.length} properties → ${filePath}`);

      return {
        source: "tayara",
        success: errors.length === 0,
        propertiesScraped: properties.length,
        errors,
        startTime,
        endTime: new Date().toISOString(),
        duration: Date.now() - new Date(startTime).getTime(),
        filePath,
      };
    } finally {
      if (this.browser) {
        this.log("Closing browser...");
        await this.browser.close();
      }
    }
  }
}
