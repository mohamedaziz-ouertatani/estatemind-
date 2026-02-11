"""
Comprehensive Property Valuation Model for Tunisia Real Estate
Rule-based MVP with regional pricing and detailed adjustments
"""

from typing import Dict, List, Optional

# Comprehensive Tunisia Regional Base Prices (TND per m²)
TUNISIA_REGIONAL_PRICES = {
    'Tunis': {
        'La Marsa': 4200,
        'Carthage': 4500,
        'Gammarth': 5000,
        'Sidi Bou Said': 4000,
        'Ariana': 3200,
        'Menzah': 3800,
        'Ennasr': 3500,
        'Manar': 3300,
        'Lac 1': 3600,
        'Lac 2': 3400,
        'Centre Ville': 3000,
        'Bardo': 2800,
    },
    'Ariana': {
        'Ariana Ville': 2400,
        'Ariana Essoghra': 2200,
        'Raoued': 2000,
        'Soukra': 2600,
    },
    'Ben Arous': {
        'Hammam-Lif': 2300,
        'Rades': 2100,
        'Megrine': 2200,
    },
    'Sousse': {
        'Khezama': 3000,
        'Port El Kantaoui': 3500,
        'Sousse Ville': 1900,
        'Corniche': 3200,
        'Sahloul': 2400,
    },
    'Nabeul': {
        'Hammamet': 2200,
        'Hammamet Nord': 2400,
        'Yasmine Hammamet': 2800,
        'Nabeul Ville': 1700,
        'Kelibia': 1600,
    },
    'Sfax': {
        'Sfax Ville': 1800,
        'Sfax Jadida': 2000,
        'Thyna': 1500,
        'Sakiet Ezzit': 1600,
    },
    'Bizerte': {
        'Bizerte Ville': 1600,
        'Corniche': 2100,
        'Menzel Bourguiba': 1400,
    },
    'Monastir': {
        'Monastir': 1700,
        'Skanes': 1900,
    },
    'Mahdia': {
        'Mahdia': 1400,
    },
    'Kairouan': {
        'Kairouan': 1100,
    },
    'Gabes': {
        'Gabes': 1200,
    },
    'Tozeur': {
        'Tozeur': 1300,
    },
}


class PropertyValuationModel:
    """Rule-based valuation model for Tunisia real estate"""
    
    def __init__(self):
        self.regional_prices = TUNISIA_REGIONAL_PRICES
    
    def get_regional_base_price(self, governorate: str, delegation: str) -> float:
        """Get base price per m² for a specific region"""
        if governorate in self.regional_prices:
            if delegation in self.regional_prices[governorate]:
                return self.regional_prices[governorate][delegation]
            # Return average for governorate if delegation not found
            return sum(self.regional_prices[governorate].values()) / len(self.regional_prices[governorate])
        # Default fallback
        return 1500
    
    def calculate_location_score(self, property_data: Dict) -> float:
        """Calculate location multiplier based on area desirability"""
        governorate = property_data.get('governorate', '')
        delegation = property_data.get('delegation', '')
        
        # Premium locations get higher multipliers
        premium_areas = ['La Marsa', 'Carthage', 'Gammarth', 'Sidi Bou Said', 
                        'Port El Kantaoui', 'Yasmine Hammamet']
        mid_tier_areas = ['Ariana', 'Menzah', 'Ennasr', 'Sousse Ville', 'Hammamet']
        
        if delegation in premium_areas:
            return 1.2
        elif delegation in mid_tier_areas:
            return 1.0
        else:
            return 0.9
    
    def calculate_floor_bonus(self, floor: Optional[int], property_type: str) -> float:
        """Calculate floor adjustment for apartments"""
        if property_type != 'APARTMENT' or floor is None:
            return 1.0
        
        if floor <= 0:  # Ground floor
            return 0.95
        elif 1 <= floor <= 3:
            return 1.0
        elif 4 <= floor <= 6:
            return 1.02
        else:  # High floors
            return 1.05
    
    def estimate_property_age_impact(self, property_data: Dict) -> float:
        """Estimate age impact (simplified - would use actual data in production)"""
        # Assume most properties are in good condition
        # In production, this would use actual age and condition data
        return 0.95  # Slight depreciation assumption
    
    def calculate_confidence(self, property_data: Dict, comparables: List) -> float:
        """Calculate confidence score based on data availability"""
        confidence = 0.7  # Base confidence
        
        # Increase confidence with more comparables
        if len(comparables) > 0:
            confidence += min(0.15, len(comparables) * 0.03)
        
        # Increase confidence if we have detailed property info
        if property_data.get('bedrooms') is not None:
            confidence += 0.02
        if property_data.get('bathrooms') is not None:
            confidence += 0.02
        
        # Cap at 0.95
        return min(confidence, 0.95)
    
    def find_comparables(self, property_data: Dict) -> List[Dict]:
        """Find comparable properties (simplified - would use database in production)"""
        # This is a placeholder. In production, this would query the database
        # for similar properties in the same area
        return []
    
    def generate_insights(self, property_data: Dict, estimated_value: int) -> str:
        """Generate AI insights about the property"""
        property_type = property_data.get('propertyType', 'property')
        delegation = property_data.get('delegation', '')
        governorate = property_data.get('governorate', '')
        
        insights = f"Analyse de la propriété:\n\n"
        insights += f"Type: {property_type}\n"
        insights += f"Localisation: {delegation}, {governorate}\n"
        insights += f"Valeur estimée: {estimated_value:,} TND\n\n"
        
        # Add specific insights based on features
        strong_points = []
        if property_data.get('hasSeaView'):
            strong_points.append("Vue sur mer (prime de 15-20%)")
        if property_data.get('hasPool'):
            strong_points.append("Piscine privée")
        if property_data.get('hasGarden'):
            strong_points.append("Jardin/espace extérieur")
        if property_data.get('hasParking'):
            strong_points.append("Parking privé")
        if property_data.get('hasElevator'):
            strong_points.append("Ascenseur")
        
        if strong_points:
            insights += "Points forts:\n"
            for point in strong_points:
                insights += f"• {point}\n"
            insights += "\n"
        
        # Market context
        base_price = self.get_regional_base_price(governorate, delegation)
        insights += f"Prix moyen du marché: {base_price:,} TND/m²\n"
        insights += f"\nRecommandation: Cette propriété représente "
        
        if property_type in ['VILLA', 'HOUSE'] and property_data.get('hasPool'):
            insights += "un excellent investissement pour une résidence de prestige."
        elif delegation in ['La Marsa', 'Carthage', 'Gammarth']:
            insights += "une opportunité dans un quartier très recherché."
        else:
            insights += "une bonne opportunité d'investissement."
        
        return insights
    
    def assess_listing_price(self, listing_price: Optional[int], estimated_value: int) -> str:
        """Assess if the listing price is fair"""
        if listing_price is None:
            return "unknown"
        
        ratio = listing_price / estimated_value
        
        if ratio < 0.90:
            return "excellent"  # Below market
        elif ratio < 0.95:
            return "good"  # Slightly below market
        elif ratio <= 1.05:
            return "fair"  # Fair price
        elif ratio <= 1.15:
            return "high"  # Slightly overpriced
        else:
            return "very_high"  # Overpriced
    
    def estimate_value(self, property_data: Dict) -> Dict:
        """Main valuation function"""
        try:
            # Extract property features
            governorate = property_data.get('governorate', '')
            delegation = property_data.get('delegation', '')
            property_type = property_data.get('propertyType', 'APARTMENT')
            size = property_data.get('size', 0)
            floor = property_data.get('floor')
            listing_price = property_data.get('price')
            
            # Get base price per m²
            base_price_per_m2 = self.get_regional_base_price(governorate, delegation)
            base_value = base_price_per_m2 * size
            
            # Location adjustments
            location_multiplier = self.calculate_location_score(property_data)
            
            # Property type adjustments
            type_multipliers = {
                'APARTMENT': 1.0,
                'HOUSE': 1.15,
                'VILLA': 1.4,
                'LAND': 0.6,
                'COMMERCIAL': 1.3,
                'OFFICE': 1.2,
            }
            type_multiplier = type_multipliers.get(property_type, 1.0)
            
            # Amenities adjustments
            amenities_bonus = 0
            if property_data.get('hasParking'):
                amenities_bonus += 0.05
            if property_data.get('hasElevator'):
                amenities_bonus += 0.03
            if property_data.get('hasPool'):
                amenities_bonus += 0.10
            if property_data.get('hasSeaView'):
                amenities_bonus += 0.15
            if property_data.get('hasGarden'):
                amenities_bonus += 0.08
            
            # Floor adjustment
            floor_multiplier = self.calculate_floor_bonus(floor, property_type)
            
            # Age/condition adjustment
            age_multiplier = self.estimate_property_age_impact(property_data)
            
            # Final calculation
            estimated_value = int(
                base_value 
                * location_multiplier 
                * type_multiplier
                * (1 + amenities_bonus)
                * floor_multiplier
                * age_multiplier
            )
            
            # Calculate confidence
            comparables = self.find_comparables(property_data)
            confidence = self.calculate_confidence(property_data, comparables)
            
            # Calculate range (±7%)
            min_value = int(estimated_value * 0.93)
            max_value = int(estimated_value * 1.07)
            
            # Calculate individual scores
            location_score = int(location_multiplier * 85)
            size_score = min(100, int(60 + (size / 10)))
            condition_score = 80  # Default, would use actual data
            amenities_count = sum([
                property_data.get('hasParking', False),
                property_data.get('hasElevator', False),
                property_data.get('hasGarden', False),
                property_data.get('hasPool', False),
                property_data.get('hasSeaView', False)
            ])
            amenities_score = 60 + (amenities_count * 8)
            
            # Generate insights
            insights = self.generate_insights(property_data, estimated_value)
            
            # Assess price fairness
            is_fair_price = self.assess_listing_price(listing_price, estimated_value)
            
            return {
                'estimatedValue': estimated_value,
                'minValue': min_value,
                'maxValue': max_value,
                'confidenceScore': confidence,
                'locationScore': location_score,
                'sizeScore': size_score,
                'conditionScore': condition_score,
                'amenitiesScore': amenities_score,
                'comparables': comparables,
                'aiInsights': insights,
                'isPriceFair': is_fair_price,
                'breakdown': {
                    'basePricePerM2': base_price_per_m2,
                    'baseValue': base_value,
                    'locationMultiplier': location_multiplier,
                    'typeMultiplier': type_multiplier,
                    'amenitiesBonus': amenities_bonus,
                    'floorMultiplier': floor_multiplier,
                    'ageMultiplier': age_multiplier,
                }
            }
        
        except Exception as e:
            raise Exception(f"Valuation error: {str(e)}")
