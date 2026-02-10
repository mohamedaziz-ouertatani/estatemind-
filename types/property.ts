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
