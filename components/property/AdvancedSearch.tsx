"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { GOVERNORATES } from "@/lib/constants"
import { getDelegations, getNeighborhoods } from "@/lib/locations"
import { formatPrice } from "@/lib/utils"
import { Search, X, SlidersHorizontal } from "lucide-react"

export interface SearchFilters {
  q: string
  governorate: string
  delegation: string
  neighborhood: string
  propertyTypes: string[]
  transactionType: string
  priceRange: [number, number]
  sizeRange: [number, number]
  bedrooms: string
  bathrooms: string
  features: {
    parking: boolean
    elevator: boolean
    garden: boolean
    pool: boolean
    seaview: boolean
  }
  sortBy: string
  order: string
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void
  resultsCount?: number
  loading?: boolean
}

const PROPERTY_TYPES = [
  { value: "APARTMENT", label: "Appartement" },
  { value: "HOUSE", label: "Maison" },
  { value: "VILLA", label: "Villa" },
  { value: "LAND", label: "Terrain" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "OFFICE", label: "Bureau" }
]

const SORT_OPTIONS = [
  { value: "date-desc", label: "Plus récent" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "size-desc", label: "Surface (grande à petite)" },
  { value: "size-asc", label: "Surface (petite à grande)" }
]

export function AdvancedSearch({ onSearch, resultsCount, loading }: AdvancedSearchProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    q: "",
    governorate: "",
    delegation: "",
    neighborhood: "",
    propertyTypes: [],
    transactionType: "",
    priceRange: [0, 5000000],
    sizeRange: [0, 1000],
    bedrooms: "0",
    bathrooms: "0",
    features: {
      parking: false,
      elevator: false,
      garden: false,
      pool: false,
      seaview: false
    },
    sortBy: "date",
    order: "desc"
  })

  const [delegations, setDelegations] = useState<string[]>([])
  const [neighborhoods, setNeighborhoods] = useState<string[]>([])

  useEffect(() => {
    if (filters.governorate) {
      const dels = getDelegations(filters.governorate)
      setDelegations(dels)
      setFilters(prev => ({ ...prev, delegation: "", neighborhood: "" }))
    } else {
      setDelegations([])
    }
  }, [filters.governorate])

  useEffect(() => {
    if (filters.governorate && filters.delegation) {
      const neighs = getNeighborhoods(filters.governorate, filters.delegation)
      setNeighborhoods(neighs)
      setFilters(prev => ({ ...prev, neighborhood: "" }))
    } else {
      setNeighborhoods([])
    }
  }, [filters.governorate, filters.delegation])

  const handlePropertyTypeToggle = (type: string) => {
    setFilters(prev => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter(t => t !== type)
        : [...prev.propertyTypes, type]
    }))
  }

  const handleFeatureToggle = (feature: keyof SearchFilters['features']) => {
    setFilters(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      q: "",
      governorate: "",
      delegation: "",
      neighborhood: "",
      propertyTypes: [],
      transactionType: "",
      priceRange: [0, 5000000],
      sizeRange: [0, 1000],
      bedrooms: "0",
      bathrooms: "0",
      features: {
        parking: false,
        elevator: false,
        garden: false,
        pool: false,
        seaview: false
      },
      sortBy: "date",
      order: "desc"
    })
  }

  const handleSearch = () => {
    onSearch(filters)
  }

  const handleSortChange = (value: string) => {
    const [sortBy, order] = value.split('-')
    setFilters(prev => ({ ...prev, sortBy, order }))
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Rechercher par titre ou description..."
                value={filters.q}
                onChange={(e) => setFilters(prev => ({ ...prev, q: e.target.value }))}
                className="h-12"
              />
            </div>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtres
            </Button>
            <Button size="lg" onClick={handleSearch} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="space-y-6 pt-4 border-t">
              {/* Location */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Localisation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Gouvernorat</Label>
                    <select
                      className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={filters.governorate}
                      onChange={(e) => setFilters(prev => ({ ...prev, governorate: e.target.value }))}
                    >
                      <option value="">Tous les gouvernorats</option>
                      {GOVERNORATES.map((gov) => (
                        <option key={gov} value={gov}>{gov}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Délégation</Label>
                    <select
                      className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={filters.delegation}
                      onChange={(e) => setFilters(prev => ({ ...prev, delegation: e.target.value }))}
                      disabled={!filters.governorate}
                    >
                      <option value="">Toutes les délégations</option>
                      {delegations.map((del) => (
                        <option key={del} value={del}>{del}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Quartier</Label>
                    <select
                      className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={filters.neighborhood}
                      onChange={(e) => setFilters(prev => ({ ...prev, neighborhood: e.target.value }))}
                      disabled={!filters.delegation}
                    >
                      <option value="">Tous les quartiers</option>
                      {neighborhoods.map((neigh) => (
                        <option key={neigh} value={neigh}>{neigh}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Property Type */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Type de propriété</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {PROPERTY_TYPES.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type.value}`}
                        checked={filters.propertyTypes.includes(type.value)}
                        onCheckedChange={() => handlePropertyTypeToggle(type.value)}
                      />
                      <label
                        htmlFor={`type-${type.value}`}
                        className="text-sm cursor-pointer"
                      >
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Type */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Type de transaction</h3>
                <div className="flex gap-4">
                  {[
                    { value: "", label: "Tous" },
                    { value: "SALE", label: "Vente" },
                    { value: "RENT", label: "Location" },
                    { value: "BOTH", label: "Vente/Location" }
                  ].map((type) => (
                    <label key={type.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="transactionType"
                        value={type.value}
                        checked={filters.transactionType === type.value}
                        onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Prix (TND)</h3>
                <div className="space-y-2">
                  <Slider
                    value={filters.priceRange}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                    max={5000000}
                    step={50000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{formatPrice(filters.priceRange[0])}</span>
                    <span>{formatPrice(filters.priceRange[1])}</span>
                  </div>
                </div>
              </div>

              {/* Size Range */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Surface (m²)</h3>
                <div className="space-y-2">
                  <Slider
                    value={filters.sizeRange}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, sizeRange: value as [number, number] }))}
                    max={1000}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{filters.sizeRange[0]} m²</span>
                    <span>{filters.sizeRange[1]} m²</span>
                  </div>
                </div>
              </div>

              {/* Bedrooms & Bathrooms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Chambres (minimum)</Label>
                  <select
                    className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.bedrooms}
                    onChange={(e) => setFilters(prev => ({ ...prev, bedrooms: e.target.value }))}
                  >
                    <option value="0">Peu importe</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>

                <div>
                  <Label>Salles de bain (minimum)</Label>
                  <select
                    className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.bathrooms}
                    onChange={(e) => setFilters(prev => ({ ...prev, bathrooms: e.target.value }))}
                  >
                    <option value="0">Peu importe</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Équipements</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { key: "parking" as const, label: "Parking" },
                    { key: "elevator" as const, label: "Ascenseur" },
                    { key: "garden" as const, label: "Jardin" },
                    { key: "pool" as const, label: "Piscine" },
                    { key: "seaview" as const, label: "Vue mer" }
                  ].map((feature) => (
                    <div key={feature.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`feature-${feature.key}`}
                        checked={filters.features[feature.key]}
                        onCheckedChange={() => handleFeatureToggle(feature.key)}
                      />
                      <label
                        htmlFor={`feature-${feature.key}`}
                        className="text-sm cursor-pointer"
                      >
                        {feature.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <Label>Trier par</Label>
                <select
                  className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={`${filters.sortBy}-${filters.order}`}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={handleClearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
                <div className="text-sm text-gray-600">
                  {resultsCount !== undefined && (
                    <span>{resultsCount} résultat{resultsCount !== 1 ? 's' : ''} trouvé{resultsCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
