# EstateMind Tunisia - Seed Data Summary

## Overview
Comprehensive seed data file for Tunisia real estate platform with realistic market data.

## Test Users (3)

### 1. Developer Account
- **Email**: dev@estatemind.tn
- **Password**: dev123
- **Type**: INVESTOR
- **Subscription**: INVESTOR_PRO_299
- **Credits**: Unlimited (-1)

### 2. Normal User
- **Email**: normal@estatemind.tn
- **Password**: user123
- **Type**: NORMAL
- **Subscription**: FREE
- **Credits**: 3

### 3. Agent Account
- **Email**: agent@estatemind.tn
- **Password**: agent123
- **Type**: AGENT
- **Subscription**: AGENCY_499
- **Credits**: Unlimited (-1)

## Neighborhoods (31+)

### Tunis Region (8)
1. La Marsa Plage - Premium beachfront (3800 TND/m²)
2. Carthage Hannibal - Ultra-luxury historic (4500 TND/m²)
3. Lac 1 - Modern business district (3200 TND/m²)
4. Ennasr - Popular residential (2600 TND/m²)
5. Manar - University area (2700 TND/m²)
6. Menzah 6 - Family-friendly (2800 TND/m²)
7. Sidi Bou Said - Iconic village (4000 TND/m²)
8. Ben Arous Centre - Southern suburb (1900 TND/m²)

### Ariana Region (2)
9. Ariana Centre - City center (2400 TND/m²)
10. Ariana Essoghra - Residential (2200 TND/m²)

### Sousse Region (6)
11. Sousse Corniche - Beachfront (1900 TND/m²)
12. Port El Kantaoui - Resort area (2500 TND/m²)
13. Khezama Sousse - Residential (1600 TND/m²)
14. Sahloul Sousse - Medical district (1750 TND/m²)
15. Hammam Sousse - Family beach town (1650 TND/m²)
16. Sousse Riadh - Modern residential (1600 TND/m²)

### Nabeul Region (5)
17. Hammamet Centre - Tourist hub (2200 TND/m²)
18. Yasmine Hammamet - Integrated resort (2800 TND/m²)
19. Hammamet Yasmine Centre - Animation center (2900 TND/m²)
20. Nabeul Ville - Cap Bon capital (1700 TND/m²)
21. Kelibia - Coastal fortress town (1500 TND/m²)

### Sfax Region (3)
22. Sfax Centre Ville - Business hub (1800 TND/m²)
23. Thyna Sfax - Suburban (1500 TND/m²)
24. Sfax Jadida - Modern district (1950 TND/m²)

### Bizerte Region (2)
25. Bizerte Centre - Port city (1600 TND/m²)
26. Corniche Bizerte - Waterfront (2100 TND/m²)

### Other Cities (5)
27. Monastir Centre - Historic coastal (1700 TND/m²)
28. Mahdia Centre - Fishing town (1400 TND/m²)
29. Kairouan Médina - Holy city (1100 TND/m²)
30. Gabès Centre - Southern oasis (1200 TND/m²)
31. Tozeur - Desert gateway (1100 TND/m²)
32. Djerba Houmt Souk - Island paradise (1800 TND/m²)

## Properties (236 Total)

### Distribution by Area
- La Marsa: 30 properties
- Carthage: 20 properties
- Ariana: 25 properties
- Menzah: 20 properties
- Sousse Ville: 15 properties
- Port El Kantaoui: 10 properties
- Khezama: 10 properties
- Hammamet: 20 properties
- Nabeul: 15 properties
- Yasmine Hammamet: 10 properties
- Sfax Downtown: 15 properties
- Thyna: 10 properties
- Bizerte: 10 properties
- Corniche Bizerte: 8 properties
- Monastir: 8 properties
- Mahdia: 5 properties
- Kairouan: 5 properties

### Distribution by Type
- **Apartments**: ~60% (141 properties)
- **Houses/Villas**: ~25% (59 properties)
- **Land**: ~10% (24 properties)
- **Commercial**: ~5% (12 properties)

### Price Ranges (in TND)
- **Budget** (40%): 150,000 - 300,000 TND
- **Mid-range** (40%): 300,000 - 600,000 TND
- **Luxury** (15%): 600,000 - 2,000,000 TND
- **Ultra-luxury** (5%): 2,000,000+ TND

### Features
- Realistic French property titles (e.g., "Appartement S+3 La Marsa avec vue mer")
- Detailed descriptions (150-300 words in French)
- Accurate GPS coordinates for Tunisia
- Market-realistic pricing per m²
- Proper amenities based on property type:
  - Parking availability
  - Elevator (for apartments)
  - Garden (for houses/villas)
  - Pool (for luxury villas)
  - Sea view (for coastal properties)
- Unsplash image URLs
- AI valuations with confidence scores
- Listing dates within last 90 days
- View counts (0-150)

## Valuations (20)
- Sample valuations for first 20 properties
- Confidence scores (75-95%)
- Price range analysis (min/max)
- Comparable properties
- AI insights in French

## Investment Portfolio (8)
- Dev user portfolio with 8 properties
- Purchase dates over last 2 years
- Current valuations
- Rental income calculations
- Yield calculations (gross/net)
- Appreciation tracking
- Total return analysis

## Data Quality Features

### Location Data
- Real Tunisia governorates and delegations
- Accurate GPS coordinates (±0.01° variation)
- Neighborhood-specific pricing

### Market Data
- Realistic TND pricing based on location
- Rental yields (4-8% depending on area)
- Days on market (30-75 days)
- Year-to-date price growth (3-10%)

### Neighborhood Scoring (0-100)
- Overall score
- Housing quality score
- Schools score
- Transport score
- Amenities score
- Lifestyle score
- Safety score
- Gentrification score

### Additional Features
- Schools with distances and ratings
- Transportation options
- Nearby amenities
- Future development projects
- Market statistics

## Usage

```bash
# Install dependencies
npm install

# Run seed
npx prisma db seed
# or
npm run seed
```

## Files Modified
- `/prisma/seed.ts` - Comprehensive seed file (1000+ lines)

## Technical Details
- Language: TypeScript
- Framework: Prisma ORM
- Database: PostgreSQL
- Bcrypt password hashing
- JSON data structures for complex fields
- Async/await patterns
- Progress logging

## Notes
- All property descriptions in French (Tunisia's administrative language)
- Prices in Tunisian Dinar (TND)
- Realistic market data based on 2024 Tunisia real estate market
- Balanced distribution across price ranges and property types
- Comprehensive neighborhood data with real amenities and infrastructure
