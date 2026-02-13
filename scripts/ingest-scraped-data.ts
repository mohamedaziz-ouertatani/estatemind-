import { PrismaClient } from "@prisma/client";
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

async function ingestJSONFile(filePath: string) {
  console.log(`\n📂 Processing: ${filePath}`);

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const scrapedData: ScrapedProperty[] = JSON.parse(fileContent);

  let successCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;

  for (const property of scrapedData) {
    try {
      const existing = await prisma.property.findUnique({
        where: {
          sourceUrl: property.source_url,
        },
      });

      if (existing) {
        console.log(`⚠️  Duplicate: ${property.title} (already in database)`);
        duplicateCount++;
        continue;
      }

      const propertyTypeMap: Record<string, string> = {
        APARTMENT: "APARTMENT",
        HOUSE: "HOUSE",
        VILLA: "VILLA",
        LAND: "LAND",
        COMMERCIAL: "COMMERCIAL",
      };

      const transactionTypeMap: Record<string, string> = {
        SALE: "SALE",
        RENT: "RENT",
      };

      const mappedPropertyType =
        propertyTypeMap[property.property_type?.toUpperCase() || ""] ||
        "APARTMENT";
      const mappedTransactionType =
        transactionTypeMap[property.transaction_type?.toUpperCase() || ""] ||
        "SALE";

      await prisma.property.create({
        data: {
          title: property.title,
          description: property.description || "",
          propertyType: mappedPropertyType,
          transactionType: mappedTransactionType,
          price: property.price ? Number(property.price) : null,
          priceCurrency: property.price_currency || "TND",
          size: property.size ? Number(property.size) : null,
          sizeUnit: property.size_unit || "m2",
          bedrooms: property.bedrooms ? Number(property.bedrooms) : null,
          governorate: property.governorate || "",
          delegation: property.delegation || "",
          neighborhood: property.neighborhood,
          latitude: property.latitude ? Number(property.latitude) : null,
          longitude: property.longitude ? Number(property.longitude) : null,
          hasParking: property.has_parking || false,
          hasElevator: property.has_elevator || false,
          hasPool: property.has_pool || false,
          hasGarden: property.has_garden || false,
          hasSeaView: property.has_sea_view || false,
          isFurnished: property.is_furnished || false,
          images: property.images || [],
          sourceUrl: property.source_url,
          sourceWebsite: property.source_website,
          listingId: property.listing_id,
          contactPhone: property.contact_phone,
          contactName: property.contact_name,
          listingDate: property.listing_date
            ? new Date(property.listing_date)
            : null,
          dataCompletenessScore: property.data_completeness_score || 0,
          contentHash: property.content_hash,
        },
      });

      console.log(`✅ Success: ${property.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error processing ${property.title}:`, error);
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

  try {
    // Get the root directory (where package.json is)
    const rootDir = path.resolve(__dirname, "..");

    // Define the pattern for scraped files
    const pattern = path.join(
      rootDir,
      "scrapers",
      "data",
      "bronze",
      "tayara_*.json",
    );

    console.log(`🔍 Looking for files matching: ${pattern}\n`);

    // Use glob to find all matching files
    const files = await glob(pattern, { windowsPathsNoEscape: true });

    if (files.length === 0) {
      console.log("⚠️  No files found matching pattern.");
      console.log(
        `   Looking in: ${path.join(rootDir, "scrapers", "data", "bronze")}`,
      );
      return;
    }

    console.log(`📁 Found ${files.length} file(s) to process\n`);

    for (const file of files) {
      await ingestJSONFile(file);
    }

    console.log("\n🎉 Data ingestion completed!");
  } catch (error) {
    console.error("❌ Fatal error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
