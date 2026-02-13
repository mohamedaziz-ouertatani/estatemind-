"""
Data models for scraped properties
"""
import scrapy


class PropertyItem(scrapy.Item):
    """
    Property listing item scraped from real estate websites
    """
    # Identifiers
    listing_id = scrapy.Field()  # Unique ID from source website
    source_url = scrapy.Field()  # Original listing URL
    source_website = scrapy.Field()  # e.g., "tayara.tn", "mubawab.tn"
    
    # Basic Information
    title = scrapy.Field()
    description = scrapy.Field()
    
    # Property Type & Transaction
    property_type = scrapy.Field()  # APARTMENT, HOUSE, VILLA, LAND, COMMERCIAL
    transaction_type = scrapy.Field()  # SALE, RENT
    
    # Location
    governorate = scrapy.Field()  # Tunis, Ariana, etc.
    delegation = scrapy.Field()  # La Marsa, Carthage, etc.
    neighborhood = scrapy.Field()  # Specific neighborhood name
    address = scrapy.Field()  # Full address if available
    latitude = scrapy.Field()  # GPS coordinates
    longitude = scrapy.Field()
    
    # Pricing
    price = scrapy.Field()  # In TND
    price_currency = scrapy.Field()  # Should be "TND"
    price_per_m2 = scrapy.Field()  # Calculated if size available
    
    # Property Details
    size = scrapy.Field()  # In square meters
    size_unit = scrapy.Field()  # Should be "m2"
    bedrooms = scrapy.Field()
    bathrooms = scrapy.Field()
    floor = scrapy.Field()
    
    # Features (boolean flags)
    has_parking = scrapy.Field()
    has_elevator = scrapy.Field()
    has_pool = scrapy.Field()
    has_garden = scrapy.Field()
    has_sea_view = scrapy.Field()
    has_balcony = scrapy.Field()
    is_furnished = scrapy.Field()
    
    # Media
    images = scrapy.Field()  # List of image URLs
    
    # Contact Information
    contact_name = scrapy.Field()
    contact_phone = scrapy.Field()
    contact_email = scrapy.Field()
    
    # Metadata
    listing_date = scrapy.Field()  # When was it posted
    scrape_timestamp = scrapy.Field()  # When we scraped it
    last_updated = scrapy.Field()  # Last update on source site
    is_featured = scrapy.Field()  # Premium listing
    views_count = scrapy.Field()  # Number of views (if available)
    
    # Data Quality
    data_completeness_score = scrapy.Field()  # 0-100 based on filled fields
    has_coordinates = scrapy.Field()  # Boolean
    has_price = scrapy.Field()  # Boolean
    
    # Hash for deduplication
    content_hash = scrapy.Field()  # MD5 of key fields
