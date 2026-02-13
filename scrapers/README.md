# EstateMind Multi-Source Scraper System

Comprehensive web scraping infrastructure for collecting property listings from three major Tunisian real estate websites.

## 🎯 Overview

This scraping system automates data collection from:

1. **Tayara.tn** - Tunisia's largest classifieds platform
2. **Mubawab.tn** - Real estate focused website
3. **TunisieAnnonce.com** - General classifieds website

### Key Features

- ✅ **Multi-Source Support** - Scrape from 3 major real estate websites
- ✅ **Scheduled Automation** - Cron-based scheduling with 4 different schedules
- ✅ **Queue Management** - Bull queue with Redis for job processing
- ✅ **API Endpoints** - Manual triggering via REST API
- ✅ **Auto-Ingestion** - Automatic database ingestion of scraped data
- ✅ **Admin Dashboard** - Web interface for managing scraping jobs
- ✅ **Rate Limiting** - Smart delays to avoid IP bans
- ✅ **Error Handling** - Retry logic with exponential backoff
- ✅ **Browser Automation** - Puppeteer for dynamic content scraping

## 📋 Prerequisites

- Node.js 18+ and npm
- Redis server (for queue management)
- PostgreSQL database (for data storage)

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install
cd scrapers && npm install && cd ..

# 2. Start Redis
docker-compose up -d redis

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys and Redis config

# 4. Run everything
npm run scrape:watch
```

## 📅 Automated Schedules

Four automated schedules run in Tunisia timezone:

| Schedule | Frequency | Sources | Pages | Description |
|----------|-----------|---------|-------|-------------|
| Full Scrape | Daily at 2:00 AM | All 3 | 10 | Comprehensive collection |
| Incremental | Every 6 hours | All 3 | 3 | Regular updates |
| Hot Listings | Every 2 hours | Tayara | 3 | Tunis area properties |
| Premium | Every 4 hours | Mubawab | 5 | Major cities |

## 🚦 Usage

### Start Scheduler + Auto-Ingestion

```bash
npm run scrape:watch
```

### Manual Scraping

```bash
# All sources
npm run scrape

# Individual sources
cd scrapers
npm run scrape:tayara
npm run scrape:mubawab
npm run scrape:tunisie
```

### API Triggering

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"sources": ["tayara"], "maxPages": 5}'
```

### Admin Dashboard

Access: `http://localhost:3000/admin/scraping`

## 📡 API Reference

### POST `/api/scrape`

**Request:**
```json
{
  "sources": ["tayara", "mubawab", "tunisie-annonce"],
  "type": "incremental",
  "maxPages": 5,
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "123",
  "message": "Scrape job queued successfully"
}
```

### GET `/api/scrape?jobId=123`

**Response:**
```json
{
  "success": true,
  "state": "completed",
  "result": {
    "totalPropertiesScraped": 150
  }
}
```

## 🐛 Troubleshooting

### Redis connection failed
- Check Redis is running: `redis-cli ping`
- Verify `.env` settings

### Scraper gets blocked
- Increase delays in scraper config
- Reduce page count
- Scrape during off-peak hours

### Jobs stuck in queue
```bash
redis-cli FLUSHDB  # Clear all jobs
```

## 📝 Environment Variables

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
SCRAPER_API_KEY=your-secret-key
NEXT_PUBLIC_SCRAPER_API_KEY=your-secret-key
DEFAULT_OWNER_ID=user-id-for-scraped-properties
```

## 📄 License

Part of EstateMind platform. Use responsibly and ethically.
