// scripts/ingest-scraped-data.ts
import { PrismaClient, PropertyType, TransactionType } from "@prisma/client";
import fs from "fs";
import path from "path";
import { glob } from "glob";

const prisma = new PrismaClient();

interface ScrapedProperty {
  source_url: string;
  source_website: string;
  listing_id: string;
  title: string;
  description?: string;
  price?: number;
  property_type?: string;
  transaction_type?: string;
  governorate?: string;
  delegation?: string;
  neighborhood?: string;
  size?: number;
  bedrooms?: number;
  has_parking?: boolean;
  has_elevator?: boolean;
  has_pool?: boolean;
  has_garden?: boolean;
  has_sea_view?: boolean;
  is_furnished?: boolean;
  images?: string[];
  contact_phone?: string;
  contact_name?: string;
  listing_date?: string;
  scrape_timestamp?: string;
  has_coordinates?: boolean;
  has_price?: boolean;
  price_currency?: string;
  size_unit?: string;
  price_per_m2?: number;
  data_completeness_score?: number;
  content_hash?: string;
  latitude?: number;
  longitude?: number;
}

// Get or create default user for scraped properties
async function getScraperUser() {
  let user = await prisma.user.findUnique({
    where: { email: "scraper@estatemind.tn" },
  });

  if (!user) {
    const bcrypt = await import("bcryptjs");
    user = await prisma.user.create({
      data: {
        email: "scraper@estatemind.tn",
        name: "Scraper Bot",
        password: await bcrypt.hash("secure-random-password-here", 10),
        userType: "ADMIN",
        subscriptionTier: "FREE",
      },
    });
    console.log("✅ Created scraper user");
  }

  return user;
}

async function ingestJSONFile(filePath: string, scraperUserId: string) {
  console.log(`\n📂 Processing: ${path.basename(filePath)}`);

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const scrapedData: ScrapedProperty[] = JSON.parse(fileContent);

  let successCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;

  for (const property of scrapedData) {
    try {
      // Check if property already exists
      const existing = await prisma.property.findUnique({
        where: { sourceUrl: property.source_url },
      });

      if (existing) {
        console.log(`⚠️  Duplicate: ${property.title}`);
        duplicateCount++;
        continue;
      }

      // Map property types
      const propertyTypeMap: Record<string, PropertyType> = {
        APARTMENT: "APARTMENT",
        HOUSE: "HOUSE",
        VILLA: "VILLA",
        LAND: "LAND",
        COMMERCIAL: "COMMERCIAL",
        OFFICE: "OFFICE",
      };

      const transactionTypeMap: Record<string, TransactionType> = {
        SALE: "SALE",
        RENT: "RENT",
        BOTH: "BOTH",
      };

      // Create property with proper type mapping
      await prisma.property.create({
        data: {
          // Required fields
          title: property.title || "Untitled Property",
          description: property.description || "No description available",
          propertyType:
            propertyTypeMap[property.property_type || "APARTMENT"] ||
            "APARTMENT",
          transactionType:
            transactionTypeMap[property.transaction_type || "SALE"] || "SALE",

          // Location (required)
          governorate: property.governorate || "Unknown",
          delegation: property.delegation || "Unknown",
          neighborhood: property.neighborhood,
          latitude: property.latitude,
          longitude: property.longitude,

          // Details (now nullable)
          price: property.price,
          size: property.size,
          bedrooms: property.bedrooms,

          // Boolean fields with defaults
          hasParking: property.has_parking ?? false,
          hasElevator: property.has_elevator ?? false,
          hasPool: property.has_pool ?? false,
          hasGarden: property.has_garden ?? false,
          hasSeaView: property.has_sea_view ?? false,
          isFurnished: property.is_furnished ?? false,

          // Media
          images: property.images || [],

          // Scraped data
          sourceUrl: property.source_url,
          sourceWebsite: property.source_website,
          externalId: property.listing_id,
          contactPhone: property.contact_phone,
          contactName: property.contact_name,
          scrapeTimestamp: property.scrape_timestamp
            ? new Date(property.scrape_timestamp)
            : undefined,
          priceCurrency: property.price_currency || "TND",
          sizeUnit: property.size_unit || "m2",
          pricePerM2: property.price_per_m2,
          dataCompletenessScore: property.data_completeness_score,
          contentHash: property.content_hash,

          // Dates
          listingDate: property.listing_date
            ? new Date(property.listing_date)
            : new Date(),

          // Owner
          ownerId: scraperUserId,
        },
      });

      console.log(`✅ Ingested: ${property.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error ingesting ${property.title}:`);
      console.error(error);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary for ${path.basename(filePath)}:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ⚠️  Duplicates: ${duplicateCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
}

async function main() {
  console.log("🚀 Starting data ingestion...\n");

  // Get or create scraper user
  const scraperUser = await getScraperUser();

  const scrapedDataDir = path.join(
    __dirname,
    "..",
    "scrapers",
    "data",
    "bronze",
  );

  console.log(`📁 Looking in: ${scrapedDataDir}`);

  const rawPattern = path.join(scrapedDataDir, "tayara_20260213_*.json");
  const pattern = rawPattern.replace(/\\/g, "/");

  const files = await glob(pattern, { nodir: true });

  console.log(`📋 Found ${files.length} files matching pattern`);

  if (files.length === 0) {
    console.log("⚠️  No files found matching pattern.");
    console.log(`   Pattern: tayara_20260213_*.json`);
    console.log(`   In directory: ${scrapedDataDir}`);

    try {
      const allFiles = fs.readdirSync(scrapedDataDir);
      console.log(
        `\n📋 Files in directory: ${allFiles.length > 0 ? allFiles.join(", ") : "none"}`,
      );
    } catch (err) {
      console.error("❌ Could not read directory:", err);
    }
    return;
  }

  for (const filePath of files) {
    await ingestJSONFile(filePath, scraperUser.id);
  }

  console.log("\n✨ Ingestion complete!");
}

main()
  .catch((e) => {
    console.error("❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
