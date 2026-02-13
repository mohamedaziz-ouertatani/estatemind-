import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface ScrapedProperty {
  source_url: string;
  source_website: string;
  listing_id: string | null;
  title: string;
  description: string;
  price: number | null;
  property_type: string;
  transaction_type: string;
  governorate: string;
  delegation: string;
  neighborhood?: string;
  latitude?: number;
  longitude?: number;
  size: number | null;
  bedrooms: number | null;
  bathrooms?: number | null;
  has_parking: boolean;
  has_elevator: boolean;
  has_pool: boolean;
  has_garden: boolean;
  has_sea_view: boolean;
  is_furnished: boolean;
  images: string[];
  contact_phone: string | null;
  contact_name?: string | null;
  listing_date: string | null;
  scrape_timestamp: string;
  price_currency: string;
  size_unit: string;
  price_per_m2: number | null;
  data_completeness_score: number;
  content_hash: string;
}

// Map scraped property types to Prisma enum
function mapPropertyType(
  type: string,
): "APARTMENT" | "HOUSE" | "VILLA" | "LAND" | "COMMERCIAL" | "OFFICE" {
  const typeMap: Record<string, "APARTMENT" | "HOUSE" | "VILLA" | "LAND" | "COMMERCIAL" | "OFFICE"> = {
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
  const typeMap: Record<string, "SALE" | "RENT" | "BOTH"> = {
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

async function ingestTayaraData(jsonFilePath: string) {
  console.log(`📂 Reading file: ${jsonFilePath}`);
  
  const rawData = fs.readFileSync(jsonFilePath, 'utf-8');
  const properties: ScrapedProperty[] = JSON.parse(rawData);
  
  console.log(`📊 Found ${properties.length} properties to ingest`);
  
  // Get or create scraper user
  let scraperUser = await prisma.user.findFirst({
    where: { email: "scraper@estatemind.tn" },
  });

  if (!scraperUser) {
    console.log("👤 Creating scraper user...");
    // Hash a secure random password for the scraper account
    const hashedPassword = await bcrypt.hash('SCRAPER_ACCOUNT_' + Date.now(), 10);
    scraperUser = await prisma.user.create({
      data: {
        email: "scraper@estatemind.tn",
        name: "EstateMind Scraper",
        password: hashedPassword,
        userType: "NORMAL",
      },
    });
    console.log(`✅ Scraper user created: ${scraperUser.id}\n`);
  }
  
  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const prop of properties) {
    try {
      // Check if property already exists
      const existing = await prisma.property.findFirst({
        where: {
          OR: [
            { sourceUrl: prop.source_url },
            { 
              AND: [
                { title: prop.title },
                { governorate: normalizeGovernorate(prop.governorate) }
              ]
            }
          ]
        }
      });
      
      if (existing) {
        console.log(`⏭️  Skipping duplicate: ${prop.title}`);
        skipped++;
        continue;
      }
      
      // Insert property
      await prisma.property.create({
        data: {
          sourceUrl: prop.source_url,
          sourceWebsite: prop.source_website,
          externalId: prop.listing_id,
          title: prop.title,
          description: prop.description || '',
          price: prop.price || 0,
          propertyType: mapPropertyType(prop.property_type),
          transactionType: mapTransactionType(prop.transaction_type),
          governorate: normalizeGovernorate(prop.governorate),
          delegation: prop.delegation || 'Unknown',
          neighborhood: prop.neighborhood,
          latitude: prop.latitude || 36.8065, // Default to Tunis
          longitude: prop.longitude || 10.1815,
          size: prop.size || 100,
          bedrooms: prop.bedrooms,
          bathrooms: prop.bathrooms,
          hasParking: prop.has_parking,
          hasElevator: prop.has_elevator,
          hasPool: prop.has_pool,
          hasGarden: prop.has_garden,
          hasSeaView: prop.has_sea_view,
          isFurnished: prop.is_furnished,
          images: prop.images,
          contactPhone: prop.contact_phone,
          contactName: prop.contact_name,
          listingDate: prop.listing_date ? new Date(prop.listing_date) : new Date(),
          scrapeTimestamp: new Date(prop.scrape_timestamp),
          priceCurrency: prop.price_currency,
          sizeUnit: prop.size_unit,
          pricePerM2: prop.price_per_m2,
          dataCompletenessScore: prop.data_completeness_score,
          contentHash: prop.content_hash,
          status: 'ACTIVE',
          ownerId: scraperUser.id,
        }
      });
      
      inserted++;
      console.log(`✅ Inserted: ${prop.title}`);
      
    } catch (error) {
      console.error(`❌ Error inserting ${prop.title}:`, error);
      errors++;
    }
  }
  
  console.log('\n📊 Ingestion Summary:');
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
}

async function main() {
  const scrapedDataDir = path.join(__dirname, '..', 'scrapers', 'data');
  
  // Check if directory exists
  if (!fs.existsSync(scrapedDataDir)) {
    console.log(`❌ Directory not found: ${scrapedDataDir}`);
    console.log(`💡 Create the directory and add scraped JSON files first.`);
    process.exit(1);
  }
  
  // Get all JSON files from scraped data
  const files = fs.readdirSync(scrapedDataDir)
    .filter(f => f.startsWith('tayara_') && f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log(`❌ No Tayara data files found in ${scrapedDataDir}`);
    console.log(`💡 Files should match pattern: tayara_*.json`);
    process.exit(1);
  }
  
  console.log(`🔍 Found ${files.length} Tayara data files\n`);
  
  for (const file of files) {
    await ingestTayaraData(path.join(scrapedDataDir, file));
    console.log('\n---\n');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
