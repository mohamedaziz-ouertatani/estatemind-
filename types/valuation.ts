import { Valuation } from '@prisma/client'

export type ValuationRequest = {
  propertyId: string
  userId: string
}

export type ValuationResult = {
  estimatedValue: number
  confidenceScore: number
  minValue: number
  maxValue: number
  locationScore: number
  sizeScore: number
  conditionScore: number
  amenitiesScore: number
  comparables: ComparableProperty[]
  aiInsights: string
}

export type ComparableProperty = {
  id: string
  title: string
  price: number
  size: number
  pricePerM2: number
  distance: number // in km
  similarity: number // 0-100
}

export type ValuationWithProperty = Valuation & {
  property: {
    id: string
    title: string
    governorate: string
    delegation: string
  }
}
