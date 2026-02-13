"use client";

import { useState, useEffect } from "react";

export interface PropertyFilters {
  propertyType: string[];
  transactionType: "SALE" | "RENT" | "ALL";
  minPrice: number;
  maxPrice: number;
  minSize: number;
  maxSize: number;
  bedrooms: number | null;
  hasParking: boolean;
  hasElevator: boolean;
  hasPool: boolean;
  hasGarden: boolean;
  hasSeaView: boolean;
  governorates: string[];
}

const DEFAULT_FILTERS: PropertyFilters = {
  propertyType: ["APARTMENT", "HOUSE", "VILLA"],
  transactionType: "SALE",
  minPrice: 0,
  maxPrice: 2000000,
  minSize: 0,
  maxSize: 1000,
  bedrooms: null,
  hasParking: false,
  hasElevator: false,
  hasPool: false,
  hasGarden: false,
  hasSeaView: false,
  governorates: [],
};

export function useMapFilters() {
  const [filters, setFilters] = useState<PropertyFilters>(DEFAULT_FILTERS);

  const updateFilter = <K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const togglePropertyType = (type: string) => {
    setFilters((prev) => {
      const currentTypes = prev.propertyType;
      if (currentTypes.includes(type)) {
        return {
          ...prev,
          propertyType: currentTypes.filter((t) => t !== type),
        };
      } else {
        return {
          ...prev,
          propertyType: [...currentTypes, type],
        };
      }
    });
  };

  const toggleGovernorate = (gov: string) => {
    setFilters((prev) => {
      const currentGovs = prev.governorates;
      if (currentGovs.includes(gov)) {
        return {
          ...prev,
          governorates: currentGovs.filter((g) => g !== gov),
        };
      } else {
        return {
          ...prev,
          governorates: [...currentGovs, gov],
        };
      }
    });
  };

  return {
    filters,
    updateFilter,
    resetFilters,
    togglePropertyType,
    toggleGovernorate,
  };
}
