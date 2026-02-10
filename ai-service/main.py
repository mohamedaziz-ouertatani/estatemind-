from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="EstateMind AI Service", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class PropertyFeatures(BaseModel):
    governorate: str
    delegation: str
    propertyType: str
    transactionType: str
    size: float
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    hasParking: bool = False
    hasElevator: bool = False
    hasGarden: bool = False
    hasPool: bool = False
    hasSeaView: bool = False
    latitude: float
    longitude: float

class ComparableProperty(BaseModel):
    id: str
    price: int
    size: float
    pricePerM2: int
    distance: float
    similarity: int

class ValuationRequest(BaseModel):
    propertyId: str
    features: PropertyFeatures
    comparables: List[dict]

class ValuationResponse(BaseModel):
    estimatedValue: int
    confidenceScore: float
    minValue: int
    maxValue: int
    locationScore: int
    sizeScore: int
    conditionScore: int
    amenitiesScore: int
    comparables: List[ComparableProperty]
    aiInsights: str

@app.get("/")
def read_root():
    return {
        "service": "EstateMind AI Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/valuations/estimate", response_model=ValuationResponse)
async def estimate_property_value(request: ValuationRequest):
    """
    Estimate property value using AI/ML models
    
    This is a simplified version for Phase 1. In production, this would use:
    - Advanced ML models trained on historical Tunisia real estate data
    - Computer vision for property condition assessment
    - NLP for description analysis
    - Time series forecasting for market trends
    """
    try:
        features = request.features
        
        # Base price calculation using comparables
        if request.comparables:
            comparable_prices = [comp['price'] for comp in request.comparables]
            base_price = sum(comparable_prices) / len(comparable_prices)
        else:
            # Fallback: simple price per m² by governorate
            price_per_m2_map = {
                'Tunis': 2500,
                'Ariana': 2200,
                'Ben Arous': 2000,
                'Nabeul': 1800,
                'Sousse': 1600,
                'Monastir': 1700,
                'Sfax': 1500,
                'default': 1200
            }
            price_per_m2 = price_per_m2_map.get(features.governorate, price_per_m2_map['default'])
            base_price = features.size * price_per_m2
        
        # Adjustment factors
        adjustments = 1.0
        
        # Property type adjustments
        type_multipliers = {
            'APARTMENT': 1.0,
            'HOUSE': 1.1,
            'VILLA': 1.5,
            'LAND': 0.6,
            'COMMERCIAL': 1.2,
            'OFFICE': 1.3
        }
        adjustments *= type_multipliers.get(features.propertyType, 1.0)
        
        # Amenity adjustments
        if features.hasParking:
            adjustments *= 1.05
        if features.hasElevator:
            adjustments *= 1.03
        if features.hasGarden:
            adjustments *= 1.08
        if features.hasPool:
            adjustments *= 1.15
        if features.hasSeaView:
            adjustments *= 1.20
        
        # Calculate final estimation
        estimated_value = int(base_price * adjustments)
        confidence_score = 0.75 + (len(request.comparables) * 0.05)  # Higher with more comparables
        confidence_score = min(confidence_score, 0.95)
        
        min_value = int(estimated_value * 0.90)
        max_value = int(estimated_value * 1.10)
        
        # Calculate individual scores
        location_score = 85 if features.governorate in ['Tunis', 'Ariana', 'Ben Arous'] else 70
        size_score = min(100, int(60 + (features.size / 10)))
        condition_score = 80  # Would use image analysis in production
        
        # Amenities score
        amenities_count = sum([
            features.hasParking,
            features.hasElevator,
            features.hasGarden,
            features.hasPool,
            features.hasSeaView
        ])
        amenities_score = 60 + (amenities_count * 8)
        
        # Process comparables
        comparable_properties = []
        for i, comp in enumerate(request.comparables[:5]):  # Limit to 5
            comparable_properties.append(ComparableProperty(
                id=comp.get('id', f'comp_{i}'),
                price=comp['price'],
                size=comp['size'],
                pricePerM2=int(comp['price'] / comp['size']),
                distance=comp.get('distance', 0),
                similarity=comp.get('similarity', 75)
            ))
        
        # Generate AI insights
        price_assessment = "juste" if 0.95 <= adjustments <= 1.05 else "légèrement élevé" if adjustments > 1.05 else "attractif"
        
        insights = f"""Analyse de la propriété:

Estimation: {estimated_value:,} TND
Fourchette: {min_value:,} - {max_value:,} TND
Confiance: {int(confidence_score * 100)}%

Cette propriété de type {features.propertyType} située à {features.delegation}, {features.governorate} présente un prix {price_assessment} par rapport au marché local.

Points forts:
"""
        if features.hasSeaView:
            insights += "\n• Vue sur mer (prime importante)"
        if features.hasPool:
            insights += "\n• Piscine privée"
        if features.hasGarden:
            insights += "\n• Jardin/espace extérieur"
        if location_score >= 85:
            insights += "\n• Emplacement privilégié"
        
        insights += f"\n\nLe score de localisation de {location_score}/100 reflète la qualité du quartier et sa proximité aux commodités."
        
        return ValuationResponse(
            estimatedValue=estimated_value,
            confidenceScore=confidence_score,
            minValue=min_value,
            maxValue=max_value,
            locationScore=location_score,
            sizeScore=size_score,
            conditionScore=condition_score,
            amenitiesScore=amenities_score,
            comparables=comparable_properties,
            aiInsights=insights
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Valuation error: {str(e)}")

@app.post("/api/valuations/batch")
async def batch_valuation(requests: List[ValuationRequest]):
    """
    Batch valuation for multiple properties
    Available for Investor tier and above
    """
    results = []
    for req in requests:
        try:
            result = await estimate_property_value(req)
            results.append(result)
        except Exception as e:
            results.append({"error": str(e), "propertyId": req.propertyId})
    
    return {"valuations": results, "count": len(results)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
