"""
Gold Layer Processing Script
Creates analytics-ready aggregations and insights
"""
import json
import pandas as pd
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GoldLayerProcessor:
    """Create analytics-ready gold layer from silver data"""
    
    def __init__(self, silver_dir: str = "data/silver", gold_dir: str = "data/gold"):
        self.silver_dir = Path(silver_dir)
        self.gold_dir = Path(gold_dir)
        self.gold_dir.mkdir(parents=True, exist_ok=True)
    
    def load_silver_data(self) -> pd.DataFrame:
        """Load all silver layer files into a single DataFrame"""
        all_records = []
        
        silver_files = list(self.silver_dir.glob("silver_*.json"))
        logger.info(f"Loading {len(silver_files)} silver files")
        
        for silver_file in silver_files:
            with open(silver_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                records = data.get('data', [])
                all_records.extend(records)
        
        df = pd.DataFrame(all_records)
        logger.info(f"Loaded {len(df)} records into DataFrame")
        
        return df
    
    def create_price_analytics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Calculate price-related analytics"""
        analytics = {}
        
        # Filter properties with valid prices
        df_priced = df[df['has_price'] == True].copy()
        
        if len(df_priced) == 0:
            return {"error": "No properties with valid prices"}
        
        # Overall statistics
        analytics['overall'] = {
            'avg_price': float(df_priced['price'].mean()),
            'median_price': float(df_priced['price'].median()),
            'min_price': float(df_priced['price'].min()),
            'max_price': float(df_priced['price'].max()),
            'total_properties': len(df_priced)
        }
        
        # By governorate
        gov_stats = df_priced.groupby('governorate').agg({
            'price': ['mean', 'median', 'count']
        }).round(2)
        
        analytics['by_governorate'] = {}
        for gov in gov_stats.index:
            if pd.notna(gov):
                analytics['by_governorate'][gov] = {
                    'avg_price': float(gov_stats.loc[gov, ('price', 'mean')]),
                    'median_price': float(gov_stats.loc[gov, ('price', 'median')]),
                    'property_count': int(gov_stats.loc[gov, ('price', 'count')])
                }
        
        # By property type
        type_stats = df_priced.groupby('property_type').agg({
            'price': ['mean', 'median', 'count']
        }).round(2)
        
        analytics['by_property_type'] = {}
        for prop_type in type_stats.index:
            if pd.notna(prop_type):
                analytics['by_property_type'][prop_type] = {
                    'avg_price': float(type_stats.loc[prop_type, ('price', 'mean')]),
                    'median_price': float(type_stats.loc[prop_type, ('price', 'median')]),
                    'property_count': int(type_stats.loc[prop_type, ('price', 'count')])
                }
        
        # By transaction type
        trans_stats = df_priced.groupby('transaction_type').agg({
            'price': ['mean', 'median', 'count']
        }).round(2)
        
        analytics['by_transaction_type'] = {}
        for trans_type in trans_stats.index:
            if pd.notna(trans_type):
                analytics['by_transaction_type'][trans_type] = {
                    'avg_price': float(trans_stats.loc[trans_type, ('price', 'mean')]),
                    'median_price': float(trans_stats.loc[trans_type, ('price', 'median')]),
                    'property_count': int(trans_stats.loc[trans_type, ('price', 'count')])
                }
        
        return analytics
    
    def create_feature_analytics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze property features"""
        analytics = {}
        
        # Feature percentages
        total = len(df)
        features = ['has_parking', 'has_elevator', 'has_pool', 'has_garden', 'has_sea_view', 'is_furnished']
        
        analytics['feature_percentages'] = {}
        for feature in features:
            count = df[df[feature] == True].shape[0]
            percentage = (count / total * 100) if total > 0 else 0
            analytics['feature_percentages'][feature] = {
                'count': int(count),
                'percentage': round(percentage, 2)
            }
        
        return analytics
    
    def create_size_analytics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze property sizes"""
        analytics = {}
        
        # Filter properties with valid size
        df_sized = df[df['size'].notna()].copy()
        
        if len(df_sized) == 0:
            return {"error": "No properties with valid size"}
        
        analytics['overall'] = {
            'avg_size': float(df_sized['size'].mean()),
            'median_size': float(df_sized['size'].median()),
            'min_size': float(df_sized['size'].min()),
            'max_size': float(df_sized['size'].max())
        }
        
        # By property type
        type_stats = df_sized.groupby('property_type')['size'].agg(['mean', 'median', 'count']).round(2)
        
        analytics['by_property_type'] = {}
        for prop_type in type_stats.index:
            if pd.notna(prop_type):
                analytics['by_property_type'][prop_type] = {
                    'avg_size': float(type_stats.loc[prop_type, 'mean']),
                    'median_size': float(type_stats.loc[prop_type, 'median']),
                    'count': int(type_stats.loc[prop_type, 'count'])
                }
        
        return analytics
    
    def process(self) -> Dict[str, str]:
        """Process silver data into gold layer analytics"""
        logger.info("Starting Gold layer processing")
        
        # Load silver data
        df = self.load_silver_data()
        
        if df.empty:
            logger.warning("No data found in silver layer")
            return {}
        
        # Create analytics
        output_files = {}
        
        # 1. Price analytics
        logger.info("Creating price analytics")
        price_analytics = self.create_price_analytics(df)
        price_file = self.gold_dir / "price_analytics.json"
        with open(price_file, 'w', encoding='utf-8') as f:
            json.dump(price_analytics, f, ensure_ascii=False, indent=2)
        output_files['price_analytics'] = str(price_file)
        
        # 2. Feature analytics
        logger.info("Creating feature analytics")
        feature_analytics = self.create_feature_analytics(df)
        feature_file = self.gold_dir / "feature_analytics.json"
        with open(feature_file, 'w', encoding='utf-8') as f:
            json.dump(feature_analytics, f, ensure_ascii=False, indent=2)
        output_files['feature_analytics'] = str(feature_file)
        
        # 3. Size analytics
        logger.info("Creating size analytics")
        size_analytics = self.create_size_analytics(df)
        size_file = self.gold_dir / "size_analytics.json"
        with open(size_file, 'w', encoding='utf-8') as f:
            json.dump(size_analytics, f, ensure_ascii=False, indent=2)
        output_files['size_analytics'] = str(size_file)
        
        # 4. Export summary CSV
        logger.info("Creating summary CSV")
        summary_cols = ['title', 'property_type', 'transaction_type', 'governorate', 
                       'price', 'size', 'bedrooms', 'has_price', 'has_coordinates']
        summary_df = df[summary_cols].copy()
        summary_csv = self.gold_dir / "properties_summary.csv"
        summary_df.to_csv(summary_csv, index=False)
        output_files['summary_csv'] = str(summary_csv)
        
        logger.info(f"Gold layer processing complete. Created {len(output_files)} files")
        
        return output_files


if __name__ == "__main__":
    processor = GoldLayerProcessor()
    output_files = processor.process()
    
    print("\n✅ Gold Layer Analytics Created:")
    for name, file_path in output_files.items():
        print(f"  - {name}: {file_path}")