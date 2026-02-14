"use client";

import React from "react";
import Map, { Marker, NavigationControl, ScaleControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface PropertyMapSingleProps {
  latitude: number;
  longitude: number;
  title: string;
  price: number;
  propertyType: string;
}

const PROPERTY_COLORS: Record<string, string> = {
  APARTMENT: "#3B82F6",
  HOUSE: "#10B981",
  VILLA: "#8B5CF6",
  LAND: "#92400E",
  COMMERCIAL: "#F59E0B",
};

const PROPERTY_ICONS: Record<string, string> = {
  APARTMENT: "🏢",
  HOUSE: "🏠",
  VILLA: "🏛️",
  LAND: "🟩",
  COMMERCIAL: "🏪",
};

export default function PropertyMapSingle({
  latitude,
  longitude,
  title,
  price,
  propertyType,
}: PropertyMapSingleProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const color = PROPERTY_COLORS[propertyType] || "#6B7280";
  const icon = PROPERTY_ICONS[propertyType] || "📍";

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-600">
          Configuration Mapbox manquante. Ajoutez
          NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN à votre fichier .env
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Map
        initialViewState={{
          latitude,
          longitude,
          zoom: 14,
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />
        <ScaleControl />

        <Marker longitude={longitude} latitude={latitude} anchor="bottom">
          <div className="relative group">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-transform hover:scale-110"
              style={{ backgroundColor: color }}
            >
              <span className="text-2xl">{icon}</span>
            </div>
            <div
              className="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[10px] border-transparent"
              style={{ borderTopColor: color }}
            />
            <div
              className="absolute inset-0 w-10 h-10 rounded-full opacity-50 animate-ping"
              style={{ backgroundColor: color }}
            />
          </div>
        </Marker>
      </Map>

      <div className="absolute bottom-4 left-4 right-4 bg-white px-4 py-3 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
        <p className="text-lg font-bold text-blue-600">
          {new Intl.NumberFormat("fr-TN", {
            style: "currency",
            currency: "TND",
            maximumFractionDigits: 0,
          }).format(price)}
        </p>
      </div>
    </div>
  );
}
