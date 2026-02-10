import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format price in TND (Tunisian Dinar)
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

// Format area in square meters
export function formatArea(area: number): string {
  return `${area.toLocaleString('fr-TN')} m²`
}

// Calculate price per square meter
export function calculatePricePerM2(price: number, size: number): number {
  return Math.round(price / size)
}

// Format date in Tunisia format
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-TN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Validate Tunisian phone number
export function validateTunisianPhone(phone: string): boolean {
  // Tunisia phone numbers: +216 XX XXX XXX or XX XXX XXX
  const regex = /^(\+216)?[2-9]\d{7}$/
  return regex.test(phone.replace(/\s/g, ''))
}

// Get property type label
export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    APARTMENT: 'Appartement',
    HOUSE: 'Maison',
    VILLA: 'Villa',
    LAND: 'Terrain',
    COMMERCIAL: 'Local Commercial',
    OFFICE: 'Bureau'
  }
  return labels[type] || type
}

// Get transaction type label
export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SALE: 'Vente',
    RENT: 'Location',
    BOTH: 'Vente/Location'
  }
  return labels[type] || type
}
