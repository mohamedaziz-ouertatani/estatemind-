import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Property } from "@prisma/client"
import { formatPrice, formatArea, getPropertyTypeLabel, getTransactionTypeLabel } from "@/lib/utils"
import { BedDouble, Bath, Car, TreePine, Waves, MapPin } from "lucide-react"

interface PropertyCardProps {
  property: Partial<Property> & {
    id: string
    title: string
    price: number
    size: number
    governorate: string
    delegation: string
    propertyType: string
    transactionType: string
  }
}

export function PropertyCard({ property }: PropertyCardProps) {
  const imageUrl = property.images?.[0] || '/placeholder-property.jpg'
  const pricePerM2 = Math.round(property.price / property.size)
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/properties/${property.id}`}>
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            className="object-cover"
          />
          {property.isPriceFair && (
            <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
              Prix Juste
            </div>
          )}
          <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-semibold">
            {getTransactionTypeLabel(property.transactionType)}
          </div>
        </div>
      </Link>
      
      <CardHeader>
        <CardTitle className="text-lg">
          <Link href={`/properties/${property.id}`} className="hover:text-blue-600">
            {property.title}
          </Link>
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {property.delegation}, {property.governorate}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-blue-600">
              {formatPrice(property.price)}
            </span>
            <span className="text-sm text-gray-600">
              {formatPrice(pricePerM2)}/m²
            </span>
          </div>
          
          <div className="flex gap-4 text-sm text-gray-600">
            <span>{formatArea(property.size)}</span>
            <span>•</span>
            <span>{getPropertyTypeLabel(property.propertyType)}</span>
          </div>
          
          <div className="flex gap-3 text-sm text-gray-600">
            {property.bedrooms && (
              <span className="flex items-center gap-1">
                <BedDouble className="w-4 h-4" />
                {property.bedrooms}
              </span>
            )}
            {property.bathrooms && (
              <span className="flex items-center gap-1">
                <Bath className="w-4 h-4" />
                {property.bathrooms}
              </span>
            )}
            {property.hasParking && (
              <span className="flex items-center gap-1">
                <Car className="w-4 h-4" />
              </span>
            )}
            {property.hasGarden && (
              <span className="flex items-center gap-1">
                <TreePine className="w-4 h-4" />
              </span>
            )}
            {property.hasSeaView && (
              <span className="flex items-center gap-1">
                <Waves className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Link href={`/properties/${property.id}`} className="w-full">
          <Button className="w-full">Voir Détails</Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
