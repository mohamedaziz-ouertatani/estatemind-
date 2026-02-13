"use client";

import React, { useState, useCallback, useRef } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  ScaleControl,
  MapRef,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { PropertyFeature } from "@/hooks/useMapData";
import PropertyMarker from "./PropertyMarker";
import PropertyPopup from "./PropertyPopup";

interface PropertyMapProps {
  properties: PropertyFeature[];
  onBoundsChange?: (bounds: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  }) => void;
}

const TUNISIA_CENTER = {
  latitude: 36.8,
  longitude: 10.2,
  zoom: 7,
};

export default function PropertyMap({
  properties,
  onBoundsChange,
}: PropertyMapProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyFeature | null>(null);
  const [viewState, setViewState] = useState(TUNISIA_CENTER);
  const mapRef = useRef<MapRef>(null);

  const handleMove = useCallback((evt: any) => {
    setViewState(evt.viewState);
  }, []);

  const handleMoveEnd = useCallback(() => {
    if (mapRef.current && onBoundsChange) {
      const map = mapRef.current.getMap();
      const bounds = map.getBounds();

      onBoundsChange({
        minLng: bounds.getWest(),
        minLat: bounds.getSouth(),
        maxLng: bounds.getEast(),
        maxLat: bounds.getNorth(),
      });
    }
  }, [onBoundsChange]);

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-600">
          Mapbox token not configured. Please add
          NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env file.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        <ScaleControl />

        {/* Property Markers */}
        {properties.map((property) => (
          <Marker
            key={property.properties.id}
            longitude={property.geometry.coordinates[0]}
            latitude={property.geometry.coordinates[1]}
            anchor="bottom"
          >
            <PropertyMarker
              propertyType={property.properties.propertyType}
              onClick={() => setSelectedProperty(property)}
            />
          </Marker>
        ))}

        {/* Property Popup */}
        {selectedProperty && (
          <Popup
            longitude={selectedProperty.geometry.coordinates[0]}
            latitude={selectedProperty.geometry.coordinates[1]}
            anchor="top"
            onClose={() => setSelectedProperty(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="400px"
          >
            <PropertyPopup property={selectedProperty} />
          </Popup>
        )}
      </Map>

      {/* Property Count Badge */}
      <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-700">
          {properties.length}{" "}
          {properties.length === 1 ? "propriété" : "propriétés"}
        </p>
      </div>
    </div>
  );
}
