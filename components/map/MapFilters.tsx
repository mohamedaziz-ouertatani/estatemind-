"use client";

import React from "react";
import { PropertyFilters, useMapFilters } from "@/hooks/useMapFilters";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface MapFiltersProps {
  filters: PropertyFilters;
  onFilterChange: (filters: PropertyFilters) => void;
  onReset: () => void;
}

const GOVERNORATES = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul",
  "Zaghouan",
  "Bizerte",
  "Béja",
  "Jendouba",
  "Le Kef",
  "Siliana",
  "Sousse",
  "Monastir",
  "Mahdia",
  "Sfax",
  "Kairouan",
  "Kasserine",
  "Sidi Bouzid",
  "Gabès",
  "Médenine",
  "Tataouine",
  "Gafsa",
  "Tozeur",
  "Kébili",
];

export default function MapFilters({
  filters,
  onFilterChange,
  onReset,
}: MapFiltersProps) {
  const updateFilter = <K extends keyof PropertyFilters>(
    key: K,
    value: PropertyFilters[K]
  ) => {
    onFilterChange({
      ...filters,
      [key]: value,
    });
  };

  const togglePropertyType = (type: string) => {
    const currentTypes = filters.propertyType;
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    updateFilter("propertyType", newTypes);
  };

  const toggleGovernorate = (gov: string) => {
    const currentGovs = filters.governorates;
    const newGovs = currentGovs.includes(gov)
      ? currentGovs.filter((g) => g !== gov)
      : [...currentGovs, gov];
    updateFilter("governorates", newGovs);
  };

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filtres</h2>
        <button
          onClick={onReset}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Réinitialiser
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Property Type */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">
            Type de propriété
          </Label>
          <div className="space-y-2">
            {[
              { value: "APARTMENT", label: "Appartement" },
              { value: "HOUSE", label: "Maison" },
              { value: "VILLA", label: "Villa" },
              { value: "LAND", label: "Terrain" },
              { value: "COMMERCIAL", label: "Commercial" },
            ].map((type) => (
              <div key={type.value} className="flex items-center">
                <Checkbox
                  id={`type-${type.value}`}
                  checked={filters.propertyType.includes(type.value)}
                  onCheckedChange={() => togglePropertyType(type.value)}
                />
                <label
                  htmlFor={`type-${type.value}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  {type.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Type */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">
            Type de transaction
          </Label>
          <div className="space-y-2">
            {[
              { value: "SALE", label: "Vente" },
              { value: "RENT", label: "Location" },
              { value: "ALL", label: "Tous" },
            ].map((type) => (
              <div key={type.value} className="flex items-center">
                <input
                  type="radio"
                  id={`transaction-${type.value}`}
                  name="transactionType"
                  checked={filters.transactionType === type.value}
                  onChange={() => updateFilter("transactionType", type.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <label
                  htmlFor={`transaction-${type.value}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  {type.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">
            Fourchette de prix (TND)
          </Label>
          <div className="space-y-3">
            <Slider
              min={0}
              max={2000000}
              step={10000}
              value={[filters.minPrice, filters.maxPrice]}
              onValueChange={(value) => {
                updateFilter("minPrice", value[0]);
                updateFilter("maxPrice", value[1]);
              }}
            />
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{filters.minPrice.toLocaleString()} TND</span>
              <span>{filters.maxPrice.toLocaleString()} TND</span>
            </div>
          </div>
        </div>

        {/* Size Range */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">
            Surface (m²)
          </Label>
          <div className="space-y-3">
            <Slider
              min={0}
              max={1000}
              step={10}
              value={[filters.minSize, filters.maxSize]}
              onValueChange={(value) => {
                updateFilter("minSize", value[0]);
                updateFilter("maxSize", value[1]);
              }}
            />
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>{filters.minSize} m²</span>
              <span>{filters.maxSize} m²</span>
            </div>
          </div>
        </div>

        {/* Bedrooms */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">
            Chambres
          </Label>
          <select
            value={filters.bedrooms || ""}
            onChange={(e) =>
              updateFilter("bedrooms", e.target.value ? parseInt(e.target.value) : null)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">Tous</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>

        {/* Features */}
        <div>
          <Label className="text-sm font-medium text-gray-900 mb-3 block">
            Caractéristiques
          </Label>
          <div className="space-y-2">
            <div className="flex items-center">
              <Checkbox
                id="parking"
                checked={filters.hasParking}
                onCheckedChange={(checked) =>
                  updateFilter("hasParking", checked as boolean)
                }
              />
              <label htmlFor="parking" className="ml-2 text-sm text-gray-700 cursor-pointer">
                Parking
              </label>
            </div>
            <div className="flex items-center">
              <Checkbox
                id="elevator"
                checked={filters.hasElevator}
                onCheckedChange={(checked) =>
                  updateFilter("hasElevator", checked as boolean)
                }
              />
              <label htmlFor="elevator" className="ml-2 text-sm text-gray-700 cursor-pointer">
                Ascenseur
              </label>
            </div>
            <div className="flex items-center">
              <Checkbox
                id="pool"
                checked={filters.hasPool}
                onCheckedChange={(checked) =>
                  updateFilter("hasPool", checked as boolean)
                }
              />
              <label htmlFor="pool" className="ml-2 text-sm text-gray-700 cursor-pointer">
                Piscine
              </label>
            </div>
            <div className="flex items-center">
              <Checkbox
                id="garden"
                checked={filters.hasGarden}
                onCheckedChange={(checked) =>
                  updateFilter("hasGarden", checked as boolean)
                }
              />
              <label htmlFor="garden" className="ml-2 text-sm text-gray-700 cursor-pointer">
                Jardin
              </label>
            </div>
            <div className="flex items-center">
              <Checkbox
                id="seaview"
                checked={filters.hasSeaView}
                onCheckedChange={(checked) =>
                  updateFilter("hasSeaView", checked as boolean)
                }
              />
              <label htmlFor="seaview" className="ml-2 text-sm text-gray-700 cursor-pointer">
                Vue mer
              </label>
            </div>
          </div>
        </div>

        {/* Governorates (collapsed by default) */}
        <details className="border border-gray-200 rounded-md">
          <summary className="px-3 py-2 cursor-pointer text-sm font-medium text-gray-900">
            Gouvernorats ({filters.governorates.length} sélectionnés)
          </summary>
          <div className="px-3 py-2 space-y-1 max-h-48 overflow-y-auto">
            {GOVERNORATES.map((gov) => (
              <div key={gov} className="flex items-center">
                <Checkbox
                  id={`gov-${gov}`}
                  checked={filters.governorates.includes(gov)}
                  onCheckedChange={() => toggleGovernorate(gov)}
                />
                <label
                  htmlFor={`gov-${gov}`}
                  className="ml-2 text-sm text-gray-700 cursor-pointer"
                >
                  {gov}
                </label>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
