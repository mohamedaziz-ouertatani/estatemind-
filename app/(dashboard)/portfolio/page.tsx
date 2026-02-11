import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserWithBypass } from '@/lib/auth-bypass'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  TrendingUp, 
  TrendingDown,
  Building2, 
  DollarSign,
  Percent,
  Download,
  Calendar
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'

async function getPortfolioData(userId: string) {
  const portfolioItems = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          governorate: true,
          delegation: true,
          propertyType: true,
          images: true,
          size: true,
        }
      }
    },
    orderBy: { totalReturn: 'desc' }
  })

  const totalValue = portfolioItems.reduce((sum, item) => sum + item.currentValue, 0)
  const totalInvested = portfolioItems.reduce((sum, item) => sum + item.purchasePrice, 0)
  const totalReturn = totalValue - totalInvested
  const returnPercentage = totalInvested > 0 ? ((totalReturn / totalInvested) * 100) : 0

  const totalAnnualIncome = portfolioItems.reduce((sum, item) => sum + (item.annualIncome || 0), 0)
  const avgGrossYield = portfolioItems.length > 0 
    ? portfolioItems.reduce((sum, item) => sum + (item.grossYield || 0), 0) / portfolioItems.length 
    : 0

  return {
    portfolioItems,
    summary: {
      totalValue,
      totalInvested,
      totalReturn,
      returnPercentage,
      totalAnnualIncome,
      avgGrossYield,
      totalProperties: portfolioItems.length,
      ownedProperties: portfolioItems.filter(p => p.status === 'OWNED').length,
    },
    bestPerformers: portfolioItems.slice(0, 3),
    worstPerformers: portfolioItems.slice(-3).reverse()
  }
}

export default async function PortfolioPage() {
  const user = await getCurrentUserWithBypass()

  if (!user) {
    redirect('/login')
  }

  if ((user.userType as string) !== 'INVESTOR') {
    redirect('/dashboard')
  }

  const data = await getPortfolioData(user.id)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              Mon Portfolio
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Suivez la performance de vos investissements immobiliers
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valeur Totale
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(data.summary.totalValue)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {data.summary.totalProperties} propriétés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Investi
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(data.summary.totalInvested)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Capital initial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Plus-value
            </CardTitle>
            {data.summary.totalReturn >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.summary.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPrice(Math.abs(data.summary.totalReturn))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {data.summary.totalReturn >= 0 ? 'Gain' : 'Perte'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Retour %
            </CardTitle>
            <Percent className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.summary.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.summary.returnPercentage >= 0 ? '+' : ''}{data.summary.returnPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              ROI total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenus Locatifs</CardTitle>
            <CardDescription>Performance annuelle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Revenus annuels</span>
              <span className="text-xl font-bold text-green-600">
                {formatPrice(data.summary.totalAnnualIncome)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rendement brut moyen</span>
              <span className="text-xl font-bold text-blue-600">
                {data.summary.avgGrossYield.toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut Portfolio</CardTitle>
            <CardDescription>État des propriétés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Propriétés détenues</span>
              <Badge variant="default">{data.summary.ownedProperties}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total propriétés</span>
              <Badge variant="secondary">{data.summary.totalProperties}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best Performers */}
      {data.bestPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Meilleures Performances</CardTitle>
            <CardDescription>Top 3 propriétés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.bestPerformers.map((item, index) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 font-bold">
                      {index + 1}
                    </div>
                    <div className="w-16 h-16 relative rounded overflow-hidden">
                      <img 
                        src={item.property.images[0] || '/placeholder-property.jpg'} 
                        alt={item.property.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium">{item.property.title}</h4>
                      <p className="text-sm text-gray-500">
                        {item.property.delegation}, {item.property.governorate}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        Acheté: {new Date(item.purchaseDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-lg">
                      +{item.totalReturn.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(item.purchasePrice)} → {formatPrice(item.currentValue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Plus-value: {formatPrice(item.currentValue - item.purchasePrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Worst Performers */}
      {data.worstPerformers.length > 0 && data.worstPerformers[0].totalReturn < 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Points d&apos;Attention</CardTitle>
            <CardDescription>Propriétés à surveiller</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.worstPerformers.filter(p => p.totalReturn < 0).map((item, index) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-600 font-bold">
                      !
                    </div>
                    <div className="w-16 h-16 relative rounded overflow-hidden">
                      <img 
                        src={item.property.images[0] || '/placeholder-property.jpg'} 
                        alt={item.property.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <h4 className="font-medium">{item.property.title}</h4>
                      <p className="text-sm text-gray-500">
                        {item.property.delegation}, {item.property.governorate}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        Acheté: {new Date(item.purchaseDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600 text-lg">
                      {item.totalReturn.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatPrice(item.purchasePrice)} → {formatPrice(item.currentValue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Moins-value: {formatPrice(Math.abs(item.currentValue - item.purchasePrice))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Properties List */}
      <Card>
        <CardHeader>
          <CardTitle>Toutes les Propriétés</CardTitle>
          <CardDescription>Vue détaillée de votre portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          {data.portfolioItems.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune propriété dans votre portfolio
              </h3>
              <p className="text-gray-500 mb-4">
                Commencez à ajouter des propriétés pour suivre leurs performances
              </p>
              <Link href="/properties/add">
                <Button>
                  Ajouter une propriété
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data.portfolioItems.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-20 h-20 relative rounded overflow-hidden flex-shrink-0">
                      <img 
                        src={item.property.images[0] || '/placeholder-property.jpg'} 
                        alt={item.property.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{item.property.title}</h4>
                        <Badge variant={item.status === 'OWNED' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        {item.property.delegation}, {item.property.governorate} • {item.property.size}m²
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Acheté: {new Date(item.purchaseDate).toLocaleDateString('fr-FR')}</span>
                        {item.monthlyRent && (
                          <span>Loyer: {formatPrice(item.monthlyRent)}/mois</span>
                        )}
                        {item.grossYield && (
                          <span>Rendement: {item.grossYield.toFixed(2)}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className={`text-lg font-bold ${item.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.totalReturn >= 0 ? '+' : ''}{item.totalReturn.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatPrice(item.currentValue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Investi: {formatPrice(item.purchasePrice)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
