"""
Tayara.tn Spider - Tunisia's largest classifieds website
Target: https://www.tayara.tn/c/Immobilier
"""
import scrapy
import re
from datetime import datetime
from urllib.parse import urljoin
from estatemind_scrapers.items import PropertyItem


class TayaraSpider(scrapy.Spider):
    name = "tayara"
    allowed_domains = ["tayara.tn"]
    start_urls = ["https://www.tayara.tn/c/Immobilier"]
    
    custom_settings = {
        "DOWNLOAD_DELAY": 3,
        "CONCURRENT_REQUESTS": 4,
        "RANDOMIZE_DOWNLOAD_DELAY": True,
    }
    
    def __init__(self, max_pages=None, *args, **kwargs):
        super(TayaraSpider, self).__init__(*args, **kwargs)
        self.max_pages = int(max_pages) if max_pages else None
        self.pages_scraped = 0
    
    def parse(self, response):
        """
        Parse the listing page to extract property links
        """
        self.logger.info(f"Parsing page: {response.url}")
        
        # Extract property listing links
        # NOTE: These selectors are examples and may need adjustment based on actual site structure
        property_links = response.css('a.listing-card::attr(href)').getall()
        
        if not property_links:
            # Try alternative selectors
            property_links = response.css('div.listing a::attr(href)').getall()
        
        self.logger.info(f"Found {len(property_links)} property links on this page")
        
        # Follow each property link
        for link in property_links:
            full_url = urljoin(response.url, link)
            yield scrapy.Request(
                full_url,
                callback=self.parse_property,
                errback=self.handle_error
            )
        
        # Pagination - follow next page
        self.pages_scraped += 1
        if self.max_pages is None or self.pages_scraped < self.max_pages:
            next_page = response.css('a.next-page::attr(href)').get()
            if not next_page:
                next_page = response.css('link[rel="next"]::attr(href)').get()
            
            if next_page:
                next_page_url = urljoin(response.url, next_page)
                self.logger.info(f"Following next page: {next_page_url}")
                yield scrapy.Request(next_page_url, callback=self.parse)
    
    def parse_property(self, response):
        """
        Parse individual property page
        """
        self.logger.info(f"Parsing property: {response.url}")
        
        item = PropertyItem()
        
        # Basic identifiers
        item["source_url"] = response.url
        item["source_website"] = "tayara.tn"
        item["listing_id"] = self._extract_listing_id(response.url)
        
        # Title and description
        item["title"] = response.css("h1.listing-title::text").get()
        if not item["title"]:
            item["title"] = response.css("h1::text").get()
        
        item["description"] = " ".join(response.css("div.description p::text").getall())
        if not item["description"]:
            item["description"] = " ".join(response.css("div.description::text").getall())
        
        # Price
        price_text = response.css("span.price::text").get()
        if not price_text:
            price_text = response.css("div.price::text").get()
        
        if price_text:
            item["price"] = self._extract_price(price_text)
        
        # Property type and transaction type
        category = response.css("span.category::text").get()
        item["property_type"], item["transaction_type"] = self._extract_types(category, item.get("title"))
        
        # Location
        location_text = response.css("div.location::text").get()
        if location_text:
            item["governorate"], item["delegation"], item["neighborhood"] = self._parse_location(location_text)
        
        # Property details
        details = response.css("div.property-details li")
        for detail in details:
            label = detail.css("span.label::text").get()
            value = detail.css("span.value::text").get()
            
            if label and value:
                label_lower = label.lower()
                if "surface" in label_lower or "taille" in label_lower:
                    item["size"] = self._extract_number(value)
                elif "chambre" in label_lower or "bedroom" in label_lower:
                    item["bedrooms"] = self._extract_number(value)
                elif "salle de bain" in label_lower or "bathroom" in label_lower:
                    item["bathrooms"] = self._extract_number(value)
                elif "étage" in label_lower or "floor" in label_lower:
                    item["floor"] = self._extract_number(value)
        
        # Features
        features_text = " ".join(response.css("div.features::text").getall()).lower()
        item["has_parking"] = "parking" in features_text or "garage" in features_text
        item["has_elevator"] = "ascenseur" in features_text or "elevator" in features_text
        item["has_pool"] = "piscine" in features_text or "pool" in features_text
        item["has_garden"] = "jardin" in features_text or "garden" in features_text
        item["has_sea_view"] = "vue mer" in features_text or "sea view" in features_text
        item["is_furnished"] = "meublé" in features_text or "furnished" in features_text
        
        # Images
        item["images"] = response.css("div.gallery img::attr(src)").getall()
        if not item["images"]:
            item["images"] = response.css("img.property-image::attr(src)").getall()
        
        # Contact info
        item["contact_phone"] = self._extract_phone(response)
        item["contact_name"] = response.css("div.seller-name::text").get()
        
        # Listing date
        date_text = response.css("span.listing-date::text").get()
        if date_text:
            item["listing_date"] = self._parse_date(date_text)
        
        yield item
    
    def handle_error(self, failure):
        """Handle request errors"""
        self.logger.error(f"Request failed: {failure.request.url}")
        self.logger.error(f"Error: {failure.value}")
    
    def _extract_listing_id(self, url):
        """Extract listing ID from URL"""
        match = re.search(r'/(\d+)/?$', url)
        if match:
            return match.group(1)
        return None
    
    def _extract_price(self, text):
        """Extract numeric price from text"""
        if "non spécifié" in text.lower() or "negotiable" in text.lower():
            return None
        
        # Remove currency symbols and extract numbers
        numbers = re.findall(r'\d+', text.replace(" ", "").replace(",", ""))
        if numbers:
            return int("".join(numbers))
        return None
    
    def _extract_number(self, text):
        """Extract first number from text"""
        if not text:
            return None
        match = re.search(r'\d+', text)
        if match:
            return int(match.group())
        return None
    
    def _extract_types(self, category, title):
        """Extract property type and transaction type"""
        property_type = "APARTMENT"  # Default
        transaction_type = "SALE"  # Default
        
        combined_text = f"{category or ''} {title or ''}".lower()
        
        # Property type
        if "villa" in combined_text:
            property_type = "VILLA"
        elif "maison" in combined_text or "house" in combined_text:
            property_type = "HOUSE"
        elif "terrain" in combined_text or "land" in combined_text:
            property_type = "LAND"
        elif "commercial" in combined_text or "local" in combined_text or "bureau" in combined_text:
            property_type = "COMMERCIAL"
        
        # Transaction type
        if "location" in combined_text or "louer" in combined_text or "rent" in combined_text:
            transaction_type = "RENT"
        
        return property_type, transaction_type
    
    def _parse_location(self, location_text):
        """Parse location string into governorate, delegation, neighborhood"""
        parts = [p.strip() for p in location_text.split(",")]
        
        governorate = None
        delegation = None
        neighborhood = None
        
        if len(parts) >= 1:
            governorate = parts[0]
        if len(parts) >= 2:
            delegation = parts[1]
        if len(parts) >= 3:
            neighborhood = parts[2]
        
        return governorate, delegation, neighborhood
    
    def _extract_phone(self, response):
        """Extract phone number from response"""
        phone = response.css("a.phone-number::attr(href)").get()
        if phone and phone.startswith("tel:"):
            return phone.replace("tel:", "").strip()
        
        # Try to find phone in text
        phone_match = re.search(r'\+?216[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{3}', response.text)
        if phone_match:
            return phone_match.group()
        
        return None
    
    def _parse_date(self, date_text):
        """Parse date from French text"""
        # Handle relative dates like "il y a 2 jours"
        if "il y a" in date_text.lower() or "ago" in date_text.lower():
            # For now, return current date (could be improved with proper date parsing)
            return datetime.utcnow().isoformat()
        
        # Try to parse absolute dates (format may vary)
        try:
            # Example format: "15 Jan 2024"
            return datetime.strptime(date_text.strip(), "%d %b %Y").isoformat()
        except:
            return None
