import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
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

async function getScraperUser() {
  const email = "scraper@estatemind.internal";

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const hashedPassword = await bcrypt.hash("scraper-internal-only", 10);
    user = await prisma.user.create({
      data: {
        email,
        name: "Data Scraper",
        password: hashedPassword,
        userType: "ADMIN",
        subscriptionTier: "FREE",
      },
    });
    console.log("Created scraper user");
  }

  return user;
}

async function ingestJSONFile(filePath: string, scraperId: string) {
  console.log(`\nProcessing: ${path.basename(filePath)}`);

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const scrapedData: ScrapedProperty[] = JSON.parse(fileContent);

  let successCount = 0;
  let errorCount = 0;
  let duplicateCount = 0;

  for (const property of scrapedData) {
    try {
      const existing = await prisma.property.findFirst({
        where: {
          externalId: property.listing_id,
          sourceWebsite: property.source_website,
        },
      });

      if (existing) {
        console.log(`Duplicate: ${property.title?.substring(0, 50)}...`);
        duplicateCount++;
        continue;
      }

      const propertyTypeMap: Record<string, string> = {
        APARTMENT: "APARTMENT",
        HOUSE: "HOUSE",
        VILLA: "VILLA",
        LAND: "LAND",
        COMMERCIAL: "COMMERCIAL",
        OFFICE: "OFFICE",
      };

      const transactionTypeMap: Record<string, string> = {
        SALE: "SALE",
        RENT: "RENT",
        BOTH: "BOTH",
      };

      const propertyType =
        propertyTypeMap[property.property_type?.toUpperCase() || ""] ||
        "APARTMENT";
      const transactionType =
        transactionTypeMap[property.transaction_type?.toUpperCase() || ""] ||
        "SALE";

      const latitude = property.latitude ?? 36.8065;
      const longitude = property.longitude ?? 10.1815;

      await prisma.property.create({
        data: {
          title: property.title,
          description: property.description || "No description available",
          propertyType,
          transactionType,
          governorate: property.governorate || "Tunis",
          delegation: property.delegation || "Unknown",
          neighborhood: property.neighborhood || null,
          address: null,
          latitude,
          longitude,
          price: property.price || 0,
          size: property.size || 0,
          bedrooms: property.bedrooms || null,
          bathrooms: null,
          floor: null,
          hasParking: property.has_parking || false,
          hasElevator: property.has_elevator || false,
          hasPool: property.has_pool || false,
          hasGarden: property.has_garden || false,
          hasSeaView: property.has_sea_view || false,
          isFurnished: property.is_furnished || false,
          images: property.images || [],
          virtualTour: null,
          listingDate: property.listing_date
            ? new Date(property.listing_date)
            : new Date(),
          status: "ACTIVE",
          views: 0,
          sourceUrl: property.source_url || null,
          sourceWebsite: property.source_website || null,
          externalId: property.listing_id || null,
          contactPhone: property.contact_phone || null,
          contactName: property.contact_name || null,
          scrapeTimestamp: property.scrape_timestamp
            ? new Date(property.scrape_timestamp)
            : new Date(),
          priceCurrency: property.price_currency || "TND",
          sizeUnit: property.size_unit || "m2",
          pricePerM2: property.price_per_m2 || null,
          dataCompletenessScore: property.data_completeness_score || null,
          contentHash: property.content_hash || null,
          aiValuation: null,
          valuationConfidence: null,
          isPriceFair: null,
          ownerId: scraperId,
        },
      });

      console.log(`Success: ${property.title?.substring(0, 60)}`);
      successCount++;
    } catch (error) {
      console.error(`Error ingesting ${property.title}:`, error);
      errorCount++;
    }
  }

  console.log(`\nSummary for ${path.basename(filePath)}:`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Duplicates: ${duplicateCount}`);
  console.log(`   Errors: ${errorCount}`);
}

async function main() {
  console.log("Starting data ingestion...\n");

  const scraperUser = await getScraperUser();

  const scrapedDataDir = path.join(
    __dirname,
    "..",
    "scrapers",
    "data",
    "bronze",
  );

  console.log(`Looking in: ${scrapedDataDir}`);

  const patterns = [
    "tayara_*.json",
    "mubawab_*.json", 
    "tunisie-annonce_*.json"
  ];

  let allFiles: string[] = [];

  for (const filePattern of patterns) {
    const rawPattern = path.join(scrapedDataDir, filePattern);
    const pattern = rawPattern.replace(/\\/g, "/");
    
    console.log(`Searching pattern: ${filePattern}`);
    
    const files = await glob(pattern, { nodir: true });
    allFiles = allFiles.concat(files);
  }

  console.log(`\nFound ${allFiles.length} total files to process`);

  if (allFiles.length === 0) {
    console.log("No files found matching any pattern.");
    console.log(`   Patterns: tayara_*.json, mubawab_*.json, tunisie-annonce_*.json`);
    console.log(`   In directory: ${scrapedDataDir}`);

    try {
      const allFilesInDir = fs.readdirSync(scrapedDataDir);
      console.log(`\nFiles in directory:`);
      allFilesInDir.forEach(f => console.log(`   - ${f}`));
    } catch (err) {
      console.error("Could not read directory:", err);
    }
    return;
  }

  allFiles.sort();

  for (const filePath of allFiles) {
    await ingestJSONFile(filePath, scraperUser.id);
  }

  console.log("\nIngestion complete!");
  console.log(`Total files processed: ${allFiles.length}`);
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
