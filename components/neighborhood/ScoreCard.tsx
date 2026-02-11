"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface ScoreCardProps {
  title: string
  score: number
  icon: LucideIcon
  description?: string
}

export function ScoreCard({ title, score, icon: Icon, description }: ScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-500' }
    if (score >= 60) return { bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-500' }
    if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-600', ring: 'ring-yellow-500' }
    return { bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-500' }
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Bon'
    if (score >= 40) return 'Moyen'
    return 'À améliorer'
  }

  const colors = getScoreColor(score)

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colors.text}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {/* Circular Progress */}
          <div className="relative w-20 h-20">
            <svg className="transform -rotate-90 w-20 h-20">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 32}`}
                strokeDashoffset={`${2 * Math.PI * 32 * (1 - score / 100)}`}
                className={colors.bg}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-bold ${colors.text}`}>{score}</span>
            </div>
          </div>

          {/* Score Info */}
          <div className="flex-1">
            <p className={`text-2xl font-bold ${colors.text}`}>{score}/100</p>
            <p className="text-sm text-gray-600">{getScoreLabel(score)}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface SimpleScoreCardProps {
  title: string
  score: number
  icon: LucideIcon
  compact?: boolean
}

export function SimpleScoreCard({ title, score, icon: Icon, compact = false }: SimpleScoreCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-blue-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  return (
    <div className={`flex items-center gap-3 ${compact ? 'p-2' : 'p-4'} bg-gray-50 rounded-lg`}>
      <Icon className="h-5 w-5 text-gray-600 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-gray-700 truncate`}>
          {title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${getScoreColor(score)}`}
              style={{ width: `${score}%` }}
            />
          </div>
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-gray-700 w-8 text-right`}>
            {score}
          </span>
        </div>
      </div>
    </div>
  )
}
