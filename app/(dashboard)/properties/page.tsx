"use client"

import { useState, useEffect } from "react"
import { PropertyCard } from "@/components/property/PropertyCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { GOVERNORATES, PROPERTY_TYPES, TRANSACTION_TYPES } from "@/lib/constants"

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    governorate: "",
    propertyType: "",
    transactionType: "",
    minPrice: "",
    maxPrice: "",
  })

  useEffect(() => {
    fetchProperties()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (filters.governorate) queryParams.set('governorate', filters.governorate)
      if (filters.propertyType) queryParams.set('propertyType', filters.propertyType)
      if (filters.transactionType) queryParams.set('transactionType', filters.transactionType)
      if (filters.minPrice) queryParams.set('minPrice', filters.minPrice)
      if (filters.maxPrice) queryParams.set('maxPrice', filters.maxPrice)

      const response = await fetch(`/api/properties?${queryParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProperties(data.properties)
      }
    } catch (error) {
      console.error("Error fetching properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchProperties()
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

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Gouvernorat</Label>
              <select
                className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.governorate}
                onChange={(e) => setFilters({ ...filters, governorate: e.target.value })}
              >
                <option value="">Tous</option>
                {GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>{gov}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Type de Propriété</Label>
              <select
                className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.propertyType}
                onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
              >
                <option value="">Tous</option>
                {PROPERTY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Type de Transaction</Label>
              <select
                className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={filters.transactionType}
                onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
              >
                <option value="">Tous</option>
                {TRANSACTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Label>Prix Min (TND)</Label>
              <Input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              />
            </div>

            <div>
              <Label>Prix Max (TND)</Label>
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSearch}>Rechercher</Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Chargement des propriétés...</p>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Aucune propriété trouvée</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              {properties.length} propriété{properties.length > 1 ? 's' : ''} trouvée{properties.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
