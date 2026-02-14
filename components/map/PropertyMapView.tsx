"use client";

import React from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  ScaleControl,
} from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useState } from "react";
import PropertyMarker from "./PropertyMarker";
import PropertyPopup from "./PropertyPopup";

interface PropertyFeature {
  properties: {
    id: string;
    title: string;
    price: number;
    size: number;
    propertyType: string;
    bedrooms: number | null;
    neighborhood: string;
    delegation: string;
    images: string[];
  };
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
}

interface PropertyMapViewProps {
  properties: PropertyFeature[];
}

export default function PropertyMapView({ properties }: PropertyMapViewProps) {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const [selectedProperty, setSelectedProperty] =
    useState<PropertyFeature | null>(null);

  // Center on the first property or Tunisia default
  const initialViewState =
    properties.length > 0
      ? {
          latitude: properties[0].geometry.coordinates[1],
          longitude: properties[0].geometry.coordinates[0],
          zoom: 13,
        }
      : {
          latitude: 36.8,
          longitude: 10.2,
          zoom: 7,
        };

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-600">Configuration Mapbox manquante</p>
      </div>
    );
  }

  return (
    <Map
      initialViewState={initialViewState}
      mapStyle="mapbox://styles/mapbox/streets-v12"
      mapboxAccessToken={mapboxToken}
      style={{ width: "100%", height: "100%" }}
    >
      <NavigationControl position="top-right" />
      <ScaleControl />

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
  );
}
