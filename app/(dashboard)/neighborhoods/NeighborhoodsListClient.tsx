"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { Neighborhood } from '@prisma/client'
import { Search, TrendingUp, MapPin, Home, GraduationCap, Bus, ChevronRight } from 'lucide-react'

interface NeighborhoodsListClientProps {
  neighborhoods: Neighborhood[]
}

export function NeighborhoodsListClient({ neighborhoods }: NeighborhoodsListClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'yield'>('score')

  const governorates = useMemo(() => {
    const unique = Array.from(new Set(neighborhoods.map(n => n.governorate)))
    return ['all', ...unique.sort()]
  }, [neighborhoods])

  const filteredAndSorted = useMemo(() => {
    let filtered = neighborhoods.filter(n => {
      const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           n.delegation.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesGovernorate = selectedGovernorate === 'all' || n.governorate === selectedGovernorate
      return matchesSearch && matchesGovernorate
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.overallScore - a.overallScore
        case 'price':
          return b.avgPricePerM2 - a.avgPricePerM2
        case 'yield':
          return b.rentalYield - a.rentalYield
        default:
          return 0
      }
    })

    return filtered
  }, [neighborhoods, searchQuery, selectedGovernorate, sortBy])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-blue-600 bg-blue-50'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-orange-600 bg-orange-50'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Quartiers de Tunisie</h1>
        <p className="text-lg text-gray-600">
          Découvrez les meilleurs quartiers avec des scores détaillés et des statistiques du marché
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher un quartier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Governorate Filter */}
            <select
              value={selectedGovernorate}
              onChange={(e) => setSelectedGovernorate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les gouvernorats</option>
              {governorates.slice(1).map(gov => (
                <option key={gov} value={gov}>{gov}</option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="score">Trier par Score</option>
              <option value="price">Trier par Prix</option>
              <option value="yield">Trier par Rendement</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-gray-600">
          {filteredAndSorted.length} quartier{filteredAndSorted.length !== 1 ? 's' : ''} trouvé{filteredAndSorted.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Neighborhoods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSorted.map(neighborhood => (
          <Link key={neighborhood.id} href={`/neighborhoods/${neighborhood.id}`}>
            <Card className="h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{neighborhood.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {neighborhood.delegation}, {neighborhood.governorate}
                    </CardDescription>
                  </div>
                  <div className={`px-4 py-2 rounded-full font-bold text-2xl ${getScoreColor(neighborhood.overallScore)}`}>
                    {neighborhood.overallScore}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Key Scores */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <ScorePill icon={<Home />} label="Logement" score={neighborhood.housingScore} />
                  <ScorePill icon={<GraduationCap />} label="Écoles" score={neighborhood.schoolsScore} />
                  <ScorePill icon={<Bus />} label="Transport" score={neighborhood.transportScore} />
                </div>

                {/* Market Stats */}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Prix moyen/m²</span>
                    <span className="font-semibold text-blue-600">{formatPrice(neighborhood.avgPricePerM2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Rendement locatif</span>
                    <span className="font-semibold text-green-600">{neighborhood.rentalYield.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Croissance YTD</span>
                    <span className={`font-semibold flex items-center gap-1 ${neighborhood.priceGrowthYTD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <TrendingUp className="w-3 h-3" />
                      {neighborhood.priceGrowthYTD > 0 ? '+' : ''}{neighborhood.priceGrowthYTD.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* View Details */}
                <Button variant="outline" className="w-full mt-4 gap-2">
                  Voir les Détails
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* No Results */}
      {filteredAndSorted.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Aucun quartier trouvé</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery('')
              setSelectedGovernorate('all')
            }}
          >
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  )
}

interface ScorePillProps {
  icon: React.ReactNode
  label: string
  score: number
}

function ScorePill({ icon, label, score }: ScorePillProps) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700'
    if (score >= 60) return 'bg-blue-100 text-blue-700'
    if (score >= 40) return 'bg-yellow-100 text-yellow-700'
    return 'bg-orange-100 text-orange-700'
  }

  return (
    <div className={`flex flex-col items-center p-2 rounded-lg ${getColor(score)}`}>
      <div className="text-xs mb-1">{icon}</div>
      <div className="text-xs font-semibold">{score}</div>
      <div className="text-[10px]">{label}</div>
    </div>
  )
}
