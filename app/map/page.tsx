"use client";

import React, { useState, useCallback } from "react";
import PropertyMap from "@/components/map/PropertyMap";
import MapFilters from "@/components/map/MapFilters";
import { useMapData, MapBounds } from "@/hooks/useMapData";
import { useMapFilters } from "@/hooks/useMapFilters";

export default function MapPage() {
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const { filters, updateFilter, resetFilters } = useMapFilters();
  const { data, loading, error } = useMapData(bounds, filters);

  const handleBoundsChange = useCallback((newBounds: MapBounds) => {
    setBounds(newBounds);
  }, []);

  const handleFilterChange = useCallback(
    (newFilters: typeof filters) => {
      Object.entries(newFilters).forEach(([key, value]) => {
        updateFilter(key as any, value);
      });
    },
    [updateFilter]
  );

  return (
    <div className="flex h-screen">
      {/* Filters Sidebar */}
      <MapFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={resetFilters}
      />

      {/* Map Container */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm font-medium text-gray-700">
              Chargement des propriétés...
            </p>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-red-50 border border-red-200 px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm font-medium text-red-700">
              Erreur: {error}
            </p>
          </div>
        )}

        <PropertyMap
          properties={data.features}
          onBoundsChange={handleBoundsChange}
        />
      </div>
    </div>
  );
}
