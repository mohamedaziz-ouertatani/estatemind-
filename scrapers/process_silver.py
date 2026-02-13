"""
Silver Layer Processing Script
Reads Bronze layer files and produces cleaned Silver layer data
"""
import json
import os
import re
from datetime import datetime
from typing import Dict, Any, List, Optional
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SilverLayerProcessor:
    """Process bronze layer data into clean silver layer"""
    
    def __init__(self, bronze_dir: str = "data/bronze", silver_dir: str = "data/silver"):
        self.bronze_dir = Path(bronze_dir)
        self.silver_dir = Path(silver_dir)
        self.silver_dir.mkdir(parents=True, exist_ok=True)
        
    def clean_phone_number(self, phone: Optional[str]) -> Optional[str]:
        """Standardize phone numbers to +216XXXXXXXX format"""
        if not phone:
            return None
        
        # Remove all non-digit characters
        digits = re.sub(r'\D', '', phone)
        
        # Handle Tunisian phone numbers
        if digits.startswith('216'):
            return f"+{digits}"
        elif len(digits) == 8:  # Local number
            return f"+216{digits}"
        else:
            return phone  # Return original if format unclear
    
    def normalize_price(self, price: Any) -> Optional[float]:
        """Convert price to float, handle missing values"""
        if price is None or price == "":
            return None
        
        try:
            return float(price)
        except (ValueError, TypeError):
            logger.warning(f"Could not convert price to float: {price}")
            return None
    
    def normalize_date(self, date_str: Optional[str]) -> Optional[str]:
        """Standardize date format to ISO 8601"""
        if not date_str:
            return None
        
        try:
            # Try parsing ISO format first
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.isoformat()
        except (ValueError, AttributeError):
            logger.warning(f"Could not parse date: {date_str}")
            return None
    
    def normalize_boolean(self, value: Any) -> bool:
        """Standardize boolean values"""
        if isinstance(value, bool):
            return value
        if value is None:
            return False
        
        # Handle string representations
        if isinstance(value, str):
            return value.lower() in ['true', 'yes', '1', 'oui']
        
        return bool(value)
    
    def clean_text(self, text: Optional[str]) -> Optional[str]:
        """Clean and normalize text fields"""
        if not text:
            return None
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        # Trim
        text = text.strip()
        
        return text if text else None
    
    def normalize_governorate(self, gov: Optional[str]) -> Optional[str]:
        """Standardize governorate names"""
        if not gov:
            return None
        
        gov_mapping = {
            'tunis': 'Tunis',
            'ariana': 'Ariana',
            'ben arous': 'Ben Arous',
            'benarous': 'Ben Arous',
            'manouba': 'Manouba',
            'nabeul': 'Nabeul',
            'zaghouan': 'Zaghouan',
            'bizerte': 'Bizerte',
            'beja': 'Béja',
            'jendouba': 'Jendouba',
            'kef': 'Le Kef',
            'siliana': 'Siliana',
            'sousse': 'Sousse',
            'monastir': 'Monastir',
            'mahdia': 'Mahdia',
            'sfax': 'Sfax',
            'kairouan': 'Kairouan',
            'kasserine': 'Kasserine',
            'sidi bouzid': 'Sidi Bouzid',
            'gabes': 'Gabès',
            'medenine': 'Médenine',
            'tataouine': 'Tataouine',
            'gafsa': 'Gafsa',
            'tozeur': 'Tozeur',
            'kebili': 'Kébili',
        }
        
        gov_lower = gov.lower().strip()
        return gov_mapping.get(gov_lower, gov.title())
    
    def clean_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Clean a single property record"""
        cleaned = {}
        
        # Identifiers (required)
        cleaned['listing_id'] = record.get('listing_id')
        cleaned['source_url'] = record.get('source_url')
        cleaned['source_website'] = record.get('source_website')
        
        # Text fields
        cleaned['title'] = self.clean_text(record.get('title'))
        cleaned['description'] = self.clean_text(record.get('description'))
        
        # Property type & transaction
        cleaned['property_type'] = record.get('property_type')
        cleaned['transaction_type'] = record.get('transaction_type')
        
        # Location
        cleaned['governorate'] = self.normalize_governorate(record.get('governorate'))
        cleaned['delegation'] = self.clean_text(record.get('delegation'))
        cleaned['neighborhood'] = self.clean_text(record.get('neighborhood'))
        
        # Coordinates
        lat = record.get('latitude')
        lng = record.get('longitude')
        if lat and lng:
            try:
                cleaned['latitude'] = float(lat)
                cleaned['longitude'] = float(lng)
                cleaned['has_coordinates'] = True
            except (ValueError, TypeError):
                cleaned['latitude'] = None
                cleaned['longitude'] = None
                cleaned['has_coordinates'] = False
        else:
            cleaned['latitude'] = None
            cleaned['longitude'] = None
            cleaned['has_coordinates'] = False
        
        # Pricing
        cleaned['price'] = self.normalize_price(record.get('price'))
        cleaned['price_currency'] = record.get('price_currency', 'TND')
        cleaned['price_per_m2'] = self.normalize_price(record.get('price_per_m2'))
        cleaned['has_price'] = cleaned['price'] is not None and cleaned['price'] > 0
        
        # Property details
        size = record.get('size')
        if size:
            try:
                cleaned['size'] = float(size)
                cleaned['size_unit'] = 'm2'
            except (ValueError, TypeError):
                cleaned['size'] = None
                cleaned['size_unit'] = None
        else:
            cleaned['size'] = None
            cleaned['size_unit'] = None
        
        bedrooms = record.get('bedrooms')
        if bedrooms:
            try:
                cleaned['bedrooms'] = int(bedrooms)
            except (ValueError, TypeError):
                cleaned['bedrooms'] = None
        else:
            cleaned['bedrooms'] = None
        
        # Features (booleans)
        cleaned['has_parking'] = self.normalize_boolean(record.get('has_parking'))
        cleaned['has_elevator'] = self.normalize_boolean(record.get('has_elevator'))
        cleaned['has_pool'] = self.normalize_boolean(record.get('has_pool'))
        cleaned['has_garden'] = self.normalize_boolean(record.get('has_garden'))
        cleaned['has_sea_view'] = self.normalize_boolean(record.get('has_sea_view'))
        cleaned['is_furnished'] = self.normalize_boolean(record.get('is_furnished'))
        
        # Media
        cleaned['images'] = record.get('images', [])
        
        # Contact
        cleaned['contact_phone'] = self.clean_phone_number(record.get('contact_phone'))
        cleaned['contact_name'] = self.clean_text(record.get('contact_name'))
        
        # Dates
        cleaned['listing_date'] = self.normalize_date(record.get('listing_date'))
        cleaned['scrape_timestamp'] = self.normalize_date(record.get('scrape_timestamp'))
        
        # Data quality
        cleaned['data_completeness_score'] = record.get('data_completeness_score')
        cleaned['content_hash'] = record.get('content_hash')
        
        return cleaned
    
    def remove_duplicates(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate records based on content_hash"""
        seen_hashes = set()
        unique_records = []
        
        for record in records:
            content_hash = record.get('content_hash')
            if content_hash and content_hash not in seen_hashes:
                seen_hashes.add(content_hash)
                unique_records.append(record)
            elif not content_hash:
                # Keep records without hash (shouldn't happen but be safe)
                unique_records.append(record)
        
        duplicates_removed = len(records) - len(unique_records)
        if duplicates_removed > 0:
            logger.info(f"Removed {duplicates_removed} duplicate records")
        
        return unique_records
    
    def process_file(self, bronze_file: Path) -> str:
        """Process a single bronze file to silver layer"""
        logger.info(f"Processing bronze file: {bronze_file}")
        
        # Read bronze data
        with open(bronze_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Extract records (handle both list and dict formats)
        if isinstance(data, list):
            records = data
        elif isinstance(data, dict) and 'data' in data:
            records = data['data']
        else:
            logger.error(f"Unexpected data format in {bronze_file}")
            return None
        
        # Clean records
        cleaned_records = []
        for record in records:
            try:
                cleaned = self.clean_record(record)
                cleaned_records.append(cleaned)
            except Exception as e:
                logger.error(f"Error cleaning record: {e}")
                continue
        
        # Remove duplicates
        unique_records = self.remove_duplicates(cleaned_records)
        
        # Create silver layer output
        silver_data = {
            "metadata": {
                "source_file": bronze_file.name,
                "processing_timestamp": datetime.utcnow().isoformat(),
                "records_in": len(records),
                "records_cleaned": len(cleaned_records),
                "records_unique": len(unique_records),
                "duplicates_removed": len(cleaned_records) - len(unique_records)
            },
            "data": unique_records
        }
        
        # Write to silver layer
        silver_file = self.silver_dir / f"silver_{bronze_file.name}"
        with open(silver_file, 'w', encoding='utf-8') as f:
            json.dump(silver_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Silver layer created: {silver_file}")
        logger.info(f"  Records in: {len(records)}")
        logger.info(f"  Records cleaned: {len(cleaned_records)}")
        logger.info(f"  Records unique: {len(unique_records)}")
        
        return str(silver_file)
    
    def process_all(self) -> List[str]:
        """Process all bronze files to silver layer"""
        bronze_files = list(self.bronze_dir.glob("*.json"))
        
        if not bronze_files:
            logger.warning(f"No bronze files found in {self.bronze_dir}")
            return []
        
        logger.info(f"Found {len(bronze_files)} bronze files to process")
        
        silver_files = []
        for bronze_file in bronze_files:
            silver_file = self.process_file(bronze_file)
            if silver_file:
                silver_files.append(silver_file)
        
        return silver_files


if __name__ == "__main__":
    # Process all bronze files
    processor = SilverLayerProcessor()
    silver_files = processor.process_all()
    
    print(f"\n✅ Processed {len(silver_files)} files to Silver layer")
    for f in silver_files:
        print(f"  - {f}")