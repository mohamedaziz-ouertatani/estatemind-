"""
Tunisie-Annonce.com Spider - General classifieds website
Target: https://www.tunisie-annonce.com/
"""
import scrapy
import re
from datetime import datetime
from urllib.parse import urljoin
from estatemind_scrapers.items import PropertyItem


class TunisieAnnonceSpider(scrapy.Spider):
    name = "tunisie_annonce"
    allowed_domains = ["tunisie-annonce.com"]
    start_urls = ["https://www.tunisie-annonce.com/AnnoncesImmobilier.asp"]
    
    custom_settings = {
        "DOWNLOAD_DELAY": 3,
        "CONCURRENT_REQUESTS": 4,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
    }
    
    def __init__(self, max_pages=None, *args, **kwargs):
        super(TunisieAnnonceSpider, self).__init__(*args, **kwargs)
        self.max_pages = int(max_pages) if max_pages else None
        self.pages_scraped = 0
    
    def parse(self, response):
        """Parse listing page"""
        self.logger.info(f"Parsing page: {response.url}")
        
        # Extract property links (adjust selectors based on actual site)
        property_links = response.css('div.annonce a::attr(href)').getall()
        
        if not property_links:
            property_links = response.css('a.listing::attr(href)').getall()
        
        self.logger.info(f"Found {len(property_links)} property links")
        
        for link in property_links:
            if link and "DetailAnnonce" in link:
                full_url = urljoin(response.url, link)
                yield scrapy.Request(full_url, callback=self.parse_property)
        
        # Pagination
        self.pages_scraped += 1
        if self.max_pages is None or self.pages_scraped < self.max_pages:
            next_page = response.css('a.next::attr(href)').get()
            if next_page:
                yield scrapy.Request(urljoin(response.url, next_page), callback=self.parse)
    
    def parse_property(self, response):
        """Parse property details"""
        self.logger.info(f"Parsing property: {response.url}")
        
        item = PropertyItem()
        
        item["source_url"] = response.url
        item["source_website"] = "tunisie-annonce.com"
        item["listing_id"] = self._extract_id(response.url)
        
        item["title"] = response.css("h1.titre::text").get()
        if not item["title"]:
            item["title"] = response.css("h1::text").get()
        
        item["description"] = " ".join(response.css("div.description::text").getall())
        
        # Price
        price_text = response.css("span.prix::text").get()
        if price_text:
            item["price"] = self._extract_price(price_text)
        
        # Location
        location_text = response.css("div.localisation::text").get()
        if location_text:
            parts = location_text.split(",")
            item["governorate"] = parts[0].strip() if len(parts) > 0 else None
            item["delegation"] = parts[1].strip() if len(parts) > 1 else None
            item["neighborhood"] = parts[2].strip() if len(parts) > 2 else None
        
        # Property details
        details_text = response.css("div.caracteristiques::text").getall()
        details_combined = " ".join(details_text)
        
        # Extract size
        size_match = re.search(r'(\d+)\s*m', details_combined)
        if size_match:
            item["size"] = int(size_match.group(1))
        
        # Extract bedrooms
        bedroom_match = re.search(r'(\d+)\s*chambre', details_combined)
        if bedroom_match:
            item["bedrooms"] = int(bedroom_match.group(1))
        
        # Images
        item["images"] = response.css("div.photos img::attr(src)").getall()
        
        # Contact
        phone_match = re.search(r'\+?216[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{3}', response.text)
        if phone_match:
            item["contact_phone"] = phone_match.group()
        
        item["property_type"], item["transaction_type"] = self._extract_types(
            item.get("title", ""),
            details_combined
        )
        
        yield item
    
    def _extract_id(self, url):
        """Extract listing ID from URL"""
        match = re.search(r'id=(\d+)', url)
        return match.group(1) if match else None
    
    def _extract_price(self, text):
        """Extract price from text"""
        numbers = re.findall(r'\d+', text.replace(" ", ""))
        return int("".join(numbers)) if numbers else None
    
    def _extract_types(self, title, details):
        """Extract property and transaction types"""
        combined = f"{title} {details}".lower()
        
        property_type = "APARTMENT"
        if "villa" in combined:
            property_type = "VILLA"
        elif "maison" in combined:
            property_type = "HOUSE"
        elif "terrain" in combined:
            property_type = "LAND"
        elif "local" in combined or "commercial" in combined:
            property_type = "COMMERCIAL"
        
        transaction_type = "RENT" if "location" in combined else "SALE"
        
        return property_type, transaction_type
