"use client"

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScoreCard, SimpleScoreCard } from '@/components/neighborhood/ScoreCard'
import { PropertyCard } from '@/components/property/PropertyCard'
import { formatPrice } from '@/lib/utils'
import { Neighborhood, Property } from '@prisma/client'
import {
  MapPin, Home, GraduationCap, Bus, ShoppingBag, Coffee, Shield,
  TrendingUp, TrendingDown, Calendar, ChevronRight, Award, Eye, Rocket
} from 'lucide-react'

interface NeighborhoodDetailClientProps {
  neighborhood: Neighborhood
  properties: Property[]
}

export function NeighborhoodDetailClient({ neighborhood, properties }: NeighborhoodDetailClientProps) {
  const schools = (neighborhood.schools as any[]) || []
  const transportation = (neighborhood.transportation as any) || {}
  const amenities = (neighborhood.amenities as any[]) || []
  const futureProjects = (neighborhood.futureProjects as any[]) || []

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-blue-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-orange-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-blue-600">Accueil</Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/neighborhoods" className="hover:text-blue-600">Quartiers</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900">{neighborhood.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <span className="text-gray-600">{neighborhood.delegation}, {neighborhood.governorate}</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{neighborhood.name}</h1>
          
          {/* Overall Score */}
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - neighborhood.overallScore / 100)}`}
                  className={getScoreColor(neighborhood.overallScore).replace('text-', 'text-')}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${getScoreColor(neighborhood.overallScore)}`}>
                  {neighborhood.overallScore}
                </span>
                <span className="text-xs text-gray-600">Score Global</span>
              </div>
            </div>
            <div className="flex-1">
              <Badge className="mb-2" variant="outline">
                {neighborhood.overallScore >= 80 ? 'Excellent' : 
                 neighborhood.overallScore >= 60 ? 'Bon' : 
                 neighborhood.overallScore >= 40 ? 'Moyen' : 'À améliorer'}
              </Badge>
              <p className="text-gray-600">
                Score basé sur 6 critères: logement, écoles, transport, commodités, style de vie et sécurité
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>À propos de {neighborhood.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {neighborhood.description}
                </p>
              </CardContent>
            </Card>

            {/* Score Breakdown */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Scores Détaillés</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ScoreCard
                  title="Logement"
                  score={neighborhood.housingScore}
                  icon={Home}
                  description="Qualité et disponibilité"
                />
                <ScoreCard
                  title="Écoles"
                  score={neighborhood.schoolsScore}
                  icon={GraduationCap}
                  description="Éducation et proximité"
                />
                <ScoreCard
                  title="Transport"
                  score={neighborhood.transportScore}
                  icon={Bus}
                  description="Accessibilité et mobilité"
                />
                <ScoreCard
                  title="Commodités"
                  score={neighborhood.amenitiesScore}
                  icon={ShoppingBag}
                  description="Commerces et services"
                />
                <ScoreCard
                  title="Style de vie"
                  score={neighborhood.lifestyleScore}
                  icon={Coffee}
                  description="Loisirs et culture"
                />
                <ScoreCard
                  title="Sécurité"
                  score={neighborhood.safetyScore}
                  icon={Shield}
                  description="Tranquillité et sûreté"
                />
              </div>
            </div>

            {/* Market Statistics */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Statistiques du Marché</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={<TrendingUp className="w-5 h-5" />}
                  label="Prix moyen/m²"
                  value={formatPrice(neighborhood.avgPricePerM2)}
                  color="text-blue-600"
                />
                <StatCard
                  icon={<Award className="w-5 h-5" />}
                  label="Rendement locatif"
                  value={`${neighborhood.rentalYield.toFixed(1)}%`}
                  color="text-green-600"
                />
                <StatCard
                  icon={<Calendar className="w-5 h-5" />}
                  label="Jours sur marché"
                  value={`${neighborhood.daysOnMarket}j`}
                  color="text-gray-600"
                />
                <StatCard
                  icon={neighborhood.priceGrowthYTD >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  label="Croissance YTD"
                  value={`${neighborhood.priceGrowthYTD > 0 ? '+' : ''}${neighborhood.priceGrowthYTD.toFixed(1)}%`}
                  color={neighborhood.priceGrowthYTD >= 0 ? 'text-green-600' : 'text-red-600'}
                />
              </div>
            </div>

            {/* Schools */}
            {schools.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Écoles et Établissements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {schools.map((school: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{school.name}</p>
                          <p className="text-sm text-gray-600">{school.type}</p>
                        </div>
                        <Badge variant="outline">{school.distance} km</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transportation */}
            {(transportation.metro?.length > 0 || transportation.bus?.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bus className="w-5 h-5" />
                    Transport et Accessibilité
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {transportation.metro?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Métro</h4>
                      <div className="flex flex-wrap gap-2">
                        {transportation.metro.map((line: string, idx: number) => (
                          <Badge key={idx} variant="outline">{line}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {transportation.bus?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Lignes de Bus</h4>
                      <div className="flex flex-wrap gap-2">
                        {transportation.bus.map((line: string, idx: number) => (
                          <Badge key={idx} variant="outline">{line}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Commodités et Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenities.map((amenity: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Future Outlook */}
            {(neighborhood.gentrificationScore || futureProjects.length > 0) && (
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-purple-600" />
                    Perspectives d&apos;Avenir
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {neighborhood.gentrificationScore && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Score de Gentrification</span>
                        <span className="text-2xl font-bold text-purple-600">
                          {neighborhood.gentrificationScore}/100
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Potentiel de développement et d&apos;amélioration du quartier
                      </p>
                    </div>
                  )}
                  {futureProjects.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="font-semibold mb-3">Projets Futurs</h4>
                      <ul className="space-y-2">
                        {futureProjects.map((project: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5" />
                            <span>{project}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Properties in Neighborhood */}
            {properties.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">Propriétés dans ce Quartier</h2>
                  <Link href={`/properties?neighborhood=${encodeURIComponent(neighborhood.name)}`}>
                    <Button variant="outline" className="gap-2">
                      Voir Tout
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {properties.map(property => (
                    <PropertyCard
                      key={property.id}
                      property={{
                        id: property.id,
                        title: property.title,
                        price: property.price,
                        size: property.size,
                        governorate: property.governorate,
                        delegation: property.delegation,
                        propertyType: property.propertyType,
                        transactionType: property.transactionType,
                        bedrooms: property.bedrooms,
                        bathrooms: property.bathrooms,
                        images: property.images,
                        hasParking: property.hasParking,
                        hasPool: property.hasPool,
                        hasGarden: property.hasGarden,
                        hasSeaView: property.hasSeaView,
                        aiValuation: property.aiValuation,
                        views: property.views,
                        listingDate: property.listingDate
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Résumé Rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <SimpleScoreCard
                  title="Logement"
                  score={neighborhood.housingScore}
                  icon={Home}
                  compact
                />
                <SimpleScoreCard
                  title="Écoles"
                  score={neighborhood.schoolsScore}
                  icon={GraduationCap}
                  compact
                />
                <SimpleScoreCard
                  title="Transport"
                  score={neighborhood.transportScore}
                  icon={Bus}
                  compact
                />
                <SimpleScoreCard
                  title="Commodités"
                  score={neighborhood.amenitiesScore}
                  icon={ShoppingBag}
                  compact
                />
                <SimpleScoreCard
                  title="Style de vie"
                  score={neighborhood.lifestyleScore}
                  icon={Coffee}
                  compact
                />
                <SimpleScoreCard
                  title="Sécurité"
                  score={neighborhood.safetyScore}
                  icon={Shield}
                  compact
                />
              </CardContent>
            </Card>

            {/* Map Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Carte du Quartier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Carte à venir</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compare Button */}
            <Button variant="outline" className="w-full" disabled>
              Comparer avec d&apos;autres quartiers
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <div className={`${color} mb-2`}>{icon}</div>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          <p className="text-xs text-gray-600 mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
