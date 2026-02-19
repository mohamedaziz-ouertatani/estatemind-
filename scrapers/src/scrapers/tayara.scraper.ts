/**
 * Tayara.tn scraper
 *
 * Strategy:
 * 1) Crawl listing pages and collect item URLs
 * 2) Open each detail page to extract high-quality fields
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
      source: "tayara",
      maxPages: config.maxPages || 3,
      delayMin: config.delayMin || 1800,
      delayMax: config.delayMax || 3500,
      userAgent:
        config.userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      governorates: config.governorates,
      propertyTypes: config.propertyTypes,
    };
  }

  private async delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }
  private randomDelay() {
    const ms =
      Math.floor(
        Math.random() * (this.config.delayMax! - this.config.delayMin!)
      ) + this.config.delayMin!;
    return this.delay(ms);
  }

  async scrape(): Promise<ScrapeResult> {
    const startTime = new Date().toISOString();
    const errors: string[] = [];
    const properties: ScrapedProperty[] = [];

    console.log("Launching browser...");
    this.browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await this.browser.newPage();
      await page.setUserAgent(this.config.userAgent!);

      for (let pageNum = 1; pageNum <= this.config.maxPages!; pageNum++) {
        // 1. Get all listing links from this index page
        const pageUrl = `https://www.tayara.tn/ads/c/Immobilier?page=${pageNum}`;
        await page.goto(pageUrl, {
          waitUntil: "networkidle2",
          timeout: 40000,
        });
        await page.waitForSelector('a[href*="/item/"]', { timeout: 20000 });
        const links = await page.$$eval('a[href*="/item/"]', (as) =>
          Array.from(new Set(as.map((a) => (a as HTMLAnchorElement).href)))
        );
        console.log(`Page ${pageNum}: ${links.length} unique links.`);

        // 2. Grab detail data for each listing
        for (const link of links) {
          try {
            const detail = await this.browser!.newPage();
            await detail.setUserAgent(this.config.userAgent!);
            await detail.goto(link, {
              waitUntil: "domcontentloaded",
              timeout: 40000,
            });
            await detail.waitForSelector("h1", { timeout: 20000 });

            const html = await detail.content();
            const title = await detail.$eval("h1", (el) =>
              el.textContent?.trim() || ""
            );

            // Price extraction
            const price = parsePriceFromHtml(html);

            // Description extraction
            const description = parseDescription(html);

            // Criteria extraction
            const criteria = parseCriteriaSection(html);

            // Location extraction (breadcrumb)
            const loc = parseLocationFromHtml(html);

            // Images
            const allImages = await detail.$$eval("img", (imgs) =>
              imgs.map((img) => img.src)
            );
            const images = filterPropertyImages(allImages);

            const prop: ScrapedProperty = {
              source_url: link.split("?")[0],
              listing_id: link.split("/").filter(Boolean).pop() || "",
              source_website: "tayara.tn",
              title,
              description: description || "",
              price: price ?? undefined,
              price_currency: "TND",
              property_type: "APARTMENT", // (or parse from card for villa, terrain, etc)
              transaction_type: criteria.transaction_type || "SALE",
              governorate: loc.governorate || "Unknown",
              delegation: loc.delegation || "Unknown",
              neighborhood: loc.neighborhood || undefined,
              size: criteria.size,
              size_unit: criteria.size ? "m2" : undefined,
              bedrooms: criteria.bedrooms,
              bathrooms: criteria.bathrooms,
              images,
              scrape_timestamp: new Date().toISOString(),
            };

            properties.push(prop);
            await detail.close();
            await this.randomDelay();
          } catch (err: any) {
            errors.push(`[Listing failed ${link}]: ${err.message}`);
            continue;
          }
        }
        await this.randomDelay();
      }
      // Save to file
      const now = new Date();
      const filePath = path.join(
        __dirname,
        "../../data/bronze/tayara_" +
          now.toISOString().replace(/[:.]/g, "-") +
          ".json"
      );
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(properties, null, 2));
      console.log("[Tayara] Finished. Saved", properties.length, "to", filePath);

      return {
        source: "tayara",
        success: errors.length === 0,
        propertiesScraped: properties.length,
        errors,
        startTime,
        endTime: new Date().toISOString(),
        duration: Date.now() - Date.parse(startTime),
        filePath,
      };
    } finally {
      if (this.browser) await this.browser.close();
    }
  }
}