"""
Bronze Layer - Raw data ingestion
Store all scraped data as-is without modification
"""
import json
import os
from datetime import datetime
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class BronzeLayer:
    """
    Bronze layer handles raw data ingestion from scrapers
    """
    
    def __init__(self, storage_path: str = None):
        self.storage_path = storage_path or os.path.join(os.path.dirname(__file__), "..", "data", "bronze")
        os.makedirs(self.storage_path, exist_ok=True)
    
    def ingest(self, data: List[Dict[str, Any]], source: str, batch_id: str = None) -> str:
        """
        Ingest raw data from scraper
        
        Args:
            data: List of scraped items
            source: Source identifier (e.g., "tayara", "mubawab")
            batch_id: Optional batch identifier
        
        Returns:
            File path where data was stored
        """
        if batch_id is None:
            batch_id = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        filename = f"{source}_{batch_id}.json"
        filepath = os.path.join(self.storage_path, filename)
        
        # Add ingestion metadata
        bronze_data = {
            "metadata": {
                "source": source,
                "batch_id": batch_id,
                "ingestion_timestamp": datetime.utcnow().isoformat(),
                "record_count": len(data),
            },
            "data": data
        }
        
        # Write to file
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(bronze_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Bronze layer: Ingested {len(data)} records to {filepath}")
        return filepath
    
    def list_batches(self, source: str = None) -> List[str]:
        """
        List all bronze batches, optionally filtered by source
        """
        files = os.listdir(self.storage_path)
        
        if source:
            files = [f for f in files if f.startswith(source)]
        
        return sorted(files)
    
    def read_batch(self, filename: str) -> Dict[str, Any]:
        """
        Read a bronze batch file
        """
        filepath = os.path.join(self.storage_path, filename)
        
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
