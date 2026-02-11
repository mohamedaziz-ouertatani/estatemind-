"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, MapPin, Home, Ruler, Sparkles } from 'lucide-react'
import { ValuationResult } from '@/types/valuation'

interface ValuationDisplayProps {
  valuation: ValuationResult
  listingPrice: number
}

export function ValuationDisplay({ valuation, listingPrice }: ValuationDisplayProps) {
  const priceDiff = listingPrice - valuation.estimatedValue
  const priceDiffPercent = (priceDiff / valuation.estimatedValue) * 100

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return { label: 'Très Haute', color: 'bg-green-500' }
    if (confidence >= 75) return { label: 'Haute', color: 'bg-blue-500' }
    if (confidence >= 60) return { label: 'Moyenne', color: 'bg-yellow-500' }
    return { label: 'Faible', color: 'bg-orange-500' }
  }

  const confidenceBadge = getConfidenceBadge(valuation.confidenceScore)

  const getPriceAnalysis = () => {
    if (Math.abs(priceDiffPercent) <= 5) {
      return {
        icon: <Minus className="w-5 h-5" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        label: 'Prix Juste',
        description: 'Le prix correspond à la valeur estimée'
      }
    } else if (priceDiff < 0) {
      return {
        icon: <TrendingDown className="w-5 h-5" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        label: 'Bonne Affaire',
        description: 'Prix inférieur à la valeur estimée'
      }
    } else {
      return {
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        label: 'Prix Élevé',
        description: 'Prix supérieur à la valeur estimée'
      }
    }
  }

  const priceAnalysis = getPriceAnalysis()

  return (
    <Card className="border-blue-200 shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Évaluation IA
            </CardTitle>
            <CardDescription>
              Analyse basée sur {valuation.comparables.length} propriétés similaires
            </CardDescription>
          </div>
          <Badge className={confidenceBadge.color}>
            Confiance: {confidenceBadge.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Valuation */}
        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Valeur Estimée</p>
          <p className="text-4xl font-bold text-blue-600">
            {formatPrice(valuation.estimatedValue)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Fourchette: {formatPrice(valuation.minValue)} - {formatPrice(valuation.maxValue)}
          </p>
        </div>

        {/* Price Comparison */}
        <div className={`p-4 rounded-lg ${priceAnalysis.bgColor}`}>
          <div className="flex items-center gap-3">
            <div className={priceAnalysis.color}>
              {priceAnalysis.icon}
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${priceAnalysis.color}`}>
                {priceAnalysis.label}
              </p>
              <p className="text-sm text-gray-600">{priceAnalysis.description}</p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${priceAnalysis.color}`}>
                {priceDiff > 0 ? '+' : ''}{formatPrice(Math.abs(priceDiff))}
              </p>
              <p className="text-xs text-gray-500">
                {priceDiff > 0 ? '+' : ''}{priceDiffPercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Analyse Détaillée</h4>
          <div className="grid grid-cols-2 gap-3">
            <ScoreItem
              icon={<MapPin className="w-4 h-4" />}
              label="Emplacement"
              score={valuation.locationScore}
            />
            <ScoreItem
              icon={<Ruler className="w-4 h-4" />}
              label="Superficie"
              score={valuation.sizeScore}
            />
            <ScoreItem
              icon={<Home className="w-4 h-4" />}
              label="État"
              score={valuation.conditionScore}
            />
            <ScoreItem
              icon={<Sparkles className="w-4 h-4" />}
              label="Équipements"
              score={valuation.amenitiesScore}
            />
          </div>
        </div>

        {/* AI Insights */}
        <div className="pt-4 border-t">
          <h4 className="font-semibold text-sm mb-2">Analyse IA</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {valuation.aiInsights}
          </p>
        </div>

        {/* Comparables */}
        {valuation.comparables.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-sm mb-3">Propriétés Comparables</h4>
            <div className="space-y-2">
              {valuation.comparables.slice(0, 3).map((comp, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-gray-700 truncate">{comp.title}</p>
                    <p className="text-xs text-gray-500">{comp.distance.toFixed(1)} km • Similarité {comp.similarity}%</p>
                  </div>
                  <p className="font-semibold text-blue-600 ml-2">
                    {formatPrice(comp.price)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ScoreItemProps {
  icon: React.ReactNode
  label: string
  score: number
}

function ScoreItem({ icon, label, score }: ScoreItemProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
      <div className="text-gray-600">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-600">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700">{score}</span>
        </div>
      </div>
    </div>
  )
}
