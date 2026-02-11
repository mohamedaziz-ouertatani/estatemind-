import { Property, PropertyType, TransactionType, PropertyStatus } from '@prisma/client'

export type PropertyWithOwner = Property & {
  owner: {
    id: string
    name: string | null
    email: string
  }
}

export type PropertySearchParams = {
  governorate?: string
  propertyType?: PropertyType
  transactionType?: TransactionType
  minPrice?: number
  maxPrice?: number
  minSize?: number
  maxSize?: number
  bedrooms?: number
  bathrooms?: number
  hasParking?: boolean
  hasElevator?: boolean
  hasGarden?: boolean
  hasPool?: boolean
  hasSeaView?: boolean
  search?: string
}

export type PropertyFormData = {
  title: string
  description: string
  propertyType: PropertyType
  transactionType: TransactionType
  governorate: string
  delegation: string
  neighborhood?: string
  address?: string
  latitude: number
  longitude: number
  price: number
  size: number
  bedrooms?: number
  bathrooms?: number
  floor?: number
  hasParking: boolean
  hasElevator: boolean
  hasGarden: boolean
  hasPool: boolean
  hasSeaView: boolean
  images: string[]
  virtualTour?: string
}

export interface PropertySearchResult {
  id: string
  title: string
  price: number
  size: number
  governorate: string
  delegation: string
  propertyType: string
  transactionType: string
  bedrooms?: number | null
  bathrooms?: number | null
  images?: string[]
  hasParking?: boolean
  hasPool?: boolean
  hasGarden?: boolean
  hasSeaView?: boolean
  hasElevator?: boolean
  aiValuation?: number | null
  isPriceFair?: boolean | null
  views?: number
  listingDate?: Date | string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface SearchResponse {
  properties: PropertySearchResult[]
  pagination: PaginationInfo
}

