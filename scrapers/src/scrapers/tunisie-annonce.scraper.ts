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

const BASE_SEARCH_PARAMS =
  "rech_cod_cat=1&rech_cod_rub=&rech_cod_typ=&rech_cod_sou_typ=" +
  "&rech_cod_pay=TN&rech_cod_reg=&rech_cod_vil=&rech_cod_loc=" +
  "&rech_prix_min=&rech_prix_max=&rech_surf_min=&rech_surf_max=" +
  "&rech_age=&rech_photo=&rech_typ_cli=&rech_order_by=31";

function parseTunisieAnnonceDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim().split(" ")[0];
  const parts = trimmed.split("/");
  if (parts.length < 3) return null;
  const [dd, mm, yyyy] = parts.map(Number);
  if (!yyyy || !mm || !dd) return null;
  const dt = new Date(Date.UTC(yyyy, mm - 1, dd));
  return isNaN(dt.valueOf()) ? null : dt.toISOString();
}

function validateProperty(property: ScrapedProperty): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  if (!property.source_url) warnings.push("Missing source_url");
  if (!property.listing_id) warnings.push("Missing listing_id");
  if (!property.title) warnings.push("Missing title");
  return { valid: warnings.length === 0, warnings };
}

export class TunisieAnnonceScraper {
  private browser: Browser | null = null;
  private config: ScraperConfig;

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = {
      source: "tunisie-annonce",
      maxPages: config.maxPages || 10,
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
        Math.random() * (this.config.delayMax! - this.config.delayMin!)
      ) + this.config.delayMin!;
    return this.delay(delay);
  }

  private parsePrice(text: string): number | undefined {
    if (!text) return undefined;
    const cleaned = text.replace(/[^\d]/g, "");
    const num = parseInt(cleaned, 10);
    if (num >= 100 && num <= 100000000) return num;
    return undefined;
  }

  private normalizePropertyType(typeText: string): string {
    const normalized = (typeText || "").toLowerCase().trim();
    if (normalized.includes("terrain")) return "LAND";
    if (normalized.includes("villa") || normalized.includes("maison"))
      return "HOUSE";
    if (normalized.includes("appart") || normalized.includes("app."))
      return "APARTMENT";
    if (
      normalized.includes("bureau") ||
      normalized.includes("commercial") ||
      normalized.includes("surface")
    )
      return "COMMERCIAL";
    return "UNKNOWN";
  }

  private async scrapePropertyDetails(
    page: Page,
    url: string
  ): Promise<Partial<ScrapedProperty> | null> {
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 35000 });
      await this.delay(1200);

      const details = await page.evaluate(() => {
        let surface: number | null = null;
        let address: string | null = null;
        let description: string | null = null;
        let images: string[] = [];
        let contact_phone: string | null = null;
        let bedrooms: number | undefined;

        const labelTds = Array.from(
          document.querySelectorAll("td.da_label_field")
        );

        labelTds.forEach((labelTd) => {
          const label = labelTd.textContent?.trim().toLowerCase();
          const nextTd = labelTd.nextElementSibling as HTMLElement | null;
          const value = nextTd ? nextTd.textContent?.trim() : undefined;

          if (label === "surface" && value) {
            const m = value.replace(",", ".").match(/(\d+([.,]\d+)?)/);
            surface = m ? Math.round(parseFloat(m[1].replace(",", "."))) : null;
          }

          if (label && label.startsWith("adresse")) {
            address = value || null;
          }

          if (label === "texte") {
            description = value || null;
          }

          if (label && (label.includes("chambres") || label.includes("chambre"))) {
            if (value) {
              const m = value.replace(",", ".").match(/(\d+)/);
              bedrooms = m ? parseInt(m[1]) : undefined;
            }
          }
        });

        const descText = description ? description.toLowerCase() : "";

        if (!bedrooms) {
          const bedMatch = descText.match(/s\+(\d+)/);
          if (bedMatch) bedrooms = parseInt(bedMatch[1]);
          else {
            const b2 = descText.match(/(\d+)\s+chambres?/);
            if (b2) bedrooms = parseInt(b2[1]);
          }
        }

        images = Array.from(document.querySelectorAll("img.PhotoMin1"))
          .map((img) => img.getAttribute("src") || "")
          .filter((src) => src.includes("/upload2/"))
          .map((src) =>
            src.startsWith("http")
              ? src
              : "http://www.tunisie-annonce.com" + src
          );

        const phoneLi = document.querySelector("li.phone .da_contact_value");
        if (phoneLi) contact_phone = phoneLi.textContent?.trim() || null;

        if (!contact_phone) {
          const cellLi = document.querySelector(
            "li.cellphone .da_contact_value"
          );
          contact_phone = cellLi?.textContent?.trim() || null;
        }

        return {
          size: surface ?? undefined,
          address: address || undefined,
          description: description || undefined,
          images,
          contact_phone: contact_phone || undefined,
          bedrooms,
        };
      });

      return details;
    } catch (err) {
      console.error(`Error getting property details from ${url}:`, err);
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
          const url = `http://www.tunisie-annonce.com/AnnoncesImmobilier.asp?${BASE_SEARCH_PARAMS}&rech_page_num=${pageNum}`;
          console.log(`Scraping page: ${url}`);

          await page.goto(url, { waitUntil: "networkidle2", timeout: 20000 });
          await page.waitForSelector("tr.Tableau1", { timeout: 10000 });
          await this.delay(1500);

          const pageProperties = await page.evaluate(() => {
            const results: any[] = [];
            const rows = document.querySelectorAll("tr.Tableau1, tr.Tableau2");

            rows.forEach((row) => {
              try {
                const cells = row.querySelectorAll("td");
                if (cells.length < 13) return;

                const govCell = cells[1];
                const govLink = govCell.querySelector("a");
                const governorate = govLink
                  ? govLink.textContent?.trim()
                  : govCell.textContent?.trim();

                const transactionCell = cells[3];
                const transText = transactionCell.textContent?.trim() || "";

                const propertyTypeCell = cells[5];
                const propertyTypeText =
                  propertyTypeCell.textContent?.trim() || "";

                let title = "";
                let listingUrl = "";
                let listing_id = "";

                const links = cells[7].querySelectorAll("a");
                links.forEach((link) => {
                  const href = link.getAttribute("href") || "";
                  if (href.includes("Details_Annonces_Immobilier")) {
                    title = link.textContent?.trim() || "";
                    listingUrl = href;
                    const idMatch = href.match(/cod_ann=(\d+)/);
                    if (idMatch) listing_id = idMatch[1];
                  }
                });

                if (!listingUrl) return;
                if (!listing_id) {
                  const idFromHref = (listingUrl.match(/cod_ann=(\d+)/) || [])[1];
                  if (!idFromHref) return;
                  listing_id = idFromHref;
                }

                const priceCell = cells[9];
                const priceString = priceCell.textContent || "";

                const dateCell = cells[11];
                const listing_date = dateCell.textContent?.trim() || undefined;

                results.push({
                  source_url: listingUrl.startsWith("http")
                    ? listingUrl
                    : "http://www.tunisie-annonce.com/" +
                      listingUrl.replace(/^\//, ""),
                  listing_id,
                  source_website: "tunisie-annonce.com",
                  title,
                  governorate,
                  transaction_type: transText,
                  property_type: propertyTypeText,
                  price: priceString,
                  listing_date,
                });
              } catch {}
            });

            return results;
          });

          console.log(`Found ${pageProperties.length} listings on this page.`);

          for (let i = 0; i < pageProperties.length; i++) {
            const basicInfo = pageProperties[i];
            if (seenIds.has(basicInfo.listing_id)) continue;
            seenIds.add(basicInfo.listing_id);

            let priceNum = undefined;
            if (typeof basicInfo.price === "string")
              priceNum = this.parsePrice(basicInfo.price);

            let listingDateISO: string | undefined = undefined;
            if (basicInfo.listing_date) {
              listingDateISO =
                parseTunisieAnnonceDate(basicInfo.listing_date) || undefined;
            }

            const details = await this.scrapePropertyDetails(
              page,
              basicInfo.source_url
            );

            const fullProperty: ScrapedProperty = {
              ...basicInfo,
              price: priceNum,
              price_currency: "TND",
              property_type: this.normalizePropertyType(
                basicInfo.property_type
              ),
              scrape_timestamp: new Date().toISOString(),
              listing_date: listingDateISO ?? undefined,
              size: details?.size ?? undefined,
              address: details?.address ?? undefined,
              description: details?.description ?? undefined,
              images: details?.images ?? [],
              contact_phone: details?.contact_phone,
              bedrooms: details?.bedrooms,
            };

            const validation = validateProperty(fullProperty);
            if (validation.valid) {
              properties.push(fullProperty);
              console.log(
                `[${i + 1}/${pageProperties.length}] ${basicInfo.title} (${basicInfo.price})`
              );
            } else {
              console.warn(
                `⚠ Skipped: Validation failed - ${validation.warnings.join("; ")}`
              );
            }

            await this.delay(600);
          }

          if (pageNum < this.config.maxPages!) await this.randomDelay();
        } catch (pageError: any) {
          const errorMsg = `Error scraping page ${pageNum}: ${pageError.message}`;
          errors.push(errorMsg);
          console.error(errorMsg);
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

      const filePath = path.join(dataDir, `tunisie-annonce_${timestamp}.json`);
      fs.writeFileSync(filePath, JSON.stringify(properties, null, 2));

      console.log(`Saved ${properties.length} properties to ${filePath}`);

      return {
        source: "tunisie-annonce",
        success: errors.length === 0,
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

export default TunisieAnnonceScraper;
