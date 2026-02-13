# Tayara.tn Scraper Integration Guide

## Overview
This guide explains how to use the integrated Tayara.tn scraper and data ingestion pipeline.

## Prerequisites

### Python Environment (for Scraper)
```bash
cd scrapers
pip install -r requirements.txt
```

### Node.js Environment (for Data Ingestion)
```bash
npm install
```

### Database Setup
Ensure your `.env` file has a valid `DATABASE_URL`:
```env
DATABASE_URL="postgresql://user:password@host:5432/estatemind?schema=public"
```

Then run Prisma migrations:
```bash
npx prisma migrate dev
```

## Usage

### Step 1: Run the Scraper

#### Option A: Using npm script (recommended)
```bash
npm run scraper:tayara
```

This will scrape up to 5 pages from Tayara.tn.

#### Option B: Direct Scrapy command
```bash
cd scrapers
scrapy crawl tayara -a max_pages=2 -o data/tayara_$(date +%Y%m%d_%H%M%S).json
```

**Parameters:**
- `max_pages`: Number of pages to scrape (default: unlimited)
- `-o`: Output file path (saves in JSON format)

**Output:**
The scraper will create a JSON file in `scrapers/data/` with this naming pattern:
- `tayara_YYYYMMDD_HHMMSS.json`

### Step 2: Ingest Data into Database

#### Using npm script (recommended)
```bash
npm run scraper:ingest
```

This will automatically:
1. Find all `tayara_*.json` files in `scrapers/data/`
2. Load each file
3. Check for duplicates (by source URL or title+governorate)
4. Insert new properties into the database
5. Show a summary of results

#### Manual ingestion with specific file
```bash
npx tsx scripts/ingest_tayara_data.ts
```

**Expected Output:**
```
🔍 Found 3 Tayara data files

📂 Reading file: /path/to/scrapers/data/tayara_20260213_155111.json
📊 Found 10 properties to ingest
✅ Inserted: À vendre appartement S+3 125m² à Ezzahra
✅ Inserted: Villa S+4 avec jardin à La Marsa
⏭️  Skipping duplicate: Appartement neuf à Tunis
...

📊 Ingestion Summary:
   ✅ Inserted: 8
   ⏭️  Skipped: 2
   ❌ Errors: 0

---
```

## Data Structure

### Scraped JSON Format
Each property in the JSON file has this structure:
```json
{
  "source_url": "https://www.tayara.tn/item/12345",
  "source_website": "tayara.tn",
  "listing_id": "12345",
  "title": "À vendre appartement S+3 125m² à Ezzahra",
  "description": "Bel appartement...",
  "price": 305000,
  "property_type": "APARTMENT",
  "transaction_type": "SALE",
  "governorate": "Ben Arous",
  "delegation": "Ezzahra",
  "size": 125,
  "bedrooms": 3,
  "has_parking": true,
  "images": ["url1", "url2"],
  "scrape_timestamp": "2026-02-13T16:16:47.123456",
  ...
}
```

### Database Schema Fields
The following fields are stored in the PostgreSQL database:

**Core Fields:**
- `id`, `title`, `description`
- `propertyType`, `transactionType`
- `governorate`, `delegation`, `neighborhood`
- `latitude`, `longitude`
- `price`, `size`, `bedrooms`, `bathrooms`

**Features:**
- `hasParking`, `hasElevator`, `hasPool`, `hasGarden`, `hasSeaView`, `isFurnished`

**Scraper-Specific:**
- `sourceUrl`, `sourceWebsite`, `externalId`
- `contactPhone`, `contactName`
- `scrapeTimestamp`, `priceCurrency`, `sizeUnit`, `pricePerM2`
- `dataCompletenessScore`, `contentHash`

## Duplicate Detection

The ingestion script prevents duplicates using two methods:

1. **By Source URL**: Exact match of `sourceUrl`
2. **By Title + Location**: Combination of `title` and `governorate`

If a duplicate is found, the property is skipped and logged.

## Troubleshooting

### Scraper Issues

**Problem:** Scraper gets blocked or returns no results
**Solution:**
- The scraper uses rate limiting (3 seconds between requests)
- Check `scrapers/logs/` for error messages
- Verify the website structure hasn't changed

**Problem:** Module not found errors
**Solution:**
```bash
cd scrapers
pip install -r requirements.txt
```

### Ingestion Issues

**Problem:** "Directory not found" error
**Solution:**
```bash
mkdir -p scrapers/data
```

**Problem:** Database connection errors
**Solution:**
- Verify your `.env` file has correct `DATABASE_URL`
- Run `npx prisma migrate dev` to ensure schema is up to date
- Check database is running and accessible

**Problem:** TypeScript errors
**Solution:**
```bash
npm install
npx prisma generate
```

## Performance Notes

- **Scraping Speed**: ~3-4 seconds per property (respecting rate limits)
- **Pages per Run**: 2-5 pages recommended (10-25 properties per page)
- **Ingestion Speed**: ~100-200 properties per minute
- **Duplicate Check**: O(n) per property (database lookup)

## Data Quality

The scraper includes a `data_completeness_score` field (0-100%) indicating:
- 90-100%: Excellent (all fields populated)
- 80-89%: Good (most fields populated)
- 70-79%: Fair (some missing fields)
- <70%: Poor (many missing fields)

## Best Practices

1. **Regular Scraping**: Run daily to keep listings fresh
2. **Monitor Duplicates**: High skip rate may indicate redundant scraping
3. **Verify Data**: Spot-check imported properties in database
4. **Backup**: Keep scraped JSON files as backup/audit trail
5. **Rate Limiting**: Don't reduce DOWNLOAD_DELAY below 3 seconds

## Integration with EstateMind App

Once properties are in the database, they're automatically available in:
- Property search and listing pages
- Map view (using lat/lng coordinates)
- AI valuation system
- Investment opportunity detection

## Support

For issues or questions:
1. Check logs in `scrapers/logs/`
2. Review this documentation
3. Consult main `scrapers/README.md`
4. Open an issue in the repository
