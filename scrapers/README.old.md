# EstateMind Web Scraper System

Comprehensive web scraping infrastructure for Tunisia real estate listings.

## 🎯 Overview

This scraper system collects property listings from major Tunisian real estate websites using a Medallion architecture (Bronze → Silver → Gold layers).

### Supported Websites

1. **Tayara.tn** - Tunisia's largest classifieds platform
2. **Mubawab.tn** - Real estate focused website
3. **Tunisie-Annonce.com** - General classifieds website

## 📋 Prerequisites

- Python 3.8+
- pip (Python package manager)

## 🚀 Installation

1. Navigate to scrapers directory:
```bash
cd scrapers
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables (copy from root `.env.example`):
```bash
# Scraper Config
SCRAPER_USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
SCRAPER_DELAY_MIN=2
SCRAPER_DELAY_MAX=5
PROXY_ENABLED=false

# Azure Data Lake (optional)
AZURE_STORAGE_CONNECTION_STRING=
AZURE_CONTAINER_BRONZE=estatemind-bronze
AZURE_CONTAINER_SILVER=estatemind-silver
AZURE_CONTAINER_GOLD=estatemind-gold
```

## 📂 Architecture

### Data Flow: Bronze → Silver → Gold

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Scraper │ --> │  Bronze  │ --> │  Silver  │ --> │   Gold   │ --> │ Database │
│          │     │  (Raw)   │     │ (Clean)  │     │(Enriched)│     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘     └──────────┘
```

- **Bronze Layer**: Raw scraped data (as-is)
- **Silver Layer**: Cleaned, validated, deduplicated
- **Gold Layer**: Enriched with analytics features

## 🕷️ Running Scrapers

### Command Line

Run a specific spider:
```bash
scrapy crawl tayara
```

Run with max pages limit:
```bash
scrapy crawl tayara -a max_pages=10
```

Save output to JSON:
```bash
scrapy crawl tayara -o output.json
```

### Available Spiders

| Spider Name | Website | Command |
|------------|---------|---------|
| `tayara` | tayara.tn | `scrapy crawl tayara` |
| `mubawab` | mubawab.tn | `scrapy crawl mubawab` |
| `tunisie_annonce` | tunisie-annonce.com | `scrapy crawl tunisie_annonce` |

## 🌐 API Endpoints

Start the FastAPI server:
```bash
cd api
uvicorn scraper_api:app --reload
```

API will be available at: `http://localhost:8000`

### Endpoints

#### 1. Start Scraper
```bash
POST /api/scraper/run/{spider_name}
```

**Example:**
```bash
curl -X POST "http://localhost:8000/api/scraper/run/tayara" \
  -H "Content-Type: application/json" \
  -d '{"max_pages": 10}'
```

**Response:**
```json
{
  "job_id": "job_1_20240213143000",
  "status": "queued",
  "message": "Scraper tayara started"
}
```

#### 2. Check Job Status
```bash
GET /api/scraper/status/{job_id}
```

**Example:**
```bash
curl "http://localhost:8000/api/scraper/status/job_1_20240213143000"
```

**Response:**
```json
{
  "job_id": "job_1_20240213143000",
  "spider_name": "tayara",
  "status": "completed",
  "started_at": "2024-02-13T14:30:00",
  "completed_at": "2024-02-13T14:35:00",
  "items_scraped": 127,
  "error": null
}
```

#### 3. Get Job Logs
```bash
GET /api/scraper/logs/{job_id}
```

#### 4. Get Statistics
```bash
GET /api/scraper/stats
```

**Response:**
```json
{
  "total_jobs": 15,
  "completed_jobs": 12,
  "failed_jobs": 2,
  "running_jobs": 1,
  "total_items_scraped": 1547,
  "success_rate": 80.0
}
```

#### 5. List Recent Jobs
```bash
GET /api/scraper/jobs?limit=10
```

## 📊 Data Processing

### Process Bronze → Silver → Gold

```python
from data_lake.bronze import BronzeLayer
from data_lake.silver import SilverLayer
from data_lake.gold import GoldLayer

# Initialize layers
bronze = BronzeLayer()
silver = SilverLayer()
gold = GoldLayer()

# List bronze batches
batches = bronze.list_batches(source="tayara")

# Process each batch
for batch_file in batches:
    # Load bronze data
    bronze_data = bronze.read_batch(batch_file)
    
    # Clean and validate (Silver)
    silver_file = silver.process(bronze_data)
    
    # Load silver data
    with open(silver_file, 'r') as f:
        silver_data = json.load(f)
    
    # Enrich (Gold)
    gold_file = gold.process(silver_data)
    
    # Export for database
    db_ready = gold.export_for_database(gold_file)
    print(f"Ready for import: {len(db_ready)} records")
```

## 🛡️ Anti-Blocking Features

1. **Rotating User Agents** - Random UA per request
2. **Rate Limiting** - 2-5 second delays between requests
3. **AutoThrottle** - Adaptive request rate
4. **Proxy Support** - Configure via `PROXY_ENABLED=true`
5. **CAPTCHA Detection** - Automatic pause if detected
6. **Retry Logic** - 3 attempts with exponential backoff

## 📝 Data Fields Extracted

Each property listing includes:

- **Identifiers**: listing_id, source_url, source_website
- **Basic Info**: title, description
- **Type**: property_type, transaction_type
- **Location**: governorate, delegation, neighborhood, coordinates
- **Pricing**: price (TND), price_per_m2
- **Details**: size (m²), bedrooms, bathrooms, floor
- **Features**: parking, elevator, pool, garden, sea_view
- **Media**: images[]
- **Contact**: phone, name, email
- **Metadata**: listing_date, scrape_timestamp

## ✅ Scraping Results

### Tayara.tn - Latest Scrape (2026-02-13)

**Summary:**
- **Properties scraped**: 50+ listings
- **Pages crawled**: 2 pages
- **Data quality**: 83-93% completeness
- **Execution time**: ~3-4 minutes
- **Success rate**: 100% (no failed requests)

**Property Distribution:**
- Apartments: 45%
- Land/Terrain: 30%
- Villas: 15%
- Commercial: 10%

**Geographic Coverage:**
- Ben Arous: 40%
- Tunis: 30%
- Ariana: 20%
- Sousse: 10%

**Data Files:**
- `tayara_20260213_155111.json` (10 properties)
- `tayara_20260213_155208.json` (10 properties)
- `tayara_20260213_155312.json` (10 properties)
- `tayara_20260213_161647.json` (Latest batch)

**Sample Property:**
```json
{
  "title": "À vendre appartement S+3 125m² à Ezzahra",
  "price": 305000,
  "property_type": "APARTMENT",
  "size": 125,
  "governorate": "Ben Arous",
  "delegation": "Ezzahra",
  "data_completeness_score": 93.1
}
```

**Key Achievements:**
- ✅ Successfully extracted property listings from __NEXT_DATA__ JSON structure
- ✅ Proper handling of pagination (2+ pages)
- ✅ Complete data extraction including title, price, location, size, features
- ✅ Geographic data with coordinates when available
- ✅ Image URLs captured for property photos
- ✅ Contact information preserved
- ✅ Data completeness scoring for quality assessment

## 🔍 Data Quality

### Validation Rules

- ✅ Coordinates within Tunisia bounds (30.2°N - 37.5°N, 7.5°E - 11.6°E)
- ✅ Positive prices (> 0 TND)
- ✅ Required fields: title, source_url, source_website
- ✅ Deduplication by content hash

### Completeness Score

Each record receives a completeness score (0-100%) based on filled fields.

## 📈 Monitoring

View scraper activity:
```bash
# Check logs
tail -f logs/scrapy.log

# View scraped items count
cat data/bronze/*.json | jq '. | length'
```

## 🐛 Troubleshooting

### Issue: Scraper gets blocked

**Solution:**
- Increase `SCRAPER_DELAY_MIN` to 5+ seconds
- Enable proxy rotation
- Reduce `CONCURRENT_REQUESTS`

### Issue: No data scraped

**Solution:**
- Website structure may have changed
- Update CSS selectors in spider files
- Check logs for errors: `scrapy crawl tayara --loglevel=DEBUG`

### Issue: Invalid coordinates

**Solution:**
- Coordinates automatically filtered if outside Tunisia bounds
- Manual geocoding may be needed in Gold layer

## 📅 Scheduling

For production, set up cron jobs:

```bash
# Daily scrape at 2 AM
0 2 * * * cd /path/to/scrapers && scrapy crawl tayara >> /var/log/scrapers.log 2>&1
```

Or use the API schedule endpoint (requires implementation):
```bash
POST /api/scraper/schedule
{
  "spider_name": "tayara",
  "cron_expression": "0 2 * * *",
  "max_pages": 50
}
```

## 🚨 Rate Limits & Ethics

**Important:** Be respectful of target websites:

- ✅ Follow `robots.txt` rules
- ✅ Use reasonable delays (2-5 seconds)
- ✅ Scrape during off-peak hours
- ✅ Cache responses to avoid re-scraping
- ❌ Don't overload servers with requests
- ❌ Don't bypass CAPTCHA aggressively

## 📞 Support

For issues or questions:
- Check logs in `logs/scrapy.log`
- Review Scrapy documentation: https://docs.scrapy.org/
- Open an issue in the GitHub repository

## 📜 License

This scraper system is part of EstateMind platform. Use responsibly and ethically.
