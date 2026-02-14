import puppeteer, { Browser, Page } from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type {
  ScraperConfig,
  ScrapedProperty,
  ScrapeResult,
} from "../interfaces/scraper.interface.js";
import { validateProperty } from "../utils/validators.js";

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

  private normalizePropertyType(typeText: string): string {
    const normalized = typeText.toLowerCase().trim();

    if (normalized.includes("terrain")) {
      return "LAND";
    }
    if (normalized.includes("villa")) {
      return "HOUSE";
    }
    if (normalized.includes("maison")) {
      return "HOUSE";
    }
    if (normalized.includes("appartement") || normalized.includes("app.")) {
      return "APARTMENT";
    }
    if (
      normalized.includes("commercial") ||
      normalized.includes("bureau") ||
      normalized.includes("local") ||
      normalized.includes("surface")
    ) {
      return "COMMERCIAL";
    }

    return "APARTMENT";
  }

  /**
   * FIXED: Parse price correctly
   */
  private parsePrice(text: string): number | undefined {
    if (!text) return undefined;

    // Remove all non-numeric except spaces and dots
    const cleaned = text
      .replace(/dinars?/gi, "")
      .replace(/tnd/gi, "")
      .replace(/dt/gi, "")
      .replace(/,/g, "")
      .trim();

    // Extract first number sequence
    const match = cleaned.match(/(\d+[\s\d]*)/);
    if (!match) return undefined;

    // Remove all spaces and convert
    const numStr = match[1].replace(/\s+/g, "");
    const num = parseInt(numStr, 10);

    // Validate reasonable price range (1,000 to 100 million TND)
    if (num >= 1000 && num <= 100000000) {
      return num;
    }

    return undefined;
  }

  /**
   * FIXED: Filter to ONLY include real property images from /upload2/ directory
   */
  private filterRealImages(images: string[]): string[] {
    const filtered = images.filter((src) => {
      // ONLY include images from /upload2/ directory (actual property images)
      return src.includes("/upload2/");
    });

    return filtered.slice(0, 10); // Max 10 real images
  }

  private async scrapePropertyDetails(
    page: Page,
    url: string,
  ): Promise<Partial<ScrapedProperty> | null> {
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await this.delay(1500);

      const details = await page.evaluate(() => {
        const result: any = {};

        // Extract all table cells
        const allCells = Array.from(document.querySelectorAll("td"));

        for (let i = 0; i < allCells.length; i++) {
          const cell = allCells[i];
          const text = cell.textContent?.toLowerCase().trim() || "";
          const nextCell = allCells[i + 1];

          if (!nextCell) continue;
          const nextText = nextCell.textContent?.trim() || "";

          // Price
          if ((text.includes("prix") || text === "prix :") && !result.price) {
            result.priceRaw = nextText;
          }

          // Size
          if (
            (text.includes("superficie") || text.includes("surface")) &&
            !result.size
          ) {
            const sizeMatch = nextText.match(/(\d+)/);
            if (sizeMatch) {
              result.size = parseInt(sizeMatch[1], 10);
            }
          }

          // Bedrooms
          if (
            (text.includes("chambre") || text.includes("pièce")) &&
            !result.bedrooms
          ) {
            const bedroomMatch = nextText.match(/(\d+)/);
            if (bedroomMatch) {
              result.bedrooms = parseInt(bedroomMatch[1], 10);
            }
          }

          // Bathrooms
          if (text.includes("salle de bain") && !result.bathrooms) {
            const bathroomMatch = nextText.match(/(\d+)/);
            if (bathroomMatch) {
              result.bathrooms = parseInt(bathroomMatch[1], 10);
            }
          }

          // Governorate
          if (text.includes("gouvernorat") && !result.governorate) {
            // Filter out dates
            if (!nextText.match(/\d{2}\/\d{2}\/\d{4}/)) {
              result.governorate = nextText;
            }
          }

          // Delegation
          if (
            (text.includes("délégation") || text.includes("delegation")) &&
            !result.delegation
          ) {
            if (!nextText.match(/\d{2}\/\d{2}\/\d{4}/)) {
              result.delegation = nextText;
            }
          }

          // Ville/quartier (neighborhood)
          if (
            (text.includes("ville") || text.includes("quartier")) &&
            !result.neighborhood
          ) {
            // Filter out dates and prices
            if (
              !nextText.match(/\d{2}\/\d{2}\/\d{4}/) &&
              !nextText.toLowerCase().includes("dinar")
            ) {
              result.neighborhood = nextText;
            }
          }
        }

        // Extract description - look for long text in colspan cells
        const descriptionElements = Array.from(
          document.querySelectorAll("td[colspan]"),
        );
        for (const elem of descriptionElements) {
          const text = elem.textContent?.trim() || "";
          if (
            text.length > 100 &&
            !text.includes("http") &&
            !text.toLowerCase().includes("gouvernorat")
          ) {
            result.description = text.substring(0, 1000);
            break;
          }
        }

        // Extract ALL images first
        const allImages: string[] = [];
        const imgElements = document.querySelectorAll("img");

        imgElements.forEach((img) => {
          const src = img.getAttribute("src") || "";
          if (src) {
            const fullSrc = src.startsWith("http")
              ? src
              : "http://www.tunisie-annonce.com/" + src.replace(/^\/+/, "");
            allImages.push(fullSrc);
          }
        });

        result.allImages = allImages;

        // Extract phone number
        const bodyText = document.body.textContent || "";
        const phoneRegex = /(\d{8})/g;
        const phoneMatches = bodyText.match(phoneRegex);
        if (phoneMatches && phoneMatches.length > 0) {
          // Get the last phone number (usually the contact)
          result.contact_phone = phoneMatches[phoneMatches.length - 1];
        }

        return result;
      });

      // Parse price outside of page.evaluate
      if (details.priceRaw) {
        details.price = this.parsePrice(details.priceRaw);
        delete details.priceRaw;
      }

      // Filter real images outside of page.evaluate
      if (details.allImages) {
        details.images = this.filterRealImages(details.allImages);
        delete details.allImages;
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

          const url =
            pageNum === 1
              ? "http://www.tunisie-annonce.com/AnnoncesImmobilier.asp"
              : `http://www.tunisie-annonce.com/AnnoncesImmobilier.asp?page=${pageNum}`;

          await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
          await page.waitForSelector("tr.Tableau1", { timeout: 10000 });
          await this.delay(2000);

          const pageProperties = await page.evaluate(() => {
            const results: any[] = [];

            const rows = document.querySelectorAll("tr.Tableau1");

            rows.forEach((row) => {
              try {
                const cells = row.querySelectorAll("td");
                if (cells.length < 6) return;

                const link =
                  row.querySelector('a[href*="Details_Annonces_Immobilier"]') ||
                  row.querySelector('a[href*="DetailsAnnonceImmobilier"]');

                if (!link) return;

                const href = link.getAttribute("href") || "";
                const listingId = href.match(/cod_ann=(\d+)/)?.[1] || "";

                if (!listingId) return;

                const sourceUrl = href.startsWith("http")
                  ? href
                  : "http://www.tunisie-annonce.com/" + href;

                let title = link.textContent?.trim() || "";
                if (!title || title.length < 3) {
                  const titleMatch = href.match(/titre=([^&]+)/);
                  if (titleMatch) {
                    title = decodeURIComponent(
                      titleMatch[1].replace(/\+/g, " "),
                    ).trim();
                  }
                }

                const locationCell = cells[1];
                const locationLink = locationCell?.querySelector("a");
                const governorate = locationLink?.textContent?.trim() || "";

                const transactionCell = cells[3];
                const transactionText =
                  transactionCell?.textContent?.trim().toLowerCase() || "";
                let transactionType = "SALE";
                if (
                  transactionText.includes("location") ||
                  transactionText.includes("louer")
                ) {
                  transactionType = "RENT";
                }

                const typeCell = cells[5];
                const typeText = typeCell?.textContent?.trim() || "";

                if (sourceUrl && title && title.length > 3) {
                  results.push({
                    source_url: sourceUrl,
                    listing_id: listingId,
                    title: title.substring(0, 200),
                    governorate: governorate || undefined,
                    transaction_type: transactionType,
                    property_type_raw: typeText,
                  });
                }
              } catch (err) {
                console.error("Error extracting row:", err);
              }
            });

            return results;
          });

          console.log(
            `Found ${pageProperties.length} listings on page ${pageNum}`,
          );

          for (let i = 0; i < pageProperties.length; i++) {
            const basicInfo = pageProperties[i];

            // Skip duplicates
            if (seenIds.has(basicInfo.listing_id)) {
              console.log(`  Skipping duplicate: ${basicInfo.listing_id}`);
              continue;
            }
            seenIds.add(basicInfo.listing_id);

            console.log(
              `  [${i + 1}/${pageProperties.length}] ${basicInfo.title}`,
            );

            try {
              const details = await this.scrapePropertyDetails(
                page,
                basicInfo.source_url,
              );

              if (details) {
                const timestamp = new Date().toISOString();

                // Only add if we have a valid price
                if (details.price && details.price > 1000) {
                  const completeProperty: ScrapedProperty = {
                    source_url: basicInfo.source_url,
                    listing_id: basicInfo.listing_id,
                    title: basicInfo.title,
                    price: details.price,
                    size: details.size,
                    bedrooms: details.bedrooms,
                    bathrooms: details.bathrooms,
                    description: details.description,
                    images:
                      details.images && details.images.length > 0
                        ? details.images
                        : undefined,
                    governorate: details.governorate || basicInfo.governorate,
                    delegation: details.delegation,
                    neighborhood: details.neighborhood,
                    contact_phone: details.contact_phone,
                    source_website: "tunisieannonce.com",
                    scrape_timestamp: timestamp,
                    price_currency: "TND",
                    size_unit: "m2",
                    transaction_type: basicInfo.transaction_type,
                    property_type: this.normalizePropertyType(
                      basicInfo.property_type_raw,
                    ),
                  };

                  // Validate property before adding
                  const validation = validateProperty(completeProperty);
                  if (validation.valid) {
                    properties.push(completeProperty);
                    console.log(
                      `    ✓ Price: ${details.price} TND, Size: ${details.size || "N/A"} m²`,
                    );
                  } else {
                    console.log(
                      `    ⚠ Skipped: Validation failed - ${validation.warnings.join("; ")}`,
                    );
                  }
                } else {
                  console.log(`    ⚠ Skipped: No valid price found`);
                }
              }

              await this.delay(1000);
            } catch (detailError: any) {
              console.error(`  Error: ${detailError.message}`);
              errors.push(
                `Error scraping ${basicInfo.source_url}: ${detailError.message}`,
              );
            }
          }

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
      const timestamp =
        now.toISOString().replace(/[:.]/g, "-").split("T")[0] +
        "_" +
        now.toISOString().replace(/[:.]/g, "").split("T")[1].slice(0, 6);
      const dataDir = path.join(__dirname, "../../data/bronze");

      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const filePath = path.join(dataDir, `tunisie-annonce_${timestamp}.json`);
      fs.writeFileSync(filePath, JSON.stringify(properties, null, 2));

      console.log(`\n✅ Saved ${properties.length} properties to ${filePath}`);

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
      console.error("Fatal error:", error);
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
