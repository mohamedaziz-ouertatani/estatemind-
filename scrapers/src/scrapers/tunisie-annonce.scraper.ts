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

export class TunisieAnnonceScraper {
  private browser: Browser | null = null;
  private config: ScraperConfig;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      source: "tunisie-annonce",
      maxPages: config.maxPages || 5,
      delayMin: config.delayMin || 2000,
      delayMax: config.delayMax || 5000,
      userAgent: config.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    };
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
      console.log("Starting Tunisie Annonce scraper...");

      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await this.browser.newPage();
      await page.setUserAgent(this.config.userAgent!);
      await page.setViewport({ width: 1920, height: 1080 });

      for (let pageNum = 1; pageNum <= this.config.maxPages!; pageNum++) {
        try {
          console.log(`Scraping page ${pageNum}/${this.config.maxPages}...`);

          const url = pageNum === 1 
            ? "http://www.tunisie-annonce.com/AnnoncesImmobilier.asp"
            : `http://www.tunisie-annonce.com/AnnoncesImmobilier.asp?page=${pageNum}`;

          await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
          await page.waitForSelector("tr.Tableau1", { timeout: 10000 });
          await this.delay(2000);

          const pageProperties = await page.evaluate(() => {
            const results: any[] = [];
            const seen = new Set();
            const rows = document.querySelectorAll("tr.Tableau1");

            rows.forEach((row) => {
              try {
                const cells = row.querySelectorAll("td");
                if (cells.length < 6) return;

                const link = row.querySelector('a[href*="Details_Annonces_Immobilier"]') || 
                            row.querySelector('a[href*="DetailsAnnonceImmobilier"]');
                if (!link) return;

                const href = link.getAttribute("href") || "";
                const listingId = href.match(/cod_ann=(\d+)/)?.[1] || "";
                if (!listingId || seen.has(listingId)) return;
                seen.add(listingId);

                const sourceUrl = href.startsWith("http") ? href : "http://www.tunisie-annonce.com/" + href;

                let title = link.textContent?.trim() || "";
                if (!title || title.length < 3) {
                  const titleMatch = href.match(/titre=([^&]+)/);
                  if (titleMatch) {
                    try {
                      title = decodeURIComponent(titleMatch[1].replace(/\+/g, " ")).trim();
                    } catch (err) {
                      // Fallback if URI is malformed
                      title = titleMatch[1].replace(/\+/g, " ").trim();
                    }
                  }
                }

                const locationCell = cells[1];
                const locationLink = locationCell?.querySelector("a");
                const governorate = locationLink?.textContent?.trim() || "";

                const transactionCell = cells[3];
                const transactionText = transactionCell?.textContent?.trim().toLowerCase() || "";
                let transactionType = "SALE";
                if (transactionText.includes("location") || transactionText.includes("louer")) {
                  transactionType = "RENT";
                }

                const typeCell = cells[5];
                const typeText = typeCell?.textContent?.trim() || "";

                const priceCell = cells[cells.length - 3];
                const priceText = priceCell?.textContent?.trim() || "";
                let price: number | undefined;
                const priceMatch = priceText.match(/(\d[\d\s]*)/);
                if (priceMatch) {
                  const numStr = priceMatch[1].replace(/\s/g, "");
                  const num = parseInt(numStr);
                  if (num > 0) price = num;
                }

                const onmouseover = link.getAttribute("onmouseover") || "";
                let size: number | undefined;
                let bedrooms: number | undefined;

                const sizeMatch = onmouseover.match(/(\d+)\s*m[²2]/i);
                if (sizeMatch) size = parseInt(sizeMatch[1]);

                const bedroomMatch = onmouseover.match(/(\d+)\s*(chambre|pièce)/i);
                if (bedroomMatch) bedrooms = parseInt(bedroomMatch[1]);

                if (sourceUrl && title && title.length > 3) {
                  results.push({
                    source_url: sourceUrl,
                    listing_id: listingId,
                    title: title.substring(0, 200),
                    price,
                    size,
                    bedrooms,
                    governorate: governorate || undefined,
                    transaction_type: transactionType,
                    property_type: typeText,
                  });
                }
              } catch (err) {
                console.error("Error extracting row:", err);
              }
            });

            return results;
          });

          const timestamp = new Date().toISOString();
          pageProperties.forEach((prop) => {
            properties.push({
              ...prop,
              source_website: "tunisieannonce.com",
              scrape_timestamp: timestamp,
              price_currency: "TND",
              size_unit: "m2",
              property_type: prop.property_type || "APARTMENT",
            });
          });

          console.log(`Found ${pageProperties.length} properties`);

          if (pageNum < this.config.maxPages!) {
            await this.randomDelay();
          }
        } catch (pageError: any) {
          const errorMsg = `Error scraping page ${pageNum}: ${pageError.message}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      const endTime = new Date().toISOString();
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, "-").split("T")[0] + "_" + 
                       now.toISOString().replace(/[:.]/g, "").split("T")[1].slice(0, 6);
      const dataDir = path.join(__dirname, "../../data/bronze");

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filePath = path.join(dataDir, `tunisie-annonce_${timestamp}.json`);
      fs.writeFileSync(filePath, JSON.stringify(properties, null, 2));

      console.log(`Saved ${properties.length} properties to ${filePath}`);

      return {
        source: "tunisie-annonce",
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
      console.error("Fatal error in Tunisie Annonce scraper:", error);
      return {
        source: "tunisie-annonce",
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
        console.log("Browser closed");
      }
    }
  }
}
