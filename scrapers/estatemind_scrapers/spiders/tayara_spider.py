"""
Tayara.tn Spider - Tunisia's largest classifieds website
Target: https://www.tayara.tn/listing/c/immobilier/
"""
import scrapy
import json
import re
from datetime import datetime
from urllib.parse import urljoin
from estatemind_scrapers.items import PropertyItem


class TayaraSpider(scrapy.Spider):
    name = "tayara"
    allowed_domains = ["tayara.tn"]
    start_urls = ["https://www.tayara.tn/listing/c/immobilier/?page=1"]
    
    custom_settings = {
        "DOWNLOAD_DELAY": 3,
        "CONCURRENT_REQUESTS": 4,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
        "COOKIES_ENABLED": True,
        "ROBOTSTXT_OBEY": True,
        
        "DOWNLOADER_MIDDLEWARES": {
            "estatemind_scrapers.middlewares.EstatemindScrapersDownloaderMiddleware": None,
            "scrapy.downloadermiddlewares.useragent.UserAgentMiddleware": None,
            "scrapy_user_agents.middlewares.RandomUserAgentMiddleware": 400,
        },
        
        "USER_AGENT": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        
        "DEFAULT_REQUEST_HEADERS": {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "fr-FR,fr;q=0.9,en-US;q=0.8,ar;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Cache-Control": "max-age=0",
        },
        
        "RETRY_TIMES": 2,
        "RETRY_HTTP_CODES": [500, 502, 503, 504, 408],
    }
    
    def __init__(self, max_pages=None, *args, **kwargs):
        super(TayaraSpider, self).__init__(*args, **kwargs)
        self.max_pages = int(max_pages) if max_pages else None
        self.pages_scraped = 0
    
    def parse(self, response):
        """Parse the listing page to extract property links"""
        self.logger.info(f"Parsing page: {response.url}")
        self.logger.info(f"Response status: {response.status}")
        
        # Extract property links from any <a> tag containing '/item/'
        all_links = response.css('a::attr(href)').getall()
        property_links = [
            link for link in all_links 
            if link and '/item/' in link
        ]
        
        self.logger.info(f"Found {len(property_links)} property links on this page")
        
        if len(property_links) == 0:
            self.logger.warning("No property links found on this page!")
            return
        
        # Follow each property link
        for link in property_links:
            full_url = urljoin(response.url, link)
            yield scrapy.Request(
                full_url,
                callback=self.parse_property,
                errback=self.handle_error,
                dont_filter=False
            )
        
        # Pagination
        self.pages_scraped += 1
        if self.max_pages is None or self.pages_scraped < self.max_pages:
            next_page_num = self.pages_scraped + 1
            next_page_url = f"https://www.tayara.tn/listing/c/immobilier/?page={next_page_num}"
            self.logger.info(f"Following next page: {next_page_url}")
            yield scrapy.Request(next_page_url, callback=self.parse)
    
    def parse_property(self, response):
        """Parse individual property page - Extract from Next.js __NEXT_DATA__"""
        self.logger.info(f"Parsing property: {response.url}")
        
        # Extract Next.js data
        next_data = self._extract_next_data(response)
        
        if not next_data:
            self.logger.error(f"Could not find __NEXT_DATA__ in {response.url}")
            return
        
        # Navigate to adDetails
        try:
            ad_details = next_data.get('props', {}).get('pageProps', {}).get('adDetails', {})
            
            if not ad_details:
                self.logger.error(f"No adDetails found in __NEXT_DATA__ for {response.url}")
                return
            
            item = PropertyItem()
            
            # Basic identifiers
            item["source_url"] = response.url
            item["source_website"] = "tayara.tn"
            item["listing_id"] = ad_details.get('id')
            
            # Title and description
            item["title"] = ad_details.get('title')
            item["description"] = ad_details.get('description', '')
            
            # Price
            price = ad_details.get('price')
            if price and isinstance(price, (int, float)):
                item["price"] = int(price)
            
            # Property type and transaction type
            item["property_type"], item["transaction_type"] = self._extract_types(
                ad_details.get('category'),
                ad_details.get('title')
            )
            
            # Location
            location = ad_details.get('location', {})
            item["governorate"] = location.get('governorate')
            item["delegation"] = location.get('delegation')
            item["neighborhood"] = location.get('neighborhood')
            
            # Coordinates
            coordinates = location.get('coordinates', {})
            if coordinates:
                item["latitude"] = coordinates.get('lat')
                item["longitude"] = coordinates.get('lng')
            
            # Extract size from description
            item["size"] = self._extract_size(item.get("description", "") + " " + item.get("title", ""))
            
            # Extract bedrooms from title/description
            item["bedrooms"] = self._extract_bedrooms(item.get("title", ""))
            
            # Features - from description text
            description_lower = (item.get("description") or "").lower()
            title_lower = (item.get("title") or "").lower()
            combined_text = description_lower + " " + title_lower
            
            item["has_parking"] = any(word in combined_text for word in ["parking", "garage"])
            item["has_elevator"] = any(word in combined_text for word in ["ascenseur", "elevator"])
            item["has_pool"] = any(word in combined_text for word in ["piscine", "pool"])
            item["has_garden"] = any(word in combined_text for word in ["jardin", "garden"])
            item["has_sea_view"] = any(word in combined_text for word in ["vue mer", "sea view", "vue sur mer"])
            item["is_furnished"] = any(word in combined_text for word in ["meublé", "furnished"])
            
            # Images
            images = ad_details.get('images', [])
            if images and isinstance(images, list):
                item["images"] = images
            
            # Contact info
            item["contact_phone"] = ad_details.get('phone')
            
            publisher = ad_details.get('publisher', {})
            if publisher:
                item["contact_name"] = publisher.get('name')
            
            # Listing date
            published_on = ad_details.get('publishedOn')
            if published_on:
                item["listing_date"] = published_on
            
            # Set timestamp
            item["scrape_timestamp"] = datetime.utcnow().isoformat()
            
            yield item
            
        except Exception as e:
            self.logger.error(f"Error parsing property {response.url}: {e}")
    
    def _extract_next_data(self, response):
        """Extract __NEXT_DATA__ JSON from response"""
        try:
            match = re.search(
                r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',
                response.text,
                re.DOTALL
            )
            if match:
                return json.loads(match.group(1))
        except Exception as e:
            self.logger.error(f"Error extracting __NEXT_DATA__: {e}")
        return None
    
    def _extract_size(self, text):
        """Extract property size in m² from text"""
        if not text:
            return None
        
        # Patterns: "190m²", "190 m²", "190m2", "superficie de 190m²"
        patterns = [
            r'(\d+)\s*m[²2]',
            r'superficie\s+(?:de\s+)?(\d+)',
            r'surface\s+(?:de\s+)?(\d+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                return int(match.group(1))
        
        return None
    
    def _extract_bedrooms(self, text):
        """Extract number of bedrooms from text"""
        if not text:
            return None
        
        text_lower = text.lower()
        
        # Patterns: "S+3", "3 chambres", "3 BR"
        patterns = [
            r's\s*\+\s*(\d+)',  # S+3, S +3
            r'(\d+)\s*chambres?',  # 3 chambres, 3 chambre
            r'(\d+)\s*br',  # 3 BR
            r'(\d+)\s*pièces?',  # 3 pièces
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text_lower)
            if match:
                return int(match.group(1))
        
        return None
    
    def _extract_types(self, category, title):
        """Extract property type and transaction type"""
        property_type = "APARTMENT"
        transaction_type = "SALE"
        
        combined_text = f"{category or ''} {title or ''}".lower()
        
        # Property type
        if any(word in combined_text for word in ["villa"]):
            property_type = "VILLA"
        elif any(word in combined_text for word in ["maison", "house"]):
            property_type = "HOUSE"
        elif any(word in combined_text for word in ["terrain", "land", "ferme"]):
            property_type = "LAND"
        elif any(word in combined_text for word in ["commercial", "local", "bureau", "office", "magasin", "plateaux"]):
            property_type = "COMMERCIAL"
        
        # Transaction type
        if any(word in combined_text for word in ["location", "louer", "rent", "à louer"]):
            transaction_type = "RENT"
        
        return property_type, transaction_type
    
    def handle_error(self, failure):
        """Handle request errors"""
        self.logger.error(f"Request failed: {failure.request.url}")
        self.logger.error(f"Error: {failure.value}")