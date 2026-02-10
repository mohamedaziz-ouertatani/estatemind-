# API Documentation

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://estatemind.vercel.app/api`

## Authentication

Most endpoints require authentication via NextAuth.js session cookies.

```typescript
// Include credentials in fetch requests
fetch('/api/endpoint', {
  credentials: 'include',
  // ...
})
```

---

## Authentication Endpoints

### Register User

Create a new user account.

**Endpoint**: `POST /api/auth/register`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+216 50 123 456",
  "userType": "NORMAL"
}
```

**Response**: `201 Created`
```json
{
  "user": {
    "id": "clxxxxx",
    "email": "user@example.com",
    "name": "John Doe",
    "userType": "NORMAL"
  }
}
```

**Errors**:
- `400`: User already exists or invalid data
- `500`: Internal server error

---

### Login

Authenticate a user.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**: `200 OK`
```json
{
  "user": {
    "id": "clxxxxx",
    "email": "user@example.com",
    "name": "John Doe",
    "userType": "NORMAL",
    "subscriptionTier": "FREE",
    "valuationCredits": 3
  }
}
```

**Errors**:
- `401`: Invalid credentials
- `500`: Internal server error

---

## Properties Endpoints

### List Properties

Get a paginated list of properties with optional filters.

**Endpoint**: `GET /api/properties`

**Query Parameters**:
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `governorate` (string): Filter by governorate
- `propertyType` (PropertyType): Filter by property type
- `transactionType` (TransactionType): Filter by transaction type
- `minPrice` (number): Minimum price
- `maxPrice` (number): Maximum price
- `minSize` (number): Minimum size in m²
- `maxSize` (number): Maximum size in m²
- `bedrooms` (number): Number of bedrooms
- `hasParking` (boolean): Has parking
- `hasPool` (boolean): Has pool
- `hasSeaView` (boolean): Has sea view

**Response**: `200 OK`
```json
{
  "properties": [
    {
      "id": "clxxxxx",
      "title": "Appartement La Marsa",
      "propertyType": "APARTMENT",
      "transactionType": "SALE",
      "governorate": "Tunis",
      "delegation": "La Marsa",
      "price": 350000,
      "size": 120,
      "bedrooms": 3,
      "bathrooms": 2,
      "images": ["url1", "url2"],
      "aiValuation": 345000,
      "isPriceFair": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### Get Property

Get details of a single property.

**Endpoint**: `GET /api/properties/:id`

**Response**: `200 OK`
```json
{
  "id": "clxxxxx",
  "title": "Appartement La Marsa",
  "description": "Belle appartement...",
  "propertyType": "APARTMENT",
  "transactionType": "SALE",
  "governorate": "Tunis",
  "delegation": "La Marsa",
  "neighborhood": "La Marsa",
  "address": "Rue example",
  "latitude": 36.8783,
  "longitude": 10.3247,
  "price": 350000,
  "size": 120,
  "bedrooms": 3,
  "bathrooms": 2,
  "floor": 4,
  "hasParking": true,
  "hasElevator": true,
  "hasGarden": false,
  "hasPool": false,
  "hasSeaView": true,
  "images": ["url1", "url2"],
  "virtualTour": "url",
  "status": "ACTIVE",
  "views": 150,
  "aiValuation": 345000,
  "valuationConfidence": 0.85,
  "isPriceFair": true,
  "owner": {
    "id": "clxxxxx",
    "name": "Agent Name",
    "email": "agent@example.com"
  },
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

**Errors**:
- `404`: Property not found

---

### Create Property

Create a new property listing. **Requires authentication**.

**Endpoint**: `POST /api/properties`

**Request Body**:
```json
{
  "title": "Appartement La Marsa",
  "description": "Belle appartement...",
  "propertyType": "APARTMENT",
  "transactionType": "SALE",
  "governorate": "Tunis",
  "delegation": "La Marsa",
  "neighborhood": "La Marsa",
  "latitude": 36.8783,
  "longitude": 10.3247,
  "price": 350000,
  "size": 120,
  "bedrooms": 3,
  "bathrooms": 2,
  "hasParking": true,
  "images": ["url1", "url2"]
}
```

**Response**: `201 Created`
```json
{
  "id": "clxxxxx",
  "title": "Appartement La Marsa",
  // ... full property object
}
```

---

## Valuations Endpoints

### Request Valuation

Request an AI valuation for a property. **Requires authentication and credits**.

**Endpoint**: `POST /api/valuations`

**Request Body**:
```json
{
  "propertyId": "clxxxxx"
}
```

**Response**: `200 OK`
```json
{
  "id": "clxxxxx",
  "propertyId": "clxxxxx",
  "estimatedValue": 345000,
  "confidenceScore": 0.85,
  "minValue": 320000,
  "maxValue": 370000,
  "locationScore": 88,
  "sizeScore": 75,
  "conditionScore": 80,
  "amenitiesScore": 85,
  "comparables": [
    {
      "id": "clxxxxx",
      "price": 340000,
      "size": 115,
      "similarity": 92
    }
  ],
  "aiInsights": "Cette propriété...",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Errors**:
- `401`: Not authenticated
- `403`: Insufficient credits
- `404`: Property not found

---

### Get Valuation

Get details of a valuation. **Requires authentication**.

**Endpoint**: `GET /api/valuations/:id`

**Response**: `200 OK` (same structure as above)

---

## Users Endpoints

### Get Current User

Get the authenticated user's profile.

**Endpoint**: `GET /api/users/me`

**Response**: `200 OK`
```json
{
  "id": "clxxxxx",
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+216 50 123 456",
  "userType": "INVESTOR",
  "subscriptionTier": "INVESTOR_149",
  "valuationCredits": 100,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

### Update Profile

Update the authenticated user's profile.

**Endpoint**: `PUT /api/users/me`

**Request Body**:
```json
{
  "name": "John Updated",
  "phone": "+216 50 999 999"
}
```

**Response**: `200 OK` (updated user object)

---

## Portfolio Endpoints (Investor Only)

### List Portfolio

Get all properties in the investor's portfolio.

**Endpoint**: `GET /api/portfolio`

**Response**: `200 OK`
```json
{
  "portfolio": [
    {
      "id": "clxxxxx",
      "propertyId": "clxxxxx",
      "property": {
        "title": "Appartement La Marsa",
        "governorate": "Tunis"
      },
      "purchasePrice": 330000,
      "purchaseDate": "2023-01-01T00:00:00Z",
      "currentValue": 350000,
      "appreciation": 6.06,
      "monthlyRent": 1500,
      "annualIncome": 18000,
      "grossYield": 5.45,
      "netYield": 4.2,
      "totalReturn": 12.5
    }
  ],
  "summary": {
    "totalValue": 1500000,
    "totalAppreciation": 150000,
    "averageYield": 5.2,
    "propertiesCount": 5
  }
}
```

---

### Add to Portfolio

Add a property to the portfolio.

**Endpoint**: `POST /api/portfolio`

**Request Body**:
```json
{
  "propertyId": "clxxxxx",
  "purchasePrice": 330000,
  "purchaseDate": "2023-01-01",
  "monthlyRent": 1500
}
```

**Response**: `201 Created`

---

## Opportunities Endpoints (Investor Only)

### Get Opportunities

Get investment opportunities detected by AI.

**Endpoint**: `GET /api/opportunities`

**Query Parameters**:
- `minScore` (number, 0-100): Minimum opportunity score
- `maxPrice` (number): Maximum price

**Response**: `200 OK`
```json
{
  "opportunities": [
    {
      "id": "clxxxxx",
      "propertyId": "clxxxxx",
      "property": {
        "title": "Villa Hammamet",
        "price": 500000
      },
      "opportunityScore": 85,
      "discountPercent": 15,
      "estimatedYield": 7.5,
      "reasons": [
        "Prix 15% sous le marché",
        "Zone en développement",
        "Excellent potentiel locatif"
      ],
      "risks": [
        "Travaux nécessaires",
        "Zone touristique saisonnière"
      ],
      "aiRecommendation": "Excellente opportunité...",
      "createdAt": "2024-01-01T00:00:00Z",
      "expiresAt": "2024-02-01T00:00:00Z"
    }
  ]
}
```

---

## Neighborhoods Endpoints

### List Neighborhoods

Get all neighborhoods with scores and data.

**Endpoint**: `GET /api/neighborhoods`

**Query Parameters**:
- `governorate` (string): Filter by governorate

**Response**: `200 OK`
```json
{
  "neighborhoods": [
    {
      "id": "clxxxxx",
      "name": "La Marsa",
      "governorate": "Tunis",
      "overallScore": 92,
      "housingScore": 88,
      "schoolsScore": 95,
      "transportScore": 85,
      "amenitiesScore": 93,
      "lifestyleScore": 96,
      "safetyScore": 90,
      "avgPricePerM2": 3500,
      "rentalYield": 4.2,
      "priceGrowthYTD": 8.5
    }
  ]
}
```

---

### Get Neighborhood

Get detailed information about a neighborhood.

**Endpoint**: `GET /api/neighborhoods/:id`

**Response**: `200 OK`
```json
{
  "id": "clxxxxx",
  "name": "La Marsa",
  "governorate": "Tunis",
  "delegation": "La Marsa",
  "description": "Quartier huppé...",
  "overallScore": 92,
  "scores": {
    "housing": 88,
    "schools": 95,
    "transport": 85,
    "amenities": 93,
    "lifestyle": 96,
    "safety": 90
  },
  "marketData": {
    "avgPricePerM2": 3500,
    "rentalYield": 4.2,
    "daysOnMarket": 45,
    "priceGrowthYTD": 8.5
  },
  "schools": [
    {
      "name": "École Internationale",
      "distance": 2
    }
  ],
  "transportation": [
    {
      "type": "Metro",
      "line": "TGM",
      "distance": 0.5
    }
  ],
  "amenities": [
    {
      "type": "Supermarché",
      "name": "Carrefour",
      "distance": 1
    }
  ],
  "futureProjects": [
    {
      "name": "Extension du TGM",
      "completion": "2025"
    }
  ]
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "details": [...]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions or credits"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Rate Limiting

- **Free tier**: 100 requests/hour
- **Basic tier**: 500 requests/hour
- **Investor tier**: 2000 requests/hour
- **Agency tier**: Unlimited

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Data Types

### PropertyType
- `APARTMENT`
- `HOUSE`
- `VILLA`
- `LAND`
- `COMMERCIAL`
- `OFFICE`

### TransactionType
- `SALE`
- `RENT`
- `BOTH`

### UserType
- `NORMAL`
- `INVESTOR`
- `AGENT`
- `ADMIN`

### SubscriptionTier
- `FREE`
- `BASIC_19`
- `INVESTOR_149`
- `INVESTOR_PRO_299`
- `AGENCY_499`

### PropertyStatus
- `ACTIVE`
- `PENDING`
- `SOLD`
- `RENTED`
- `INACTIVE`
