"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatPrice, formatArea, getPropertyTypeLabel, getTransactionTypeLabel, formatDate } from "@/lib/utils"
import { BedDouble, Bath, Car, TreePine, Waves, MapPin, Heart, Eye, Building2, Droplet } from "lucide-react"
import { useState } from "react"
import { PropertySearchResult } from "@/types/property"

interface PropertyCardProps {
  property: PropertySearchResult
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [isSaved, setIsSaved] = useState(false)
  const imageUrl = property.images?.[0] || '/placeholder-property.jpg'
  const pricePerM2 = Math.round(property.price / property.size)
  
  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsSaved(!isSaved)
  }

  const getValuationBadge = () => {
    if (!property.aiValuation || !property.price) return null
    
    const diff = ((property.price - property.aiValuation) / property.aiValuation) * 100
    
    if (Math.abs(diff) <= 5) {
      return (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md">
          Prix Juste
        </div>
      )
    } else if (diff < -5) {
      return (
        <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md">
          Bonne Affaire
        </div>
      )
    } else if (diff > 5) {
      return (
        <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md">
          Prix Élevé
        </div>
      )
    }
    return null
  }
  
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
      <Link href={`/properties/${property.id}`}>
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
          
          {/* Valuation Badge */}
          {getValuationBadge()}
          
          {/* Transaction Type Badge */}
          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-semibold shadow-md">
            {getTransactionTypeLabel(property.transactionType)}
          </div>

          {/* Property Type Badge */}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-md text-xs font-medium">
            {getPropertyTypeLabel(property.propertyType)}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
          >
            <Heart 
              className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>
        </div>
      </Link>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-2">
          <Link href={`/properties/${property.id}`} className="hover:text-blue-600 transition-colors">
            {property.title}
          </Link>
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{property.delegation}, {property.governorate}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Price */}
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold text-blue-600">
            {formatPrice(property.price)}
          </span>
          <span className="text-sm text-gray-500">
            {formatPrice(pricePerM2)}/m²
          </span>
        </div>
        
        {/* Size */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="w-4 h-4" />
          <span>{formatArea(property.size)}</span>
        </div>
        
        {/* Rooms and Features */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          {property.bedrooms && property.bedrooms > 0 && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-4 h-4" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms && property.bathrooms > 0 && (
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              {property.bathrooms}
            </span>
          )}
          {property.hasParking && (
            <span className="flex items-center gap-1" title="Parking">
              <Car className="w-4 h-4" />
            </span>
          )}
          {property.hasPool && (
            <span className="flex items-center gap-1" title="Piscine">
              <Droplet className="w-4 h-4" />
            </span>
          )}
          {property.hasGarden && (
            <span className="flex items-center gap-1" title="Jardin">
              <TreePine className="w-4 h-4" />
            </span>
          )}
          {property.hasSeaView && (
            <span className="flex items-center gap-1" title="Vue mer">
              <Waves className="w-4 h-4" />
            </span>
          )}
        </div>

        {/* Views and Date */}
        <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
          {property.views !== undefined && (
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {property.views} vues
            </span>
          )}
          {property.listingDate && (
            <span>{formatDate(property.listingDate)}</span>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Link href={`/properties/${property.id}`} className="w-full">
          <Button className="w-full group-hover:bg-blue-700 transition-colors">
            Voir Détails
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
