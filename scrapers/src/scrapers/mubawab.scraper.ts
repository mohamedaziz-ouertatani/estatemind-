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

export class MubawabScraper {
  private browser: Browser | null = null;
  private config: ScraperConfig;

  private readonly CATEGORIES = [
    {
      url: "listing-promotion",
      type: "NEUF",
      transaction: "SALE",
      name: "Immobilier Neuf",
    },
    {
      url: "sc/appartements-a-vendre",
      type: "APARTMENT",
      transaction: "SALE",
      name: "Vente",
    },
    {
      url: "sc/appartements-a-louer",
      type: "APARTMENT",
      transaction: "RENT",
      name: "Location",
    },
    {
      url: "sc/appartements-vacational",
      type: "APARTMENT",
      transaction: "RENT",
      name: "Vacances",
    },
  ];

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      source: "mubawab",
      maxPages: config.maxPages || 3,
      delayMin: config.delayMin || 2000,
      delayMax: config.delayMax || 5000,
      userAgent:
        config.userAgent ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
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

  /**
   * FIXED: Parse price correctly from Mubawab format
   */
  private parsePrice(text: string): number | undefined {
    if (!text) return undefined;

    // Mubawab uses format like "350 000 DT" or "1 200 DT/mois"
    const cleaned = text
      .replace(/dt/gi, "")
      .replace(/\/mois/gi, "")
      .replace(/dinars?/gi, "")
      .replace(/,/g, "")
      .trim();

    // Extract number with spaces
    const match = cleaned.match(/(\d+[\s\d]*)/);
    if (!match) return undefined;

    // Remove spaces
    const numStr = match[1].replace(/\s+/g, "");
    const num = parseInt(numStr, 10);

    // Validate range (1,000 to 100 million TND)
    if (num >= 1000 && num <= 100000000) {
      return num;
    }

    return undefined;
  }

  /**
   * FIXED: Extract size from property details
   */
  private extractSize(text: string): number | undefined {
    if (!text) return undefined;

    // Look for patterns like "120 m²" or "120m2"
    const sizeMatch = text.match(/(\d+)\s*m[²2]/i);
    if (sizeMatch) {
      return parseInt(sizeMatch[1], 10);
    }

    return undefined;
  }

  /**
   * FIXED: Extract bedrooms from text
   */
  private extractBedrooms(text: string): number | undefined {
    if (!text) return undefined;

    // Look for patterns like "3 chambres" or "Studio"
    if (text.toLowerCase().includes("studio")) {
      return 0;
    }

    const bedroomMatch = text.match(/(\d+)\s*(chambre|bedroom|pièce)/i);
    if (bedroomMatch) {
      return parseInt(bedroomMatch[1], 10);
    }

    return undefined;
  }

  /**
   * FIXED: Filter out UI/banner images
   */
  private filterRealImages(images: string[]): string[] {
    const filtered = images.filter((src) => {
      const lower = src.toLowerCase();
      return (
        !lower.includes("logo") &&
        !lower.includes("banner") &&
        !lower.includes("icon") &&
        !lower.includes("placeholder") &&
        !lower.includes("avatar") &&
        !lower.includes("sprite") &&
        src.length > 20 // Minimum URL length
      );
    });

    // Remove duplicates
    return [...new Set(filtered)];
  }

  /**
   * Scrape property details from individual listing page
   */
  private async scrapePropertyDetails(
    page: Page,
    url: string,
  ): Promise<Partial<ScrapedProperty> | null> {
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await this.delay(1500);

      const details = await page.evaluate(() => {
        const result: any = {};

        // Extract price
        const priceElement = document.querySelector(
          '[class*="price"], .price-box, [data-testid="price"]',
        );
        if (priceElement) {
          result.priceRaw = priceElement.textContent?.trim() || "";
        }

        // Extract size, bedrooms, bathrooms from features list
        const features = Array.from(
          document.querySelectorAll(
            '[class*="feature"], [class*="characteristic"], li, .detail-item',
          ),
        );
        const allText = features
          .map((f) => f.textContent?.trim() || "")
          .join(" ");

        result.allFeatures = allText;

        // Extract description
        const descElement = document.querySelector(
          '[class*="description"], [class*="desc"], .property-description',
        );
        if (descElement) {
          result.description = descElement.textContent
            ?.trim()
            .substring(0, 1000);
        }

        // Extract images from gallery
        const images: string[] = [];
        const imgElements = document.querySelectorAll(
          'img[src*="mubawab"], img[data-src*="mubawab"], .gallery img, .slider img',
        );

        imgElements.forEach((img) => {
          const src =
            img.getAttribute("src") || img.getAttribute("data-src") || "";
          if (src && src.startsWith("http")) {
            images.push(src);
          }
        });

        result.images = images;

        // Extract location details
        const locationElement = document.querySelector(
          '[class*="location"], [class*="address"], .breadcrumb',
        );
        if (locationElement) {
          result.location = locationElement.textContent?.trim();
        }

        // Extract phone if visible
        const phoneElement = document.querySelector(
          '[class*="phone"], [href^="tel:"]',
        );
        if (phoneElement) {
          result.phone =
            phoneElement.textContent?.trim() ||
            phoneElement.getAttribute("href")?.replace("tel:", "");
        }

        return result;
      });

      // Parse extracted data
      if (details.priceRaw) {
        const parsedPrice = this.parsePrice(details.priceRaw);
        if (parsedPrice) details.price = parsedPrice;
      }

      if (details.allFeatures) {
        const size = this.extractSize(details.allFeatures);
        if (size) details.size = size;

        const bedrooms = this.extractBedrooms(details.allFeatures);
        if (bedrooms !== undefined) details.bedrooms = bedrooms;

        // Try to extract bathrooms
        const bathroomMatch = details.allFeatures.match(
          /(\d+)\s*(salle.*bain|bathroom)/i,
        );
        if (bathroomMatch) {
          details.bathrooms = parseInt(bathroomMatch[1], 10);
        }
      }

      // Parse location
      if (details.location) {
        const locationParts = details.location
          .split(/[>\/,]/)
          .map((p: string) => p.trim());
        if (locationParts.length >= 2) {
          details.governorate = locationParts[1];
          if (locationParts.length >= 3) {
            details.delegation = locationParts[2];
          }
        }
      }

      // Filter images
      if (details.images) {
        details.images = this.filterRealImages(details.images).slice(0, 10);
        if (details.images.length === 0) {
          delete details.images;
        }
      }

      return details;
    } catch (error) {
      console.error(`Error scraping details from ${url}:`, error);
      return null;
    }
  }

  async scrape(): Promise<ScrapeResult> {
    const startTime = new Date().toISOString();
    const errors: string[] = [];
    const properties: ScrapedProperty[] = [];
    const seenIds = new Set<string>();

    try {
      console.log("🚀 Starting Mubawab scraper...");

      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await this.browser.newPage();
      await page.setUserAgent(this.config.userAgent!);
      await page.setViewport({ width: 1920, height: 1080 });

      for (const category of this.CATEGORIES) {
        console.log(`\n📂 Scraping ${category.name}...`);

        for (let pageNum = 1; pageNum <= this.config.maxPages!; pageNum++) {
          try {
            console.log(`   📄 Page ${pageNum}/${this.config.maxPages}...`);

            const url = category.url.includes(":p:")
              ? `https://www.mubawab.tn/fr/${category.url.replace(":p:", `:p:${pageNum}`)}`
              : `https://www.mubawab.tn/fr/${category.url}${category.url.includes("listing-promotion") ? `?page=${pageNum}` : `:p:${pageNum}`}`;

            await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
            await this.delay(2000);

            // Extract listing URLs from page
            const listingUrls = await page.evaluate(() => {
              const urls: string[] = [];
              const links = document.querySelectorAll(
                'a[href*="/fr/"][href*="listing"]',
              );

              links.forEach((link) => {
                const href = link.getAttribute("href");
                if (href && href.includes("/fr/") && href.match(/\/\d+$/)) {
                  const fullUrl = href.startsWith("http")
                    ? href
                    : `https://www.mubawab.tn${href}`;
                  urls.push(fullUrl);
                }
              });

              return [...new Set(urls)]; // Remove duplicates
            });

            console.log(`      Found ${listingUrls.length} listings`);

            // Scrape each listing
            for (let i = 0; i < listingUrls.length; i++) {
              const listingUrl = listingUrls[i];
              const listingId = listingUrl.match(/\/(\d+)$/)?.[1] || "";

              // Skip duplicates
              if (seenIds.has(listingId)) {
                console.log(`      Skipping duplicate: ${listingId}`);
                continue;
              }
              seenIds.add(listingId);

              console.log(
                `      Scraping ${i + 1}/${listingUrls.length}: ${listingId}`,
              );

              try {
                const details = await this.scrapePropertyDetails(
                  page,
                  listingUrl,
                );

                if (details) {
                  const timestamp = new Date().toISOString();
                  const property: ScrapedProperty = {
                    source_url: listingUrl,
                    listing_id: listingId,
                    title: details.description?.substring(0, 100) || "",
                    price: details.price,
                    size: details.size,
                    bedrooms: details.bedrooms,
                    bathrooms: details.bathrooms,
                    description: details.description,
                    images: details.images,
                    governorate: details.governorate,
                    delegation: details.delegation,
                    phone: details.phone,
                    source_website: "mubawab.tn",
                    scrape_timestamp: timestamp,
                    price_currency: "TND",
                    size_unit: "m2",
                    transaction_type: category.transaction,
                    property_type: category.type,
                  };

                  properties.push(property);
                }

                await this.delay(1000);
              } catch (detailError: any) {
                console.error(
                  `      Error scraping ${listingId}: ${detailError.message}`,
                );
                errors.push(
                  `Error scraping ${listingUrl}: ${detailError.message}`,
                );
              }
            }

            if (pageNum < this.config.maxPages!) {
              await this.randomDelay();
            }
          } catch (pageError: any) {
            const errorMsg = `Error scraping page ${pageNum} of ${category.name}: ${pageError.message}`;
            console.error(errorMsg);
            errors.push(errorMsg);
          }
        }
      }

      // Save to file
      const endTime = new Date().toISOString();
      const now = new Date();
      const timestamp =
        now.toISOString().replace(/[:.]/g, "-").split("T")[0] +
        "_" +
        now.toISOString().replace(/[:.]/g, "").split("T")[1].slice(0, 6);

      const dataDir = path.join(__dirname, "../../../data/bronze");
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filePath = path.join(dataDir, `mubawab_${timestamp}.json`);
      fs.writeFileSync(filePath, JSON.stringify(properties, null, 2));

      console.log(`\n✅ Saved ${properties.length} properties to ${filePath}`);

      return {
        source: "mubawab",
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
      console.error("❌ Fatal error in Mubawab scraper:", error);
      return {
        source: "mubawab",
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
