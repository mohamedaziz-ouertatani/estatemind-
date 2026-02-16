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

type TayaraCategory =
  | "appartements"
  | "maisons-et-villas"
  | "terrains-et-fermes"
  | "bureaux-et-plateaux"
  | "magasins%2c-commerces-et-locaux-industriels"
  | "autres-immobiliers";

export class TayaraScraper {
  private browser: Browser | null = null;
  private config: ScraperConfig;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      source: "tayara",
      maxPages: config.maxPages || 5,
      delayMin: config.delayMin || 1500,
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

  private async randomDelay() {
    const d =
      Math.floor(
        Math.random() * (this.config.delayMax! - this.config.delayMin!),
      ) + this.config.delayMin!;
    return this.delay(d);
  }

  private normalizePrice(p?: number | null) {
    if (!p || isNaN(p)) return null;
    if (p <= 1) return null;
    if (p < 100) return null;
    return p;
  }

  private mapPropertyTypeFromCategory(cat: TayaraCategory) {
    switch (cat) {
      case "appartements":
        return "APARTMENT";
      case "maisons-et-villas":
        return "HOUSE";
      case "terrains-et-fermes":
        return "LAND";
      case "bureaux-et-plateaux":
        return "OFFICE";
      case "magasins%2c-commerces-et-locaux-industriels":
        return "COMMERCIAL";
      default:
        return "OTHER";
    }
  }

  private inferTransactionType(title: string, category: TayaraCategory) {
    const t = title.toLowerCase();
    if (t.includes("louer") || t.includes("location") || t.includes("à louer"))
      return "RENT";
    if (category === "bureaux-et-plateaux" || category.includes("magasins"))
      return t.includes("louer") ? "RENT" : "SALE";
    return "SALE";
  }

  private async extractRealPriceFromDetail(page: Page): Promise<number | null> {
    // JSON-LD
    try {
      const jsonld = await page.$$eval(
        'script[type="application/ld+json"]',
        (els) => els.map((e) => e.textContent).filter(Boolean),
      );

      for (const raw of jsonld) {
        const obj = JSON.parse(raw!);
        if (obj?.offers?.price) return Number(obj.offers.price);
      }
    } catch {}

    // Visible price
    try {
      const priceText = await page.evaluate(() => {
        const el =
          document.querySelector('[data-testid="ad-price"]') ||
          document.querySelector('[class*="price"]') ||
          document.body;
        const txt = el?.textContent || "";
        const m = txt.replace(/\s/g, "").match(/(\d{3,})/);
        return m ? m[1] : null;
      });
      return priceText ? Number(priceText) : null;
    } catch {}

    return null;
  }

  async scrape(): Promise<ScrapeResult> {
    const startTime = new Date().toISOString();
    const errors: string[] = [];
    const properties: ScrapedProperty[] = [];

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await this.browser.newPage();
      await page.setUserAgent(this.config.userAgent!);
      await page.setViewport({ width: 1920, height: 1080 });

      for (let pageNum = 1; pageNum <= this.config.maxPages!; pageNum++) {
        const url = `https://www.tayara.tn/ads/c/Immobilier?page=${pageNum}`;
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        await page.waitForSelector("article");

        const pageProperties: any[] = await page.evaluate(() => {
          const results: any[] = [];
          document.querySelectorAll("article").forEach((listing) => {
            try {
              const a = listing.querySelector(
                'a[href*="/item/"]',
              ) as HTMLAnchorElement;
              if (!a?.href) return;

              const source_url = a.href.split("?")[0];
              const parts = source_url.split("/").filter(Boolean);

              const category = parts[4];
              const governorate = parts[5];
              const delegation = parts[6];
              const neighborhood = parts[7];
              const listing_id = parts[parts.length - 1];

              const title =
                listing.querySelector("h2,h3,h4")?.textContent?.trim() ||
                a.textContent?.trim() ||
                "";

              const allText = listing.textContent || "";
              const bedrooms =
                allText.match(/S\+(\d+)/i)?.[1] ||
                allText.match(/(\d+)\s*chambres?/i)?.[1];
              const size = allText.match(/(\d+)\s*m[²2]/i)?.[1];

              const images: string[] = [];
              listing.querySelectorAll("img").forEach((img) => {
                const src =
                  img.getAttribute("src") || img.getAttribute("data-src") || "";
                if (src && src.includes("http")) images.push(src);
              });

              results.push({
                source_url,
                listing_id,
                title,
                category,
                governorate,
                delegation,
                neighborhood,
                bedrooms: bedrooms ? Number(bedrooms) : undefined,
                size: size ? Number(size) : undefined,
                images: images.slice(0, 5),
              });
            } catch {}
          });
          return results;
        });

        for (const prop of pageProperties) {
          try {
            const detail = await this.browser.newPage();
            await detail.setUserAgent(this.config.userAgent!);
            await detail.goto(prop.source_url, {
              waitUntil: "domcontentloaded",
              timeout: 20000,
            });

            const rawPrice = await this.extractRealPriceFromDetail(detail);
            const price = this.normalizePrice(rawPrice);

            const property_type = this.mapPropertyTypeFromCategory(
              prop.category,
            );
            const transaction_type = this.inferTransactionType(
              prop.title,
              prop.category,
            );

            properties.push({
              ...prop,
              price,
              source_website: "tayara.tn",
              scrape_timestamp: new Date().toISOString(),
              price_currency: "TND",
              size_unit: "m2",
              transaction_type,
              property_type,
            });

            await detail.close();
            await this.randomDelay();
          } catch (e: any) {
            errors.push(`Listing error: ${e.message}`);
          }
        }
      }

      const endTime = new Date().toISOString();
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const dataDir = path.join(__dirname, "../../data/bronze");
      fs.mkdirSync(dataDir, { recursive: true });
      const filePath = path.join(dataDir, `tayara_${ts}.json`);
      fs.writeFileSync(filePath, JSON.stringify(properties, null, 2));

      return {
        source: "tayara",
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
      return {
        source: "tayara",
        success: false,
        propertiesScraped: properties.length,
        errors: [...errors, error.message],
        startTime,
        endTime,
        duration: new Date(endTime).getTime() - new Date(startTime).getTime(),
      };
    } finally {
      if (this.browser) await this.browser.close();
    }
  }
}
