"""
Mubawab.tn Spider - Real estate focused website
Target: https://www.mubawab.tn/
"""
import scrapy
import re
from datetime import datetime
from urllib.parse import urljoin
from estatemind_scrapers.items import PropertyItem


class MubawabSpider(scrapy.Spider):
    name = "mubawab"
    allowed_domains = ["mubawab.tn"]
    start_urls = ["https://www.mubawab.tn/fr/ct/tunis/immobilier-a-vendre"]
    
    custom_settings = {
        "DOWNLOAD_DELAY": 3,
        "CONCURRENT_REQUESTS": 4,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
    }
    
    def __init__(self, max_pages=None, *args, **kwargs):
        super(MubawabSpider, self).__init__(*args, **kwargs)
        self.max_pages = int(max_pages) if max_pages else None
        self.pages_scraped = 0
    
    def parse(self, response):
        """Parse listing page"""
        self.logger.info(f"Parsing page: {response.url}")
        
        # Extract property links (adjust selectors based on actual site)
        property_links = response.css('ul.ulListing li a.link::attr(href)').getall()
        
        if not property_links:
            property_links = response.css('a.listing-link::attr(href)').getall()
        
        self.logger.info(f"Found {len(property_links)} property links")
        
        for link in property_links:
            full_url = urljoin(response.url, link)
            yield scrapy.Request(full_url, callback=self.parse_property)
        
        # Pagination
        self.pages_scraped += 1
        if self.max_pages is None or self.pages_scraped < self.max_pages:
            next_page = response.css('a.pagination-next::attr(href)').get()
            if next_page:
                yield scrapy.Request(urljoin(response.url, next_page), callback=self.parse)
    
    def parse_property(self, response):
        """Parse property details"""
        self.logger.info(f"Parsing property: {response.url}")
        
        item = PropertyItem()
        
        item["source_url"] = response.url
        item["source_website"] = "mubawab.tn"
        item["listing_id"] = self._extract_id(response.url)
        
        item["title"] = response.css("h1.adTitle::text").get()
        item["description"] = " ".join(response.css("div.adDescription p::text").getall())
        
        # Price
        price_text = response.css("span.priceTag::text").get()
        if price_text:
            item["price"] = self._extract_price(price_text)
        
        # Location
        location = response.css("div.adLocation span::text").getall()
        if location:
            item["governorate"] = location[0] if len(location) > 0 else None
            item["delegation"] = location[1] if len(location) > 1 else None
            item["neighborhood"] = location[2] if len(location) > 2 else None
        
        # Property details
        details = response.css("div.adDetails li")
        for detail in details:
            label = detail.css("span.label::text").get()
            value = detail.css("span.value::text").get()
            
            if label and value:
                self._process_detail(item, label, value)
        
        # Images
        item["images"] = response.css("div.gallerySlider img::attr(src)").getall()
        
        # Contact
        item["contact_phone"] = response.css("a.phoneNumber::attr(data-phone)").get()
        item["contact_name"] = response.css("div.ownerName::text").get()
        
        item["property_type"], item["transaction_type"] = self._extract_types(item.get("title", ""))
        
        yield item
    
    def _extract_id(self, url):
        """Extract listing ID from URL"""
        match = re.search(r'-(\d+)\.html', url)
        return match.group(1) if match else None
    
    def _extract_price(self, text):
        """Extract price from text"""
        numbers = re.findall(r'\d+', text.replace(" ", ""))
        return int("".join(numbers)) if numbers else None
    
    def _process_detail(self, item, label, value):
        """Process detail field"""
        label_lower = label.lower()
        if "surface" in label_lower:
            item["size"] = self._extract_number(value)
        elif "chambre" in label_lower:
            item["bedrooms"] = self._extract_number(value)
        elif "salle de bain" in label_lower:
            item["bathrooms"] = self._extract_number(value)
    
    def _extract_number(self, text):
        """Extract number from text"""
        match = re.search(r'\d+', text)
        return int(match.group()) if match else None
    
    def _extract_types(self, title):
        """Extract property and transaction types"""
        title_lower = title.lower()
        
        property_type = "APARTMENT"
        if "villa" in title_lower:
            property_type = "VILLA"
        elif "maison" in title_lower:
            property_type = "HOUSE"
        elif "terrain" in title_lower:
            property_type = "LAND"
        elif "local" in title_lower or "commercial" in title_lower:
            property_type = "COMMERCIAL"
        
        transaction_type = "RENT" if "location" in title_lower else "SALE"
        
        return property_type, transaction_type
