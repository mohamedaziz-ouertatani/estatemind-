"use client";

import React from "react";

interface PropertyMarkerProps {
  propertyType: string;
  onClick: () => void;
}

const PROPERTY_COLORS: Record<string, string> = {
  APARTMENT: "#3B82F6", // blue
  HOUSE: "#10B981", // green
  VILLA: "#8B5CF6", // purple
  LAND: "#92400E", // brown
  COMMERCIAL: "#F59E0B", // orange
};

const PROPERTY_ICONS: Record<string, string> = {
  APARTMENT: "🏢",
  HOUSE: "🏠",
  VILLA: "🏛️",
  LAND: "🟩",
  COMMERCIAL: "🏪",
};

export default function PropertyMarker({
  propertyType,
  onClick,
}: PropertyMarkerProps) {
  const color = PROPERTY_COLORS[propertyType] || "#6B7280";
  const icon = PROPERTY_ICONS[propertyType] || "📍";

  return (
    <button
      onClick={onClick}
      className="group relative"
      title={propertyType}
    >
      {/* Pin background */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110 border-2 border-white"
        style={{ backgroundColor: color }}
      >
        <span className="text-lg">{icon}</span>
      </div>

      {/* Pin point */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-transparent"
        style={{ borderTopColor: color }}
      />

      {/* Pulse animation */}
      <div
        className="absolute inset-0 w-8 h-8 rounded-full opacity-0 group-hover:opacity-50 group-hover:animate-ping"
        style={{ backgroundColor: color }}
      />
    </button>
  );
}
