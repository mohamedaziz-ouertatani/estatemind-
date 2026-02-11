import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserWithBypass } from '@/lib/auth-bypass'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PropertyCard } from '@/components/property/PropertyCard'
import { 
  Heart, 
  TrendingUp, 
  Home, 
  BarChart3, 
  PlusCircle, 
  Eye,
  CreditCard,
  ArrowRight,
  Building2,
  DollarSign
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'

async function getDashboardData(userId: string, userType: string) {
  // Get saved properties (first 6 for preview)
  const savedProperties = await prisma.savedProperty.findMany({
    where: { userId },
    take: 6,
    orderBy: { createdAt: 'desc' },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          price: true,
          size: true,
          governorate: true,
          delegation: true,
          propertyType: true,
          transactionType: true,
          images: true,
          bedrooms: true,
          bathrooms: true,
          hasParking: true,
          hasPool: true,
          hasGarden: true,
          hasSeaView: true,
          hasElevator: true,
          aiValuation: true,
          isPriceFair: true,
          views: true,
          listingDate: true,
        }
      }
    }
  })

  const savedPropertiesCount = await prisma.savedProperty.count({
    where: { userId }
  })

  // Get recent valuations
  const recentValuations = await prisma.valuation.findMany({
    where: { userId },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          governorate: true,
          delegation: true,
          images: true,
        }
      }
    }
  })

  let portfolioData = null
  if ((userType as string) === 'INVESTOR') {
    // Get portfolio data for investors
    const portfolioItems = await prisma.portfolio.findMany({
      where: { 
        userId,
        status: 'OWNED'
      },
      include: {
        property: {
          select: {
            title: true,
            governorate: true,
          }
        }
      }
    })

    const totalValue = portfolioItems.reduce((sum, item) => sum + item.currentValue, 0)
    const totalInvested = portfolioItems.reduce((sum, item) => sum + item.purchasePrice, 0)
    const totalReturn = totalValue - totalInvested
    const avgROI = portfolioItems.length > 0 
      ? portfolioItems.reduce((sum, item) => sum + item.totalReturn, 0) / portfolioItems.length 
      : 0

    portfolioData = {
      totalProperties: portfolioItems.length,
      totalValue,
      totalInvested,
      totalReturn,
      avgROI,
      recentPerformers: portfolioItems
        .sort((a, b) => b.totalReturn - a.totalReturn)
        .slice(0, 3)
    }
  }

  return {
    savedProperties: savedProperties.map(sp => sp.property),
    savedPropertiesCount,
    recentValuations,
    portfolioData
  }
}

export default async function DashboardPage() {
  const user = await getCurrentUserWithBypass()

  if (!user) {
    redirect('/login')
  }

  const data = await getDashboardData(user.id, user.userType)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenue, {user.name || user.email}
        </h1>
        <p className="text-gray-600 mt-2">
          {(user.userType as string) === 'INVESTOR' 
            ? 'Gérez votre portfolio et découvrez de nouvelles opportunités'
            : 'Découvrez et sauvegardez vos propriétés préférées'}
        </p>
      </div>

      {/* NORMAL User Dashboard */}
      {(user.userType as string) === 'NORMAL' && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Propriétés Sauvegardées
                </CardTitle>
                <Heart className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.savedPropertiesCount}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Vos favoris
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Crédits Valorisation
                </CardTitle>
                <CreditCard className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.valuationCredits}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Crédits restants
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Valorisations
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.recentValuations.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Effectuées
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Saved Properties */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Propriétés Sauvegardées</CardTitle>
                  <CardDescription>Vos propriétés préférées</CardDescription>
                </div>
                <Link href="/saved">
                  <Button variant="outline" size="sm">
                    Voir tout <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data.savedProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.savedProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucune propriété sauvegardée
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Commencez à sauvegarder des propriétés pour les retrouver ici
                  </p>
                  <Link href="/properties">
                    <Button>
                      Parcourir les propriétés
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Valuations */}
          {data.recentValuations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Valorisations Récentes</CardTitle>
                <CardDescription>Vos dernières estimations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentValuations.map((valuation) => (
                    <div 
                      key={valuation.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 relative rounded overflow-hidden">
                          <img 
                            src={valuation.property.images[0] || '/placeholder-property.jpg'} 
                            alt={valuation.property.title}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div>
                          <h4 className="font-medium">{valuation.property.title}</h4>
                          <p className="text-sm text-gray-500">
                            {valuation.property.delegation}, {valuation.property.governorate}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">
                          {formatPrice(valuation.estimatedValue)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Confiance: {Math.round(valuation.confidenceScore * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* INVESTOR User Dashboard */}
      {(user.userType as string) === 'INVESTOR' && data.portfolioData && (
        <>
          {/* Portfolio Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Propriétés
                </CardTitle>
                <Building2 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.portfolioData.totalProperties}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Dans votre portfolio
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Valeur Totale
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(data.portfolioData.totalValue)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Valeur actuelle
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Retour Total
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(data.portfolioData.totalReturn)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Plus-value
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  ROI Moyen
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.portfolioData.avgROI.toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Retour sur investissement
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/properties/add">
                  <Button className="w-full" variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter Propriété
                  </Button>
                </Link>
                <Link href="/valuation">
                  <Button className="w-full" variant="outline">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Faire une Valorisation
                  </Button>
                </Link>
                <Link href="/portfolio">
                  <Button className="w-full" variant="outline">
                    <Eye className="mr-2 h-4 w-4" />
                    Voir Portfolio
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Valuations */}
          {data.recentValuations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Valorisations Récentes</CardTitle>
                <CardDescription>Vos dernières estimations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.recentValuations.map((valuation) => (
                    <div 
                      key={valuation.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 relative rounded overflow-hidden">
                          <img 
                            src={valuation.property.images[0] || '/placeholder-property.jpg'} 
                            alt={valuation.property.title}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <div>
                          <h4 className="font-medium">{valuation.property.title}</h4>
                          <p className="text-sm text-gray-500">
                            {valuation.property.delegation}, {valuation.property.governorate}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">
                          {formatPrice(valuation.estimatedValue)}
                        </p>
                        <Badge variant="secondary">
                          {Math.round(valuation.confidenceScore * 100)}% confiance
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Best Performers */}
          {data.portfolioData.recentPerformers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Meilleures Performances</CardTitle>
                <CardDescription>Top 3 de votre portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.portfolioData.recentPerformers.map((item, index) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{item.property.title}</h4>
                          <p className="text-sm text-gray-500">
                            {item.property.governorate}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">
                          +{item.totalReturn.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatPrice(item.currentValue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
