"""
Item pipelines for data cleaning, validation, and storage
"""
import json
import os
import hashlib
from datetime import datetime
from typing import Any
import logging

from itemadapter import ItemAdapter
import validators

logger = logging.getLogger(__name__)


class DataValidationPipeline:
    """
    Validate scraped data before processing
    """
    
    REQUIRED_FIELDS = ["title", "source_url", "source_website"]
    TUNISIA_BBOX = {
        "min_lat": 30.2,
        "max_lat": 37.5,
        "min_lng": 7.5,
        "max_lng": 11.6,
    }
    
    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        
        # Check required fields
        for field in self.REQUIRED_FIELDS:
            if not adapter.get(field):
                raise ValueError(f"Missing required field: {field}")
        
        # Validate URL
        if not validators.url(adapter.get("source_url")):
            raise ValueError(f"Invalid URL: {adapter.get('source_url')}")
        
        # Validate coordinates if present
        lat = adapter.get("latitude")
        lng = adapter.get("longitude")
        if lat is not None and lng is not None:
            try:
                lat_float = float(lat)
                lng_float = float(lng)
                
                # Check if coordinates are within Tunisia
                if not (self.TUNISIA_BBOX["min_lat"] <= lat_float <= self.TUNISIA_BBOX["max_lat"] and
                        self.TUNISIA_BBOX["min_lng"] <= lng_float <= self.TUNISIA_BBOX["max_lng"]):
                    logger.warning(f"Coordinates outside Tunisia bounds: {lat}, {lng}")
                    adapter["latitude"] = None
                    adapter["longitude"] = None
                    adapter["has_coordinates"] = False
                else:
                    adapter["has_coordinates"] = True
            except (ValueError, TypeError):
                logger.warning(f"Invalid coordinates: {lat}, {lng}")
                adapter["latitude"] = None
                adapter["longitude"] = None
                adapter["has_coordinates"] = False
        else:
            adapter["has_coordinates"] = False
        
        # Validate price
        price = adapter.get("price")
        if price is not None:
            try:
                price_float = float(price)
                if price_float > 0:
                    adapter["has_price"] = True
                else:
                    adapter["has_price"] = False
            except (ValueError, TypeError):
                adapter["has_price"] = False
        else:
            adapter["has_price"] = False
        
        return item


class DataCleaningPipeline:
    """
    Clean and standardize scraped data
    """
    
    PROPERTY_TYPE_MAPPING = {
        "appartement": "APARTMENT",
        "apartment": "APARTMENT",
        "appart": "APARTMENT",
        "maison": "HOUSE",
        "house": "HOUSE",
        "villa": "VILLA",
        "terrain": "LAND",
        "land": "LAND",
        "commercial": "COMMERCIAL",
        "local": "COMMERCIAL",
        "bureau": "COMMERCIAL",
        "office": "COMMERCIAL",
    }
    
    TRANSACTION_TYPE_MAPPING = {
        "vente": "SALE",
        "sale": "SALE",
        "à vendre": "SALE",
        "location": "RENT",
        "rent": "RENT",
        "à louer": "RENT",
    }
    
    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        
        # Clean and trim text fields
        text_fields = ["title", "description", "address", "neighborhood", "delegation", "governorate"]
        for field in text_fields:
            value = adapter.get(field)
            if value and isinstance(value, str):
                adapter[field] = value.strip()
        
        # Standardize property type
        property_type = adapter.get("property_type")
        if property_type:
            normalized = property_type.lower().strip()
            adapter["property_type"] = self.PROPERTY_TYPE_MAPPING.get(normalized, property_type.upper())
        
        # Standardize transaction type
        transaction_type = adapter.get("transaction_type")
        if transaction_type:
            normalized = transaction_type.lower().strip()
            adapter["transaction_type"] = self.TRANSACTION_TYPE_MAPPING.get(normalized, transaction_type.upper())
        
        # Ensure currency is TND
        if adapter.get("price") and not adapter.get("price_currency"):
            adapter["price_currency"] = "TND"
        
        # Ensure size unit is m2
        if adapter.get("size") and not adapter.get("size_unit"):
            adapter["size_unit"] = "m2"
        
        # Calculate price per m2 if possible
        if adapter.get("price") and adapter.get("size"):
            try:
                price = float(adapter["price"])
                size = float(adapter["size"])
                if size > 0:
                    adapter["price_per_m2"] = round(price / size, 2)
            except (ValueError, TypeError, ZeroDivisionError):
                pass
        
        # Add scrape timestamp
        adapter["scrape_timestamp"] = datetime.utcnow().isoformat()
        
        # Calculate data completeness score
        total_fields = len(adapter.keys())
        filled_fields = sum(1 for v in adapter.values() if v is not None and v != "")
        adapter["data_completeness_score"] = round((filled_fields / total_fields) * 100, 2)
        
        return item


class DeduplicationPipeline:
    """
    Detect and handle duplicate listings
    """
    
    def __init__(self):
        self.seen_hashes = set()
    
    def process_item(self, item, spider):
        adapter = ItemAdapter(item)
        
        # Create content hash from key fields
        hash_fields = [
            str(adapter.get("title", "")),
            str(adapter.get("price", "")),
            str(adapter.get("size", "")),
            str(adapter.get("address", "")),
            str(adapter.get("neighborhood", "")),
        ]
        content = "|".join(hash_fields).encode("utf-8")
        content_hash = hashlib.md5(content).hexdigest()
        
        adapter["content_hash"] = content_hash
        
        # Check for duplicates
        if content_hash in self.seen_hashes:
            logger.info(f"Duplicate item detected: {adapter.get('title')}")
            # You can choose to drop duplicates or mark them
            # For now, we'll pass them through but log them
        else:
            self.seen_hashes.add(content_hash)
        
        return item


class BronzeLayerPipeline:
    """
    Store raw scraped data in Bronze layer (local JSON files or Azure Blob)
    """
    
    def __init__(self, settings):
        self.bronze_dir = settings.get("BRONZE_DIR")
        self.azure_connection_string = settings.get("AZURE_STORAGE_CONNECTION_STRING")
        self.azure_container = settings.get("AZURE_CONTAINER_BRONZE")
        self.items_buffer = []
        self.buffer_size = 10  # Write every 10 items
        
        # Create bronze directory if it doesn't exist
        if self.bronze_dir:
            os.makedirs(self.bronze_dir, exist_ok=True)
    
    @classmethod
    def from_crawler(cls, crawler):
        return cls(crawler.settings)
    
    def process_item(self, item, spider):
        self.items_buffer.append(dict(ItemAdapter(item)))
        
        if len(self.items_buffer) >= self.buffer_size:
            self._write_batch(spider.name)
        
        return item
    
    def close_spider(self, spider):
        """Write remaining items when spider closes"""
        if self.items_buffer:
            self._write_batch(spider.name)
    
    def _write_batch(self, spider_name):
        """Write buffered items to storage"""
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"{spider_name}_{timestamp}.json"
        
        if self.azure_connection_string and self.azure_container:
            self._write_to_azure(filename)
        else:
            self._write_to_local(filename)
        
        logger.info(f"Wrote {len(self.items_buffer)} items to {filename}")
        self.items_buffer = []
    
    def _write_to_local(self, filename):
        """Write to local filesystem"""
        filepath = os.path.join(self.bronze_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(self.items_buffer, f, ensure_ascii=False, indent=2)
    
    def _write_to_azure(self, filename):
        """Write to Azure Blob Storage"""
        try:
            from azure.storage.blob import BlobServiceClient
            
            blob_service_client = BlobServiceClient.from_connection_string(self.azure_connection_string)
            blob_client = blob_service_client.get_blob_client(
                container=self.azure_container,
                blob=filename
            )
            
            data = json.dumps(self.items_buffer, ensure_ascii=False, indent=2)
            blob_client.upload_blob(data, overwrite=True)
            
        except Exception as e:
            logger.error(f"Failed to write to Azure: {e}")
            # Fallback to local storage
            self._write_to_local(filename)
