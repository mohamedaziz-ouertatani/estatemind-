"""
Silver Layer - Data cleaning and standardization
Clean, validate, and deduplicate data from Bronze layer
"""
import json
import os
import hashlib
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class SilverLayer:
    """
    Silver layer handles data cleaning, validation, and deduplication
    """
    
    TUNISIA_BBOX = {
        "min_lat": 30.2,
        "max_lat": 37.5,
        "min_lng": 7.5,
        "max_lng": 11.6,
    }
    
    def __init__(self, storage_path: str = None):
        self.storage_path = storage_path or os.path.join(os.path.dirname(__file__), "..", "data", "silver")
        os.makedirs(self.storage_path, exist_ok=True)
        self.seen_hashes = set()
        self._load_existing_hashes()
    
    def _load_existing_hashes(self):
        """Load hashes of already processed records"""
        hash_file = os.path.join(self.storage_path, "_hashes.txt")
        if os.path.exists(hash_file):
            with open(hash_file, "r") as f:
                self.seen_hashes = set(line.strip() for line in f)
    
    def _save_hash(self, hash_value: str):
        """Save a hash to the hash file"""
        hash_file = os.path.join(self.storage_path, "_hashes.txt")
        with open(hash_file, "a") as f:
            f.write(f"{hash_value}\n")
    
    def process(self, bronze_data: Dict[str, Any], batch_id: str = None) -> str:
        """
        Process bronze data into silver layer
        
        Args:
            bronze_data: Data from bronze layer
            batch_id: Optional batch identifier
        
        Returns:
            File path where cleaned data was stored
        """
        if batch_id is None:
            batch_id = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        source = bronze_data["metadata"]["source"]
        raw_records = bronze_data["data"]
        
        cleaned_records = []
        duplicates = 0
        invalid = 0
        
        for record in raw_records:
            # Check for duplicates
            record_hash = self._calculate_hash(record)
            if record_hash in self.seen_hashes:
                duplicates += 1
                continue
            
            # Clean and validate
            cleaned_record = self._clean_record(record)
            
            if cleaned_record and self._validate_record(cleaned_record):
                cleaned_records.append(cleaned_record)
                self.seen_hashes.add(record_hash)
                self._save_hash(record_hash)
            else:
                invalid += 1
        
        # Save to silver layer
        filename = f"{source}_{batch_id}_silver.json"
        filepath = os.path.join(self.storage_path, filename)
        
        silver_data = {
            "metadata": {
                "source": source,
                "batch_id": batch_id,
                "processing_timestamp": datetime.utcnow().isoformat(),
                "input_count": len(raw_records),
                "output_count": len(cleaned_records),
                "duplicates_removed": duplicates,
                "invalid_records": invalid,
            },
            "data": cleaned_records
        }
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(silver_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Silver layer: Processed {len(cleaned_records)}/{len(raw_records)} records to {filepath}")
        logger.info(f"Removed {duplicates} duplicates, {invalid} invalid records")
        
        return filepath
    
    def _calculate_hash(self, record: Dict[str, Any]) -> str:
        """Calculate hash for deduplication"""
        key_fields = [
            str(record.get("title", "")),
            str(record.get("price", "")),
            str(record.get("size", "")),
            str(record.get("address", "")),
            str(record.get("neighborhood", "")),
        ]
        content = "|".join(key_fields).encode("utf-8")
        return hashlib.md5(content).hexdigest()
    
    def _clean_record(self, record: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Clean and standardize a record"""
        cleaned = {}
        
        # Copy all fields
        for key, value in record.items():
            if value is not None:
                cleaned[key] = value
        
        # Standardize coordinates
        if "latitude" in cleaned and "longitude" in cleaned:
            try:
                lat = float(cleaned["latitude"])
                lng = float(cleaned["longitude"])
                
                # Check Tunisia bounds
                if not (self.TUNISIA_BBOX["min_lat"] <= lat <= self.TUNISIA_BBOX["max_lat"] and
                        self.TUNISIA_BBOX["min_lng"] <= lng <= self.TUNISIA_BBOX["max_lng"]):
                    cleaned["latitude"] = None
                    cleaned["longitude"] = None
            except (ValueError, TypeError):
                cleaned["latitude"] = None
                cleaned["longitude"] = None
        
        # Ensure price is positive
        if "price" in cleaned:
            try:
                price = float(cleaned["price"])
                if price <= 0:
                    cleaned["price"] = None
            except (ValueError, TypeError):
                cleaned["price"] = None
        
        # Calculate price per m2
        if cleaned.get("price") and cleaned.get("size"):
            try:
                cleaned["price_per_m2"] = round(float(cleaned["price"]) / float(cleaned["size"]), 2)
            except (ValueError, TypeError, ZeroDivisionError):
                pass
        
        return cleaned
    
    def _validate_record(self, record: Dict[str, Any]) -> bool:
        """Validate that record has minimum required fields"""
        required_fields = ["title", "source_url", "source_website"]
        
        for field in required_fields:
            if not record.get(field):
                logger.warning(f"Record missing required field: {field}")
                return False
        
        return True
    
    def list_batches(self, source: str = None) -> List[str]:
        """List all silver batches"""
        files = os.listdir(self.storage_path)
        files = [f for f in files if f.endswith("_silver.json")]
        
        if source:
            files = [f for f in files if f.startswith(source)]
        
        return sorted(files)
