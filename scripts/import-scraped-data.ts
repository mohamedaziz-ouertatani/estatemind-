import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

interface ScrapedProperty {
  source_url: string;
  source_website: string;
  listing_id: string | null;
  title: string;
  description: string;
  price?: number;
  property_type: string;
  transaction_type: string;
  governorate?: string;
  delegation?: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  size?: number;
  bedrooms?: number;
  bathrooms?: number;
  has_parking: boolean;
  has_elevator: boolean;
  has_pool: boolean;
  has_garden: boolean;
  has_sea_view: boolean;
  is_furnished: boolean;
  images: string[];
  contact_phone?: string;
  contact_name?: string;
  listing_date?: string;
  scrape_timestamp: string;
}

// Map scraped property types to Prisma enum
function mapPropertyType(
  type: string,
): "APARTMENT" | "HOUSE" | "VILLA" | "LAND" | "COMMERCIAL" | "OFFICE" {
  const typeMap: Record<string, any> = {
    APARTMENT: "APARTMENT",
    HOUSE: "HOUSE",
    VILLA: "VILLA",
    LAND: "LAND",
    COMMERCIAL: "COMMERCIAL",
    OFFICE: "OFFICE",
  };
  return typeMap[type] || "APARTMENT";
}

// Map transaction types
function mapTransactionType(type: string): "SALE" | "RENT" | "BOTH" {
  const typeMap: Record<string, any> = {
    SALE: "SALE",
    RENT: "RENT",
    BOTH: "BOTH",
  };
  return typeMap[type] || "SALE";
}

// Normalize governorate names to match Tunisia data
function normalizeGovernorate(gov: string | undefined): string {
  if (!gov) return "Tunis";

  const governorateMap: Record<string, string> = {
    tunis: "Tunis",
    ariana: "Ariana",
    "ben arous": "Ben Arous",
    manouba: "Manouba",
    nabeul: "Nabeul",
    sousse: "Sousse",
    monastir: "Monastir",
    mahdia: "Mahdia",
    sfax: "Sfax",
    bizerte: "Bizerte",
    beja: "Béja",
    jendouba: "Jendouba",
    kef: "Le Kef",
    siliana: "Siliana",
    kairouan: "Kairouan",
    kasserine: "Kasserine",
    "sidi bouzid": "Sidi Bouzid",
    gabes: "Gabès",
    medenine: "Médenine",
    tataouine: "Tataouine",
    gafsa: "Gafsa",
    tozeur: "Tozeur",
    kebili: "Kébili",
    zaghouan: "Zaghouan",
  };

  const normalized = governorateMap[gov.toLowerCase()];
  return normalized || gov;
}

async function importScrapedData(filePath: string) {
  console.log(`📂 Reading data from: ${filePath}`);

  try {
    const fileContent = readFileSync(filePath, "utf-8");
    const scrapedProperties: ScrapedProperty[] = JSON.parse(fileContent);

    console.log(`📊 Found ${scrapedProperties.length} properties to import\n`);

    // Get or create a default user for scraped properties
    let scraperUser = await prisma.user.findFirst({
      where: { email: "scraper@estatemind.tn" },
    });

    if (!scraperUser) {
      console.log("👤 Creating scraper user...");
      scraperUser = await prisma.user.create({
        data: {
          email: "scraper@estatemind.tn",
          name: "EstateMind Scraper",
          password: "SCRAPER_ACCOUNT", // Not used for login
          userType: "NORMAL",
        },
      });
      console.log(`✅ Scraper user created: ${scraperUser.id}\n`);
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const property of scrapedProperties) {
      try {
        // Check if property already exists (by source URL)
        const existingProperty = await prisma.property.findFirst({
          where: {
            OR: [
              { title: property.title },
              // Could add more duplicate detection logic
            ],
          },
        });

        if (existingProperty) {
          console.log(`⏭️  Skipping duplicate: ${property.title}`);
          skipCount++;
          continue;
        }

        // Prepare property data
        const propertyData = {
          title: property.title,
          description: property.description || "No description available",
          propertyType: mapPropertyType(property.property_type),
          transactionType: mapTransactionType(property.transaction_type),

          // Location
          governorate: normalizeGovernorate(property.governorate),
          delegation: property.delegation || "Unknown",
          neighborhood: property.neighborhood,
          address: property.delegation || property.governorate,
          latitude: property.latitude || 36.8065, // Default to Tunis
          longitude: property.longitude || 10.1815,

          // Pricing
          price: property.price || 0,
          size: property.size || 100,

          // Details
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,

          // Features
          hasParking: property.has_parking,
          hasElevator: property.has_elevator,
          hasPool: property.has_pool,
          hasGarden: property.has_garden,
          hasSeaView: property.has_sea_view,

          // Media
          images: property.images || [],

          // Metadata
          status: "ACTIVE" as const,
          listingDate: property.listing_date
            ? new Date(property.listing_date)
            : new Date(),
          views: 0,

          // Owner
          ownerId: scraperUser.id,
        };

        const createdProperty = await prisma.property.create({
          data: propertyData,
        });

        console.log(
          `✅ Imported: ${property.title} (${property.property_type})`,
        );
        successCount++;
      } catch (error: any) {
        console.error(`❌ Error importing "${property.title}":`, error.message);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 IMPORT SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully imported: ${successCount}`);
    console.log(`⏭️  Skipped (duplicates):  ${skipCount}`);
    console.log(`❌ Errors:                ${errorCount}`);
    console.log(`📝 Total processed:       ${scrapedProperties.length}`);
    console.log("=".repeat(60) + "\n");
  } catch (error: any) {
    console.error("❌ Fatal error:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error(
    "❌ Usage: ts-node scripts/import-scraped-data.ts <path-to-json-file>",
  );
  console.error(
    "Example: ts-node scripts/import-scraped-data.ts scrapers/tayara_complete.json",
  );
  process.exit(1);
}

const filePath = args[0];

importScrapedData(filePath)
  .then(() => {
    console.log("✅ Import completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Import failed:", error);
    process.exit(1);
  });
