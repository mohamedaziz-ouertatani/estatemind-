"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ImageGallery } from '@/components/property/ImageGallery'
import { ValuationDisplay } from '@/components/valuation/ValuationDisplay'
import { PropertyCard } from '@/components/property/PropertyCard'
import { 
  MapPin, BedDouble, Bath, Ruler, Building2, Car, TreePine, 
  Waves, Upload, Heart, Share2, ChevronRight, Phone, Mail,
  Sparkles, Home, Tag, Calendar, Eye, Copy, Check
} from 'lucide-react'
import { formatPrice, formatArea, getPropertyTypeLabel, getTransactionTypeLabel, formatDate } from '@/lib/utils'
import { Property, Neighborhood } from '@prisma/client'
import { ValuationResult } from '@/types/valuation'

interface PropertyDetailClientProps {
  property: Property & {
    owner: {
      id: string
      name: string | null
      email: string
      phone: string | null
    }
    valuations: any[]
  }
  similarProperties: Property[]
  neighborhood: Neighborhood | null
}

export function PropertyDetailClient({ property, similarProperties, neighborhood }: PropertyDetailClientProps) {
  const router = useRouter()
  const [isSaved, setIsSaved] = useState(false)
  const [isLoadingValuation, setIsLoadingValuation] = useState(false)
  const [valuation, setValuation] = useState<ValuationResult | null>(
    property.valuations[0] ? {
      estimatedValue: property.valuations[0].estimatedValue,
      confidenceScore: property.valuations[0].confidenceScore,
      minValue: property.valuations[0].minValue,
      maxValue: property.valuations[0].maxValue,
      locationScore: property.valuations[0].locationScore,
      sizeScore: property.valuations[0].sizeScore,
      conditionScore: property.valuations[0].conditionScore,
      amenitiesScore: property.valuations[0].amenitiesScore,
      comparables: property.valuations[0].comparables,
      aiInsights: property.valuations[0].aiInsights
    } : null
  )
  const [copied, setCopied] = useState(false)

  const handleGetValuation = async () => {
    setIsLoadingValuation(true)
    try {
      const response = await fetch('/api/valuations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ propertyId: property.id })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.message || 'Erreur lors de l\'évaluation')
        return
      }

      const data = await response.json()
      setValuation(data.valuation)
    } catch (error) {
      console.error('Valuation error:', error)
      alert('Erreur lors de l\'évaluation')
    } finally {
      setIsLoadingValuation(false)
    }
  }

  const handleSave = async () => {
    setIsSaved(!isSaved)
    // TODO: Implement save functionality
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const pricePerM2 = Math.round(property.price / property.size)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-blue-600">Accueil</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/properties" className="hover:text-blue-600">Propriétés</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 truncate">{property.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Actions */}
        <div className="flex justify-end gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="gap-2"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            {isSaved ? 'Enregistré' : 'Enregistrer'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Copié!' : 'Partager'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <ImageGallery images={property.images} title={property.title} />

            {/* Title and Price */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge className="bg-blue-600">{getTransactionTypeLabel(property.transactionType)}</Badge>
                <Badge variant="outline">{getPropertyTypeLabel(property.propertyType)}</Badge>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{property.title}</h1>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin className="w-5 h-5" />
                <span>{property.address || property.neighborhood}, {property.delegation}, {property.governorate}</span>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-blue-600">
                  {formatPrice(property.price)}
                </span>
                <span className="text-xl text-gray-500">
                  {formatPrice(pricePerM2)}/m²
                </span>
              </div>
            </div>

            {/* Key Details */}
            <Card>
              <CardHeader>
                <CardTitle>Caractéristiques Principales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <DetailItem icon={<Ruler />} label="Surface" value={formatArea(property.size)} />
                  {property.bedrooms && (
                    <DetailItem icon={<BedDouble />} label="Chambres" value={property.bedrooms.toString()} />
                  )}
                  {property.bathrooms && (
                    <DetailItem icon={<Bath />} label="Salles de bain" value={property.bathrooms.toString()} />
                  )}
                  {property.floor !== null && (
                    <DetailItem icon={<Building2 />} label="Étage" value={property.floor.toString()} />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Équipements et Commodités</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.hasParking && <FeatureItem icon={<Car />} label="Parking" />}
                  {property.hasElevator && <FeatureItem icon={<Upload />} label="Ascenseur" />}
                  {property.hasGarden && <FeatureItem icon={<TreePine />} label="Jardin" />}
                  {property.hasPool && <FeatureItem icon={<Waves />} label="Piscine" />}
                  {property.hasSeaView && <FeatureItem icon={<Waves />} label="Vue Mer" />}
                  {!property.hasParking && !property.hasElevator && !property.hasGarden && !property.hasPool && !property.hasSeaView && (
                    <p className="text-gray-500 col-span-full">Aucun équipement spécial</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {property.description}
                </p>
              </CardContent>
            </Card>

            {/* AI Valuation */}
            {valuation ? (
              <ValuationDisplay valuation={valuation} listingPrice={property.price} />
            ) : (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    Obtenir une Évaluation IA
                  </CardTitle>
                  <CardDescription>
                    Obtenez une estimation précise de la valeur de cette propriété basée sur l&apos;IA
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGetValuation}
                    disabled={isLoadingValuation}
                    className="w-full gap-2"
                    size="lg"
                  >
                    <Sparkles className="w-5 h-5" />
                    {isLoadingValuation ? 'Évaluation en cours...' : 'Obtenir l&apos;Évaluation'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Neighborhood Insights */}
            {neighborhood && (
              <Card>
                <CardHeader>
                  <CardTitle>Aperçu du Quartier</CardTitle>
                  <CardDescription>{neighborhood.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-600">{neighborhood.overallScore}</p>
                      <p className="text-sm text-gray-600">Score Global</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{formatPrice(neighborhood.avgPricePerM2)}</p>
                      <p className="text-sm text-gray-600">Prix Moyen/m²</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-900">{neighborhood.rentalYield.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Rendement Locatif</p>
                    </div>
                  </div>
                  <Link href={`/neighborhoods/${neighborhood.id}`}>
                    <Button variant="outline" className="w-full gap-2">
                      Voir les Détails du Quartier
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Location Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Emplacement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-2" />
                    <p>Carte à venir</p>
                    <p className="text-sm">Lat: {property.latitude}, Lng: {property.longitude}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Similar Properties */}
            {similarProperties.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Propriétés Similaires</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {similarProperties.map(prop => (
                    <PropertyCard key={prop.id} property={{
                      id: prop.id,
                      title: prop.title,
                      price: prop.price,
                      size: prop.size,
                      governorate: prop.governorate,
                      delegation: prop.delegation,
                      propertyType: prop.propertyType,
                      transactionType: prop.transactionType,
                      bedrooms: prop.bedrooms,
                      bathrooms: prop.bathrooms,
                      images: prop.images,
                      hasParking: prop.hasParking,
                      hasPool: prop.hasPool,
                      hasGarden: prop.hasGarden,
                      hasSeaView: prop.hasSeaView,
                      aiValuation: prop.aiValuation,
                      views: prop.views,
                      listingDate: prop.listingDate
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Seller */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Contacter le Vendeur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-semibold text-lg">{property.owner.name || 'Vendeur'}</p>
                </div>
                <Separator />
                <div className="space-y-3">
                  <a href={`mailto:${property.owner.email}`}>
                    <Button variant="outline" className="w-full gap-2">
                      <Mail className="w-4 h-4" />
                      Envoyer un Email
                    </Button>
                  </a>
                  {property.owner.phone && (
                    <a href={`tel:${property.owner.phone}`}>
                      <Button className="w-full gap-2">
                        <Phone className="w-4 h-4" />
                        Appeler
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    Type
                  </span>
                  <span className="font-semibold">{getPropertyTypeLabel(property.propertyType)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Transaction
                  </span>
                  <span className="font-semibold">{getTransactionTypeLabel(property.transactionType)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date d&apos;annonce
                  </span>
                  <span className="font-semibold">{formatDate(property.listingDate)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Vues
                  </span>
                  <span className="font-semibold">{property.views}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

interface DetailItemProps {
  icon: React.ReactNode
  label: string
  value: string
}

function DetailItem({ icon, label, value }: DetailItemProps) {
  return (
    <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
      <div className="text-blue-600 mb-2">{icon}</div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

interface FeatureItemProps {
  icon: React.ReactNode
  label: string
}

function FeatureItem({ icon, label }: FeatureItemProps) {
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
      <div className="text-blue-600">{icon}</div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
