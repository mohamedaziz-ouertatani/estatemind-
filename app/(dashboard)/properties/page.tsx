"use client"

import { useState, useEffect, useCallback } from "react"
import { PropertyCard } from "@/components/property/PropertyCard"
import { AdvancedSearch, SearchFilters } from "@/components/property/AdvancedSearch"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { PropertySearchResult, PaginationInfo } from "@/types/property"

export default function PropertiesPage() {
  const [properties, setProperties] = useState<PropertySearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [currentFilters, setCurrentFilters] = useState<SearchFilters | null>(null)

  const buildQueryString = useCallback((filters: SearchFilters, page: number = 1) => {
    const params = new URLSearchParams()
    
    params.set('page', page.toString())
    params.set('limit', '20')
    
    if (filters.q) params.set('q', filters.q)
    if (filters.governorate) params.set('governorate', filters.governorate)
    if (filters.delegation) params.set('delegation', filters.delegation)
    if (filters.neighborhood) params.set('neighborhood', filters.neighborhood)
    
    if (filters.propertyTypes.length > 0) {
      params.set('type', filters.propertyTypes.join(','))
    }
    
    if (filters.transactionType) {
      params.set('transaction', filters.transactionType)
    }
    
    if (filters.priceRange[0] > 0) {
      params.set('minPrice', filters.priceRange[0].toString())
    }
    if (filters.priceRange[1] < 5000000) {
      params.set('maxPrice', filters.priceRange[1].toString())
    }
    
    if (filters.sizeRange[0] > 0) {
      params.set('minSize', filters.sizeRange[0].toString())
    }
    if (filters.sizeRange[1] < 1000) {
      params.set('maxSize', filters.sizeRange[1].toString())
    }
    
    if (filters.bedrooms !== '0') {
      params.set('bedrooms', filters.bedrooms)
    }
    if (filters.bathrooms !== '0') {
      params.set('bathrooms', filters.bathrooms)
    }
    
    if (filters.features.parking) params.set('parking', 'true')
    if (filters.features.elevator) params.set('elevator', 'true')
    if (filters.features.pool) params.set('pool', 'true')
    if (filters.features.garden) params.set('garden', 'true')
    if (filters.features.seaview) params.set('seaview', 'true')
    
    params.set('sortBy', filters.sortBy)
    params.set('order', filters.order)
    
    return params.toString()
  }, [])

  const fetchProperties = useCallback(async (filters?: SearchFilters, page: number = 1) => {
    setLoading(true)
    setError(null)
    
    try {
      const queryString = filters 
        ? buildQueryString(filters, page)
        : `page=${page}&limit=20&sortBy=date&order=desc`
      
      const response = await fetch(`/api/properties/search?${queryString}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch properties')
      }
      
      const data = await response.json()
      setProperties(data.properties)
      setPagination(data.pagination)
      
      if (filters) {
        setCurrentFilters(filters)
      }
    } catch (err) {
      console.error("Error fetching properties:", err)
      setError("Une erreur s'est produite lors du chargement des propriétés")
    } finally {
      setLoading(false)
    }
  }, [buildQueryString])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  const handleSearch = (filters: SearchFilters) => {
    fetchProperties(filters, 1)
  }

  const handlePageChange = (newPage: number) => {
    if (currentFilters) {
      fetchProperties(currentFilters, newPage)
    } else {
      fetchProperties(undefined, newPage)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recherche de Propriétés</h1>
        <p className="text-gray-600 mt-2">
          Trouvez votre propriété idéale en Tunisie
        </p>
      </div>

      {/* Advanced Search */}
      <AdvancedSearch 
        onSearch={handleSearch} 
        resultsCount={pagination.total}
        loading={loading}
      />

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement des propriétés...</p>
        </div>
      ) : (
        <>
          {/* Empty State */}
          {properties.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune propriété trouvée</h3>
              <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  <span className="font-semibold text-gray-900">{pagination.total}</span> propriété{pagination.total !== 1 ? 's' : ''} trouvée{pagination.total !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-gray-500">
                  Page {pagination.page} sur {pagination.totalPages}
                </p>
              </div>

              {/* Property Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-8">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Précédent
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum: number
                      
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = pagination.page - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? "default" : "outline"}
                          onClick={() => handlePageChange(pageNum)}
                          className="w-10"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
