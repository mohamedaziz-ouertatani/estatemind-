import puppeteer, { Browser } from "puppeteer";
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
      maxPages: config.maxPages || 5,
      delayMin: config.delayMin || 2000,
      delayMax: config.delayMax || 5000,
      userAgent:
        config.userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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
        Math.random() * (this.config.delayMax! - this.config.delayMin!)
      ) + this.config.delayMin!;
    return this.delay(delay);
  }

  private async extractRealPriceFromDetail(
    page: puppeteer.Page
  ): Promise<number | undefined> {
    try {
      const jsonld = await page.$eval(
        'script[type="application/ld+json"]',
        (el) => el.textContent
      );
      if (jsonld) {
        const obj = JSON.parse(jsonld);
        if (obj?.offers?.price) return Number(obj.offers.price);
      }
    } catch {}

    try {
      const dataVal = await page.$eval("data[value]", (el) =>
        el.getAttribute("value")
      );
      if (dataVal && /^\d+$/.test(dataVal)) return parseInt(dataVal, 10);
    } catch {}

    try {
      const priceText = await page.evaluate(() => {
        const el = document.querySelector(".text-red-600") || document.body;
        const m = el?.textContent?.replace(/\s/g, "").match(/(\d{3,})DT/);
        if (m) return m[1];

        const desc = document.body.innerText || "";
        const mdMatch = desc.match(/Prix de Vente\s*:\s*([0-9]{1,3})\s*MD/i);
        if (mdMatch) return String(parseInt(mdMatch[1], 10) * 1000);
        return undefined;
      });

      if (priceText && /^\d+$/.test(priceText)) return parseInt(priceText, 10);
    } catch {}

    return undefined;
  }

  async scrape(): Promise<ScrapeResult> {
    const startTime = new Date().toISOString();
    const errors: string[] = [];
    const properties: ScrapedProperty[] = [];

    try {
      console.log("Starting Tayara scraper...");

      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await this.browser.newPage();
      await page.setUserAgent(this.config.userAgent!);
      await page.setViewport({ width: 1920, height: 1080 });

      for (let pageNum = 1; pageNum <= this.config.maxPages!; pageNum++) {
        try {
          console.log(
            "Scraping page " + pageNum + "/" + this.config.maxPages + "..."
          );

          const urls = [
            "https://www.tayara.tn/ads/c/Immobilier?page=" + pageNum,
            "https://www.tayara.tn/ads/c/immobilier?page=" + pageNum,
          ];

          let loaded = false;
          for (const url of urls) {
            await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
            const hasListings = await page.evaluate(() =>
              Boolean(
                document.querySelector(
                  'article, [data-testid*="ad"], a[href*="/item/"]'
                )
              )
            );

            if (hasListings) {
              loaded = true;
              break;
            }
          }

          if (!loaded) {
            throw new Error("No listing nodes found on Tayara results page");
          }

          const pageProperties: any[] = await page.evaluate(() => {
            const listings = document.querySelectorAll(
              'article, [data-testid*="ad"], [class*="listing"]'
            );
            const results: any[] = [];

            listings.forEach((listing) => {
              try {
                const linkElement = listing.querySelector(
                  'a[href*="/item/"], a'
                ) as HTMLAnchorElement;

                const sourceUrl = (linkElement?.href || "").split("?")[0];
                const listingId =
                  sourceUrl.split("/item/")[1]?.split("/")[0] ||
                  sourceUrl.split("/").filter(Boolean).pop() ||
                  "";

                let title = "";
                const titleSelectors = ["h2", "h3", "h4", '[class*="title"]', "a"];
                for (const sel of titleSelectors) {
                  const el = listing.querySelector(sel);
                  if (el?.textContent?.trim()) {
                    title = el.textContent.trim();
                    break;
                  }
                }

                let locationText = "";
                const locationSelectors = [
                  '[class*="location"]',
                  '[class*="address"]',
                  "span",
                  "div",
                ];

                for (const sel of locationSelectors) {
                  const elements = listing.querySelectorAll(sel);
                  for (const el of elements) {
                    const text = el.textContent?.trim() || "";
                    if (
                      text.includes(",") ||
                      text.match(/Tunis|Ariana|Sousse|Sfax/i)
                    ) {
                      locationText = text;
                      break;
                    }
                  }
                  if (locationText) break;
                }

                const locationParts = locationText
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);

                const allText = listing.textContent || "";
                const bedroomMatch =
                  allText.match(/S\+(\d+)/i) ||
                  allText.match(/(\d+)\s*chambres?/i);
                const bedrooms = bedroomMatch
                  ? parseInt(bedroomMatch[1])
                  : undefined;

                const sizeMatch = allText.match(/(\d+)\s*m[²2]/i);
                const size = sizeMatch ? parseInt(sizeMatch[1]) : undefined;

                const imageElements = listing.querySelectorAll("img");
                const images: string[] = [];
                imageElements.forEach((img) => {
                  const src =
                    img.getAttribute("src") ||
                    img.getAttribute("data-src") ||
                    "";
                  if (
                    src &&
                    !src.includes("placeholder") &&
                    !src.includes("logo") &&
                    src.includes("http")
                  ) {
                    images.push(src);
                  }
                });

                if (sourceUrl && title) {
                  results.push({
                    source_url: sourceUrl,
                    listing_id: listingId,
                    title,
                    governorate:
                      locationParts[locationParts.length - 1] || undefined,
                    delegation:
                      locationParts[locationParts.length - 2] || undefined,
                    neighborhood: locationParts[0] || undefined,
                    bedrooms,
                    size,
                    images: images.length ? images.slice(0, 5) : undefined,
                  });
                }
              } catch {}
            });

            return results;
          });

          for (const prop of pageProperties) {
            try {
              const detailPage = await this.browser.newPage();
              await detailPage.setUserAgent(this.config.userAgent!);
              await detailPage.goto(prop.source_url, {
                waitUntil: "domcontentloaded",
                timeout: 20000,
              });

              await this.randomDelay();
              prop.price = await this.extractRealPriceFromDetail(detailPage);
              if (typeof prop.price === "undefined" || isNaN(prop.price))
                prop.price = null;

              properties.push({
                ...prop,
                source_website: "tayara.tn",
                scrape_timestamp: new Date().toISOString(),
                price_currency: "TND",
                size_unit: "m2",
                transaction_type: "SALE",
                property_type: "APARTMENT",
              });

              await detailPage.close();
            } catch (e: any) {
              errors.push(`Error on listing ${prop.source_url}: ${e.message}`);
            }
          }

          console.log(
            "Page " + pageNum + ": collected " + pageProperties.length
          );

          if (pageNum < this.config.maxPages!) await this.randomDelay();
        } catch (pageError: any) {
          const errorMsg =
            "Error scraping page " + pageNum + ": " + pageError.message;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      const endTime = new Date().toISOString();
      const now = new Date();
      const timestamp =
        now.toISOString().replace(/[:.]/g, "-").split("T")[0] +
        "_" +
        now.toISOString().replace(/[:.]/g, "").split("T")[1].slice(0, 6);

      const dataDir = path.join(__dirname, "../../data/bronze");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

      const filePath = path.join(dataDir, "tayara_" + timestamp + ".json");
      fs.writeFileSync(filePath, JSON.stringify(properties, null, 2));

      console.log("Saved " + properties.length + " properties to " + filePath);

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
      console.error("Fatal error in Tayara scraper:", error);
      return {
        source: "tayara",
        success: false,
        propertiesScraped: properties.length,
        errors: [...errors, "Fatal error: " + error.message],
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
