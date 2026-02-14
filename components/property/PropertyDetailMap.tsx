"use client";

import React, { useState } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface PropertyDetailMapProps {
  latitude: number | null;
  longitude: number | null;
  title: string;
  address?: string | null;
}

export function PropertyDetailMap({
  latitude,
  longitude,
  title,
  address,
}: PropertyDetailMapProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  // Default to Tunis center if no coordinates
  const defaultLat = 36.8065;
  const defaultLng = 10.1815;

  const lat = latitude || defaultLat;
  const lng = longitude || defaultLng;
  const hasValidCoords = latitude !== null && longitude !== null;

  const [viewState, setViewState] = useState({
    latitude: lat,
    longitude: lng,
    zoom: hasValidCoords ? 15 : 11,
  });

  if (!mapboxToken) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500 text-sm">Configuration Mapbox manquante</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-right" />

        {hasValidCoords && (
          <Marker longitude={lng} latitude={lat} anchor="bottom">
            <div className="relative">
              {/* Custom pin */}
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <span className="text-white text-xl">📍</span>
              </div>
              {/* Pin point */}
              <div className="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[12px] border-transparent border-t-blue-600" />
            </div>
          </Marker>
        )}
      </Map>

      {!hasValidCoords && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center pointer-events-none">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm text-gray-600">Localisation approximative</p>
          </div>
        </div>
      )}
    </div>
  );
}
