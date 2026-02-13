"""
Scrapy settings for estatemind_scrapers project
"""
import os
from dotenv import load_dotenv

load_dotenv()

BOT_NAME = "estatemind_scrapers"
SPIDER_MODULES = ["estatemind_scrapers.spiders"]
NEWSPIDER_MODULE = "estatemind_scrapers.spiders"

# Crawl responsibly by identifying yourself (and your website) on the user-agent
USER_AGENT = os.getenv("SCRAPER_USER_AGENT", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

# Obey robots.txt rules
ROBOTSTXT_OBEY = True

# Configure maximum concurrent requests performed by Scrapy (default: 16)
CONCURRENT_REQUESTS = 8

# Configure a delay for requests for the same website (default: 0)
# See https://docs.scrapy.org/en/latest/topics/settings.html#download-delay
DOWNLOAD_DELAY = float(os.getenv("SCRAPER_DELAY_MIN", "2"))
RANDOMIZE_DOWNLOAD_DELAY = True

# The download delay setting will honor only one of:
CONCURRENT_REQUESTS_PER_DOMAIN = 4
CONCURRENT_REQUESTS_PER_IP = 4

# Disable cookies (enabled by default)
COOKIES_ENABLED = True

# Disable Telemetry (see https://docs.scrapy.org/en/latest/topics/telemetry.html)
TELEMETRY_ENABLED = False

# Override the default request headers:
DEFAULT_REQUEST_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}

# Enable or disable spider middlewares
# See https://docs.scrapy.org/en/latest/topics/spider-middleware.html
SPIDER_MIDDLEWARES = {
    "estatemind_scrapers.middlewares.EstatemindScrapersSpiderMiddleware": 543,
}

# Enable or disable downloader middlewares
# See https://docs.scrapy.org/en/latest/topics/downloader-middleware.html
DOWNLOADER_MIDDLEWARES = {
    "estatemind_scrapers.middlewares.EstatemindScrapersDownloaderMiddleware": 543,
    "scrapy.downloadermiddlewares.useragent.UserAgentMiddleware": None,
    "scrapy_user_agents.middlewares.RandomUserAgentMiddleware": 400,
}

# Enable rotating proxies if configured
PROXY_ENABLED = os.getenv("PROXY_ENABLED", "false").lower() == "true"
if PROXY_ENABLED:
    DOWNLOADER_MIDDLEWARES["scrapy_rotating_proxies.middlewares.RotatingProxyMiddleware"] = 610
    DOWNLOADER_MIDDLEWARES["scrapy_rotating_proxies.middlewares.BanDetectionMiddleware"] = 620
    ROTATING_PROXY_LIST_PATH = os.getenv("PROXY_LIST_PATH", "proxies.txt")

# Enable or disable extensions
# See https://docs.scrapy.org/en/latest/topics/extensions.html
EXTENSIONS = {
    "scrapy.extensions.telnet.TelnetConsole": None,
}

# Configure item pipelines
# See https://docs.scrapy.org/en/latest/topics/item-pipeline.html
ITEM_PIPELINES = {
    "estatemind_scrapers.pipelines.DataValidationPipeline": 100,
    "estatemind_scrapers.pipelines.DataCleaningPipeline": 200,
    "estatemind_scrapers.pipelines.DeduplicationPipeline": 300,
    "estatemind_scrapers.pipelines.BronzeLayerPipeline": 400,
}

# Enable and configure the AutoThrottle extension (disabled by default)
# See https://docs.scrapy.org/en/latest/topics/autothrottle.html
AUTOTHROTTLE_ENABLED = True
AUTOTHROTTLE_START_DELAY = 2
AUTOTHROTTLE_MAX_DELAY = 10
AUTOTHROTTLE_TARGET_CONCURRENCY = 2.0
AUTOTHROTTLE_DEBUG = False

# Enable and configure HTTP caching (disabled by default)
# See https://docs.scrapy.org/en/latest/topics/downloader-middleware.html#httpcache-middleware-settings
HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 3600
HTTPCACHE_DIR = "httpcache"
HTTPCACHE_IGNORE_HTTP_CODES = [500, 502, 503, 504, 400, 403, 404, 408]
HTTPCACHE_STORAGE = "scrapy.extensions.httpcache.FilesystemCacheStorage"

# Set settings whose default value is deprecated to a future-proof value
REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"

# Retry configuration
RETRY_ENABLED = True
RETRY_TIMES = 3
RETRY_HTTP_CODES = [500, 502, 503, 504, 408, 429]

# Logging
LOG_LEVEL = "INFO"
LOG_FORMAT = "%(asctime)s [%(name)s] %(levelname)s: %(message)s"
LOG_DATEFORMAT = "%Y-%m-%d %H:%M:%S"

# Azure Data Lake settings (if configured)
AZURE_STORAGE_CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING", "")
AZURE_CONTAINER_BRONZE = os.getenv("AZURE_CONTAINER_BRONZE", "estatemind-bronze")
AZURE_CONTAINER_SILVER = os.getenv("AZURE_CONTAINER_SILVER", "estatemind-silver")
AZURE_CONTAINER_GOLD = os.getenv("AZURE_CONTAINER_GOLD", "estatemind-gold")

# Local data storage path (fallback if Azure not configured)
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
BRONZE_DIR = os.path.join(DATA_DIR, "bronze")
SILVER_DIR = os.path.join(DATA_DIR, "silver")
GOLD_DIR = os.path.join(DATA_DIR, "gold")

# Tunisia bounding box for coordinate validation
TUNISIA_BBOX = {
    "min_lat": 30.2,
    "max_lat": 37.5,
    "min_lng": 7.5,
    "max_lng": 11.6,
}
