"""
Analytics API for scraped real estate data
Provides endpoints for data insights and statistics
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import os
import glob
import pandas as pd
from collections import Counter

app = FastAPI(
    title="EstateMind Analytics API",
    description="Real estate market analytics and insights",
    version="1.0.0"
)

# Data paths
BRONZE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "bronze")
SILVER_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "silver")
GOLD_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "gold")


class OverviewStats(BaseModel):
    """Overall statistics response"""
    total_listings: int
    by_property_type: Dict[str, int]
    by_transaction_type: Dict[str, int]
    avg_price: float
    median_price: float
    avg_data_quality: float
    sources: List[str]
    last_updated: str


class PriceStats(BaseModel):
    """Price statistics response"""
    property_type: Optional[str]
    delegation: Optional[str]
    count: int
    avg_price: float
    median_price: float
    min_price: float
    max_price: float
    avg_price_per_m2: Optional[float]
    price_categories: Dict[str, int]


class LocationStats(BaseModel):
    """Location statistics"""
    delegation: str
    governorate: str
    count: int
    avg_price: float
    median_price: float
    property_types: Dict[str, int]


def load_latest_data(layer: str = "gold") -> pd.DataFrame:
    """Load the most recent data from specified layer"""
    if layer == "bronze":
        path = BRONZE_PATH
    elif layer == "silver":
        path = SILVER_PATH
    else:
        path = GOLD_PATH
    
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail=f"Data path not found: {path}")
    
    # Get all JSON files
    json_files = glob.glob(os.path.join(path, "*.json"))
    
    if not json_files:
        raise HTTPException(status_code=404, detail=f"No data files found in {layer} layer")
    
    # Get the most recent file
    latest_file = max(json_files, key=os.path.getctime)
    
    try:
        with open(latest_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Extract records
        if 'data' in data:
            records = data['data']
        else:
            records = data if isinstance(data, list) else [data]
        
        return pd.DataFrame(records)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading data: {str(e)}")


@app.get("/")
def root():
    """API root endpoint"""
    return {
        "message": "EstateMind Analytics API",
        "version": "1.0.0",
        "endpoints": {
            "overview": "/api/analytics/overview",
            "price_stats": "/api/analytics/price-stats",
            "top_locations": "/api/analytics/top-locations",
            "property_trends": "/api/analytics/property-trends",
            "quality_report": "/api/analytics/quality-report",
            "search": "/api/analytics/search"
        }
    }


@app.get("/api/analytics/overview", response_model=OverviewStats)
def get_overview():
    """
    Get overall market overview statistics
    """
    try:
        df = load_latest_data("gold")
        
        # Calculate statistics
        total = len(df)
        
        # Property types
        property_types = df['property_type'].value_counts().to_dict()
        
        # Transaction types
        transaction_types = df['transaction_type'].value_counts().to_dict()
        
        # Price statistics (only for listings with prices)
        df_priced = df[df['has_price'] == True].copy()
        df_priced['price'] = pd.to_numeric(df_priced['price'], errors='coerce')
        
        avg_price = float(df_priced['price'].mean()) if len(df_priced) > 0 else 0
        median_price = float(df_priced['price'].median()) if len(df_priced) > 0 else 0
        
        # Data quality
        avg_quality = float(df['data_completeness_score'].mean()) if 'data_completeness_score' in df.columns else 0
        
        # Sources
        sources = df['source_website'].unique().tolist()
        
        # Last updated
        last_updated = datetime.now().isoformat()
        
        return OverviewStats(
            total_listings=total,
            by_property_type=property_types,
            by_transaction_type=transaction_types,
            avg_price=avg_price,
            median_price=median_price,
            avg_data_quality=avg_quality,
            sources=sources,
            last_updated=last_updated
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/price-stats", response_model=PriceStats)
def get_price_stats(
    property_type: Optional[str] = Query(None, description="Filter by property type"),
    delegation: Optional[str] = Query(None, description="Filter by delegation"),
    transaction_type: Optional[str] = Query(None, description="Filter by transaction type (SALE/RENT)")
):
    """
    Get detailed price statistics with optional filters
    """
    try:
        df = load_latest_data("gold")
        
        # Apply filters
        if property_type:
            df = df[df['property_type'] == property_type.upper()]
        
        if delegation:
            df = df[df['delegation'].str.contains(delegation, case=False, na=False)]
        
        if transaction_type:
            df = df[df['transaction_type'] == transaction_type.upper()]
        
        if len(df) == 0:
            raise HTTPException(status_code=404, detail="No data found with specified filters")
        
        # Get only listings with prices
        df_priced = df[df['has_price'] == True].copy()
        df_priced['price'] = pd.to_numeric(df_priced['price'], errors='coerce')
        df_priced = df_priced.dropna(subset=['price'])
        
        if len(df_priced) == 0:
            raise HTTPException(status_code=404, detail="No listings with valid prices found")
        
        # Calculate price statistics
        count = len(df_priced)
        avg_price = float(df_priced['price'].mean())
        median_price = float(df_priced['price'].median())
        min_price = float(df_priced['price'].min())
        max_price = float(df_priced['price'].max())
        
        # Price per m2 (if available)
        avg_price_per_m2 = None
        if 'price_per_m2' in df_priced.columns:
            df_priced['price_per_m2'] = pd.to_numeric(df_priced['price_per_m2'], errors='coerce')
            valid_ppm2 = df_priced['price_per_m2'].dropna()
            if len(valid_ppm2) > 0:
                avg_price_per_m2 = float(valid_ppm2.mean())
        
        # Price categories (if available)
        price_categories = {}
        if 'price_category' in df_priced.columns:
            price_categories = df_priced['price_category'].value_counts().to_dict()
        
        return PriceStats(
            property_type=property_type,
            delegation=delegation,
            count=count,
            avg_price=avg_price,
            median_price=median_price,
            min_price=min_price,
            max_price=max_price,
            avg_price_per_m2=avg_price_per_m2,
            price_categories=price_categories
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/top-locations")
def get_top_locations(
    limit: int = Query(10, description="Number of top locations to return"),
    property_type: Optional[str] = Query(None, description="Filter by property type")
):
    """
    Get top locations by number of listings
    """
    try:
        df = load_latest_data("gold")
        
        # Apply filter
        if property_type:
            df = df[df['property_type'] == property_type.upper()]
        
        if len(df) == 0:
            raise HTTPException(status_code=404, detail="No data found")
        
        # Group by delegation
        delegation_stats = []
        
        for delegation in df['delegation'].value_counts().head(limit).index:
            delegation_df = df[df['delegation'] == delegation].copy()
            
            # Get governorate
            governorate = delegation_df['governorate'].iloc[0] if 'governorate' in delegation_df.columns else "N/A"
            
            # Price statistics
            priced_df = delegation_df[delegation_df['has_price'] == True].copy()
            priced_df['price'] = pd.to_numeric(priced_df['price'], errors='coerce')
            
            avg_price = float(priced_df['price'].mean()) if len(priced_df) > 0 else 0
            median_price = float(priced_df['price'].median()) if len(priced_df) > 0 else 0
            
            # Property types distribution
            property_types = delegation_df['property_type'].value_counts().to_dict()
            
            delegation_stats.append(LocationStats(
                delegation=delegation,
                governorate=governorate,
                count=len(delegation_df),
                avg_price=avg_price,
                median_price=median_price,
                property_types=property_types
            ))
        
        return {
            "top_locations": [stat.dict() for stat in delegation_stats],
            "total_unique_locations": df['delegation'].nunique()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/property-trends")
def get_property_trends(
    property_type: Optional[str] = Query(None, description="Filter by property type"),
    governorate: Optional[str] = Query(None, description="Filter by governorate")
):
    """
    Get property market trends and insights
    """
    try:
        df = load_latest_data("gold")
        
        # Apply filters
        if property_type:
            df = df[df['property_type'] == property_type.upper()]
        
        if governorate:
            df = df[df['governorate'].str.contains(governorate, case=False, na=False)]
        
        if len(df) == 0:
            raise HTTPException(status_code=404, detail="No data found with specified filters")
        
        # Calculate trends
        trends = {}
        
        # Property type distribution
        trends['property_types'] = df['property_type'].value_counts().to_dict()
        
        # Transaction type distribution
        trends['transaction_types'] = df['transaction_type'].value_counts().to_dict()
        
        # Size categories (if available)
        if 'size_category' in df.columns:
            trends['size_categories'] = df['size_category'].value_counts().to_dict()
        
        # Features analysis
        feature_cols = ['has_parking', 'has_elevator', 'has_pool', 'has_garden', 
                       'has_sea_view', 'is_furnished']
        
        features_stats = {}
        for col in feature_cols:
            if col in df.columns:
                count = df[df[col] == True].shape[0]
                percentage = (count / len(df)) * 100
                features_stats[col.replace('has_', '').replace('is_', '')] = {
                    "count": int(count),
                    "percentage": round(percentage, 2)
                }
        
        trends['features'] = features_stats
        
        # Price trends by property type
        price_by_type = {}
        for ptype in df['property_type'].unique():
            type_df = df[df['property_type'] == ptype]
            priced_df = type_df[type_df['has_price'] == True].copy()
            priced_df['price'] = pd.to_numeric(priced_df['price'], errors='coerce')
            
            if len(priced_df) > 0:
                price_by_type[ptype] = {
                    "count": len(priced_df),
                    "avg_price": float(priced_df['price'].mean()),
                    "median_price": float(priced_df['price'].median())
                }
        
        trends['price_by_property_type'] = price_by_type
        
        # Days on market (if available)
        if 'days_on_market' in df.columns:
            df['days_on_market'] = pd.to_numeric(df['days_on_market'], errors='coerce')
            valid_days = df['days_on_market'].dropna()
            
            if len(valid_days) > 0:
                trends['days_on_market'] = {
                    "avg": float(valid_days.mean()),
                    "median": float(valid_days.median()),
                    "min": float(valid_days.min()),
                    "max": float(valid_days.max())
                }
        
        return trends
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/quality-report")
def get_quality_report():
    """
    Get data quality report
    """
    try:
        df = load_latest_data("gold")
        
        total = len(df)
        
        # Completeness score distribution
        if 'data_completeness_score' in df.columns:
            avg_score = float(df['data_completeness_score'].mean())
            
            # Score categories
            high_quality = len(df[df['data_completeness_score'] >= 85])
            medium_quality = len(df[(df['data_completeness_score'] >= 70) & (df['data_completeness_score'] < 85)])
            low_quality = len(df[df['data_completeness_score'] < 70])
            
            score_distribution = {
                "high_quality": {"count": high_quality, "percentage": (high_quality/total)*100},
                "medium_quality": {"count": medium_quality, "percentage": (medium_quality/total)*100},
                "low_quality": {"count": low_quality, "percentage": (low_quality/total)*100}
            }
        else:
            avg_score = 0
            score_distribution = {}
        
        # Field completeness
        field_completeness = {}
        important_fields = ['title', 'price', 'property_type', 'transaction_type', 
                           'delegation', 'governorate', 'size', 'bedrooms']
        
        for field in important_fields:
            if field in df.columns:
                non_null = df[field].notna().sum()
                percentage = (non_null / total) * 100
                field_completeness[field] = {
                    "filled": int(non_null),
                    "missing": int(total - non_null),
                    "percentage": round(percentage, 2)
                }
        
        # Listings with coordinates
        has_coords = len(df[df['has_coordinates'] == True]) if 'has_coordinates' in df.columns else 0
        
        # Listings with prices
        has_prices = len(df[df['has_price'] == True]) if 'has_price' in df.columns else 0
        
        # Duplicates (based on content_hash)
        duplicates = 0
        if 'content_hash' in df.columns:
            duplicates = df['content_hash'].duplicated().sum()
        
        return {
            "total_listings": total,
            "avg_completeness_score": round(avg_score, 2),
            "score_distribution": score_distribution,
            "field_completeness": field_completeness,
            "has_coordinates": {
                "count": int(has_coords),
                "percentage": round((has_coords/total)*100, 2)
            },
            "has_prices": {
                "count": int(has_prices),
                "percentage": round((has_prices/total)*100, 2)
            },
            "duplicates": int(duplicates)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/analytics/search")
def search_listings(
    property_type: Optional[str] = Query(None),
    delegation: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_size: Optional[float] = Query(None),
    max_size: Optional[float] = Query(None),
    bedrooms: Optional[int] = Query(None),
    has_parking: Optional[bool] = Query(None),
    has_elevator: Optional[bool] = Query(None),
    has_pool: Optional[bool] = Query(None),
    limit: int = Query(20, description="Number of results to return")
):
    """
    Search listings with multiple filters
    """
    try:
        df = load_latest_data("gold")
        
        # Apply filters
        if property_type:
            df = df[df['property_type'] == property_type.upper()]
        
        if delegation:
            df = df[df['delegation'].str.contains(delegation, case=False, na=False)]
        
        if min_price is not None:
            df = df[pd.to_numeric(df['price'], errors='coerce') >= min_price]
        
        if max_price is not None:
            df = df[pd.to_numeric(df['price'], errors='coerce') <= max_price]
        
        if min_size is not None:
            df = df[pd.to_numeric(df['size'], errors='coerce') >= min_size]
        
        if max_size is not None:
            df = df[pd.to_numeric(df['size'], errors='coerce') <= max_size]
        
        if bedrooms is not None:
            df = df[df['bedrooms'] == bedrooms]
        
        if has_parking is not None:
            df = df[df['has_parking'] == has_parking]
        
        if has_elevator is not None:
            df = df[df['has_elevator'] == has_elevator]
        
        if has_pool is not None:
            df = df[df['has_pool'] == has_pool]
        
        # Limit results
        results = df.head(limit)
        
        # Convert to dict
        listings = results.to_dict('records')
        
        return {
            "count": len(results),
            "total_matches": len(df),
            "listings": listings
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "data_layers": {
            "bronze": os.path.exists(BRONZE_PATH),
            "silver": os.path.exists(SILVER_PATH),
            "gold": os.path.exists(GOLD_PATH)
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
