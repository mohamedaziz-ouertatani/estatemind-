"use client";

import { useState, useEffect, useCallback } from "react";
import { PropertyFilters } from "./useMapFilters";

export interface MapBounds {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface PropertyFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  properties: {
    id: string;
    title: string;
    price: number;
    size: number;
    bedrooms: number | null;
    propertyType: string;
    transactionType: string;
    images: string[];
    governorate: string;
    delegation: string;
    neighborhood: string;
  };
}

export interface PropertyCollection {
  type: "FeatureCollection";
  features: PropertyFeature[];
}

export function useMapData(
  bounds: MapBounds | null,
  filters: PropertyFilters
) {
  const [data, setData] = useState<PropertyCollection>({
    type: "FeatureCollection",
    features: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!bounds) return;

    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("minLng", bounds.minLng.toString());
      params.append("minLat", bounds.minLat.toString());
      params.append("maxLng", bounds.maxLng.toString());
      params.append("maxLat", bounds.maxLat.toString());

      if (filters.propertyType.length > 0) {
        params.append("propertyType", filters.propertyType.join(","));
      }

      if (filters.transactionType !== "ALL") {
        params.append("transactionType", filters.transactionType);
      }

      params.append("minPrice", filters.minPrice.toString());
      params.append("maxPrice", filters.maxPrice.toString());
      params.append("minSize", filters.minSize.toString());
      params.append("maxSize", filters.maxSize.toString());

      if (filters.bedrooms !== null) {
        params.append("bedrooms", filters.bedrooms.toString());
      }

      if (filters.hasParking) params.append("hasParking", "true");
      if (filters.hasElevator) params.append("hasElevator", "true");
      if (filters.hasPool) params.append("hasPool", "true");
      if (filters.hasGarden) params.append("hasGarden", "true");
      if (filters.hasSeaView) params.append("hasSeaView", "true");

      if (filters.governorates.length > 0) {
        params.append("governorates", filters.governorates.join(","));
      }

      const response = await fetch(`/api/map/properties?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching properties:", err);
    } finally {
      setLoading(false);
    }
  }, [bounds, filters]);

  useEffect(() => {
    // Debounce the fetch
    const timer = setTimeout(() => {
      fetchProperties();
    }, 500);

    return () => clearTimeout(timer);
  }, [fetchProperties]);

  return {
    data,
    loading,
    error,
    refetch: fetchProperties,
  };
}
