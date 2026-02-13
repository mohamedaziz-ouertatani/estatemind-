"""
Gold Layer - Analytics-ready data
Feature engineering, enrichment, and database preparation
"""
import json
import os
from datetime import datetime
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class GoldLayer:
    """
    Gold layer prepares analytics-ready data
    """
    
    def __init__(self, storage_path: str = None):
        self.storage_path = storage_path or os.path.join(os.path.dirname(__file__), "..", "data", "gold")
        os.makedirs(self.storage_path, exist_ok=True)
    
    def process(self, silver_data: Dict[str, Any], batch_id: str = None) -> str:
        """
        Process silver data into gold layer
        
        Args:
            silver_data: Data from silver layer
            batch_id: Optional batch identifier
        
        Returns:
            File path where gold data was stored
        """
        if batch_id is None:
            batch_id = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        source = silver_data["metadata"]["source"]
        records = silver_data["data"]
        
        enriched_records = []
        
        for record in records:
            enriched = self._enrich_record(record)
            if enriched:
                enriched_records.append(enriched)
        
        # Save to gold layer
        filename = f"{source}_{batch_id}_gold.json"
        filepath = os.path.join(self.storage_path, filename)
        
        gold_data = {
            "metadata": {
                "source": source,
                "batch_id": batch_id,
                "enrichment_timestamp": datetime.utcnow().isoformat(),
                "record_count": len(enriched_records),
            },
            "data": enriched_records
        }
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(gold_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Gold layer: Enriched {len(enriched_records)} records to {filepath}")
        
        return filepath
    
    def _enrich_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich record with derived features
        """
        enriched = record.copy()
        
        # Calculate days on market (if listing_date available)
        if record.get("listing_date"):
            try:
                listing_date = datetime.fromisoformat(record["listing_date"].replace("Z", "+00:00"))
                days_on_market = (datetime.utcnow() - listing_date.replace(tzinfo=None)).days
                enriched["days_on_market"] = days_on_market
            except:
                pass
        
        # Price category
        price = record.get("price")
        if price:
            try:
                price_float = float(price)
                if price_float < 100000:
                    enriched["price_category"] = "BUDGET"
                elif price_float < 300000:
                    enriched["price_category"] = "MID"
                elif price_float < 600000:
                    enriched["price_category"] = "LUXURY"
                else:
                    enriched["price_category"] = "ULTRA_LUXURY"
            except (ValueError, TypeError):
                pass
        
        # Size category
        size = record.get("size")
        if size:
            try:
                size_float = float(size)
                if size_float < 80:
                    enriched["size_category"] = "SMALL"
                elif size_float < 150:
                    enriched["size_category"] = "MEDIUM"
                elif size_float < 250:
                    enriched["size_category"] = "LARGE"
                else:
                    enriched["size_category"] = "VERY_LARGE"
            except (ValueError, TypeError):
                pass
        
        # Feature score (0-100 based on amenities)
        features = [
            record.get("has_parking", False),
            record.get("has_elevator", False),
            record.get("has_pool", False),
            record.get("has_garden", False),
            record.get("has_sea_view", False),
            record.get("is_furnished", False),
        ]
        feature_count = sum(1 for f in features if f)
        enriched["feature_score"] = round((feature_count / len(features)) * 100, 2)
        
        # Anomaly detection (simple statistical approach)
        # Mark properties with extreme prices
        if record.get("price_per_m2"):
            try:
                price_per_m2 = float(record["price_per_m2"])
                # Tunisia average is ~2000-3000 TND/m2
                if price_per_m2 < 500 or price_per_m2 > 10000:
                    enriched["is_price_anomaly"] = True
                else:
                    enriched["is_price_anomaly"] = False
            except (ValueError, TypeError):
                pass
        
        # Database-ready flag
        enriched["ready_for_import"] = self._is_ready_for_import(enriched)
        
        return enriched
    
    def _is_ready_for_import(self, record: Dict[str, Any]) -> bool:
        """
        Check if record is ready for database import
        """
        # Must have essential fields
        required = ["title", "price", "property_type", "transaction_type", "governorate"]
        
        for field in required:
            if not record.get(field):
                return False
        
        return True
    
    def export_for_database(self, gold_file: str) -> List[Dict[str, Any]]:
        """
        Export gold data in database-ready format
        """
        filepath = os.path.join(self.storage_path, gold_file)
        
        with open(filepath, "r", encoding="utf-8") as f:
            gold_data = json.load(f)
        
        # Filter only records ready for import
        ready_records = [
            r for r in gold_data["data"]
            if r.get("ready_for_import", False)
        ]
        
        logger.info(f"Exported {len(ready_records)} database-ready records from {gold_file}")
        
        return ready_records
    
    def list_batches(self, source: str = None) -> List[str]:
        """List all gold batches"""
        files = os.listdir(self.storage_path)
        files = [f for f in files if f.endswith("_gold.json")]
        
        if source:
            files = [f for f in files if f.startswith(source)]
        
        return sorted(files)
