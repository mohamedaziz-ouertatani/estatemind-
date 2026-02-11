from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict
import os
from dotenv import load_dotenv
from valuation_model import PropertyValuationModel

load_dotenv()

app = FastAPI(
    title="EstateMind AI Service",
    version="1.0.0",
    description="AI-powered property valuation service for Tunisia real estate"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://estatemind.tn", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize valuation model
valuation_model = PropertyValuationModel()

# API Key authentication
API_KEY = os.getenv("AI_SERVICE_API_KEY", "dev-api-key")

def verify_api_key(x_api_key: Optional[str] = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

# Models
class PropertyFeatures(BaseModel):
    governorate: str
    delegation: str
    propertyType: str
    transactionType: str
    size: float
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    floor: Optional[int] = None
    hasParking: bool = False
    hasElevator: bool = False
    hasGarden: bool = False
    hasPool: bool = False
    hasSeaView: bool = False
    latitude: float
    longitude: float
    price: Optional[int] = None  # Listing price for comparison

class ValuationRequest(BaseModel):
    propertyId: str
    features: PropertyFeatures
    comparables: Optional[List[dict]] = []

class BatchValuationRequest(BaseModel):
    properties: List[ValuationRequest]

class ValuationResponse(BaseModel):
    propertyId: str
    estimatedValue: int
    confidenceScore: float
    minValue: int
    maxValue: int
    locationScore: int
    sizeScore: int
    conditionScore: int
    amenitiesScore: int
    aiInsights: str
    isPriceFair: str
    breakdown: Optional[Dict] = None

class BatchValuationResponse(BaseModel):
    success: int
    failed: int
    results: List[ValuationResponse]
    errors: List[Dict]

@app.get("/")
def read_root():
    return {
        "service": "EstateMind AI Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "/api/v1/valuations/estimate": "Single property valuation",
            "/api/v1/valuations/batch": "Batch property valuation",
            "/health": "Health check"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ai-valuation",
        "model": "rule-based-v1",
        "regions_supported": len(valuation_model.regional_prices)
    }

@app.post("/api/v1/valuations/estimate", response_model=ValuationResponse)
async def estimate_property_value(
    request: ValuationRequest,
    api_key: str = Header(None, alias="X-API-Key")
):
    """
    Estimate property value using rule-based valuation model
    
    This endpoint provides comprehensive property valuation based on:
    - Regional pricing data for Tunisia
    - Property type and features
    - Location desirability
    - Amenities and condition
    """
    # Verify API key in production
    if os.getenv("NODE_ENV") == "production" and api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        # Convert features to dict
        property_data = request.features.dict()
        
        # Run valuation
        result = valuation_model.estimate_value(property_data)
        
        # Format response
        return ValuationResponse(
            propertyId=request.propertyId,
            estimatedValue=result['estimatedValue'],
            confidenceScore=result['confidenceScore'],
            minValue=result['minValue'],
            maxValue=result['maxValue'],
            locationScore=result['locationScore'],
            sizeScore=result['sizeScore'],
            conditionScore=result['conditionScore'],
            amenitiesScore=result['amenitiesScore'],
            aiInsights=result['aiInsights'],
            isPriceFair=result['isPriceFair'],
            breakdown=result.get('breakdown')
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Valuation error: {str(e)}")

@app.post("/api/v1/valuations/batch", response_model=BatchValuationResponse)
async def batch_valuation(
    request: BatchValuationRequest,
    api_key: str = Header(None, alias="X-API-Key")
):
    """
    Batch valuation for multiple properties
    
    Useful for investors who need to value multiple properties at once.
    Processes properties in parallel for faster results.
    """
    # Verify API key in production
    if os.getenv("NODE_ENV") == "production" and api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    results = []
    errors = []
    success_count = 0
    failed_count = 0
    
    for prop_request in request.properties:
        try:
            # Convert features to dict
            property_data = prop_request.features.dict()
            
            # Run valuation
            result = valuation_model.estimate_value(property_data)
            
            # Add to results
            results.append(ValuationResponse(
                propertyId=prop_request.propertyId,
                estimatedValue=result['estimatedValue'],
                confidenceScore=result['confidenceScore'],
                minValue=result['minValue'],
                maxValue=result['maxValue'],
                locationScore=result['locationScore'],
                sizeScore=result['sizeScore'],
                conditionScore=result['conditionScore'],
                amenitiesScore=result['amenitiesScore'],
                aiInsights=result['aiInsights'],
                isPriceFair=result['isPriceFair'],
                breakdown=result.get('breakdown')
            ))
            success_count += 1
            
        except Exception as e:
            errors.append({
                "propertyId": prop_request.propertyId,
                "error": str(e)
            })
            failed_count += 1
    
    return BatchValuationResponse(
        success=success_count,
        failed=failed_count,
        results=results,
        errors=errors
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
