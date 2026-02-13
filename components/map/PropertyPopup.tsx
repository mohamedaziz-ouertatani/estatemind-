"use client";

import React from "react";
import Link from "next/link";
import { PropertyFeature } from "@/hooks/useMapData";

interface PropertyPopupProps {
  property: PropertyFeature;
}

export default function PropertyPopup({ property }: PropertyPopupProps) {
  const { properties: props } = property;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-TN", {
      style: "currency",
      currency: "TND",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getPropertyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      APARTMENT: "Appartement",
      HOUSE: "Maison",
      VILLA: "Villa",
      LAND: "Terrain",
      COMMERCIAL: "Commercial",
    };
    return labels[type] || type;
  };

  return (
    <div className="p-2 max-w-sm">
      {/* Property Image */}
      {props.images && props.images.length > 0 && (
        <div className="mb-2 rounded overflow-hidden">
          <img
            src={props.images[0]}
            alt={props.title}
            className="w-full h-32 object-cover"
          />
        </div>
      )}

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
        {props.title}
      </h3>

      {/* Location */}
      <p className="text-sm text-gray-600 mb-2">
        {props.neighborhood}, {props.delegation}
      </p>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2 mb-2 text-sm">
        <div className="flex items-center gap-1">
          <span className="text-lg">💰</span>
          <span className="font-semibold text-gray-900">
            {formatPrice(props.price)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-lg">📐</span>
          <span className="text-gray-700">{props.size} m²</span>
        </div>

        {props.bedrooms && (
          <div className="flex items-center gap-1">
            <span className="text-lg">🛏️</span>
            <span className="text-gray-700">
              {props.bedrooms} {props.bedrooms === 1 ? "chambre" : "chambres"}
            </span>
          </div>
        )}

        <div className="flex items-center gap-1">
          <span className="text-gray-600 text-xs">
            {getPropertyTypeLabel(props.propertyType)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3">
        <Link
          href={`/properties/${props.id}`}
          className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition text-center"
        >
          Voir détails
        </Link>
        <Link
          href={`/valuation?propertyId=${props.id}`}
          className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded hover:bg-gray-200 transition text-center"
        >
          Évaluation
        </Link>
      </div>
    </div>
  );
}
