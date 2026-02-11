"use client"

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PropertyCard } from '@/components/property/PropertyCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, Loader2, Trash2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PropertySearchResult } from '@/types/property'

interface SavedPropertyData {
  id: string
  savedAt: Date
  property: PropertySearchResult
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

function SavedPropertiesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get('page') || '1')
  
  const [savedProperties, setSavedProperties] = useState<SavedPropertyData[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [removingId, setRemovingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSavedProperties()
  }, [page])

  async function fetchSavedProperties() {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/saved-properties?page=${page}&limit=12`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch saved properties')
      }

      const data = await response.json()
      setSavedProperties(data.savedProperties)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching saved properties:', error)
      toast.error('Erreur', {
        description: 'Impossible de charger les propriétés sauvegardées'
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleRemove(savedPropertyId: string, propertyTitle: string) {
    if (!confirm(`Retirer "${propertyTitle}" de vos favoris ?`)) {
      return
    }

    try {
      setRemovingId(savedPropertyId)
      const response = await fetch(`/api/users/saved-properties/${savedPropertyId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove property')
      }

      setSavedProperties(prev => prev.filter(sp => sp.id !== savedPropertyId))
      toast.success('Propriété retirée', {
        description: 'La propriété a été retirée de vos favoris'
      })

      // Update pagination total
      if (pagination) {
        setPagination({
          ...pagination,
          total: pagination.total - 1
        })
      }
    } catch (error) {
      console.error('Error removing saved property:', error)
      toast.error('Erreur', {
        description: 'Impossible de retirer la propriété'
      })
    } finally {
      setRemovingId(null)
    }
  }

  function handlePageChange(newPage: number) {
    router.push(`/saved?page=${newPage}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
              Propriétés Sauvegardées
            </h1>
          </div>
          {pagination && (
            <p className="text-gray-600 mt-2">
              {pagination.total} propriété{pagination.total > 1 ? 's' : ''} sauvegardée{pagination.total > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Empty State */}
      {savedProperties.length === 0 && (
        <Card>
          <CardContent className="text-center py-16">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Aucune propriété sauvegardée
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Parcourez les propriétés disponibles et cliquez sur le cœur pour les sauvegarder ici
            </p>
            <Link href="/properties">
              <Button>
                Parcourir les propriétés
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Properties Grid */}
      {savedProperties.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProperties.map((savedProperty) => (
              <div key={savedProperty.id} className="relative">
                <PropertyCard property={savedProperty.property} />
                
                {/* Remove Button Overlay */}
                <div className="absolute top-2 right-2 z-10">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemove(savedProperty.id, savedProperty.property.title)}
                    disabled={removingId === savedProperty.id}
                    className="shadow-lg"
                  >
                    {removingId === savedProperty.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => handlePageChange(page - 1)}
                disabled={!pagination.hasPrev}
              >
                Précédent
              </Button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'outline'}
                    onClick={() => handlePageChange(pageNum)}
                    size="sm"
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={() => handlePageChange(page + 1)}
                disabled={!pagination.hasNext}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function SavedPropertiesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <SavedPropertiesContent />
    </Suspense>
  )
}
