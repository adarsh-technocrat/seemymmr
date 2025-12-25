"use client";

import { useState } from "react";
import { Marker, Popup } from "react-map-gl/mapbox";
import {
  generateVisitorName,
  getAvatarUrl,
  getConversionScoreColor,
  getVisitorCoordinates,
  type Visitor,
} from "@/utils/realtime-map";
import { VisitorPopupContent } from "./VisitorPopupContent";

interface VisitorMarkerProps {
  visitor: Visitor;
  isFocused?: boolean;
  onSelect?: (visitorId: string, userId?: string) => void;
}

export function VisitorMarker({
  visitor,
  isFocused = false,
  onSelect,
}: VisitorMarkerProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [lng, lat] = getVisitorCoordinates(visitor);
  const visitorName = generateVisitorName(visitor.visitorId, visitor.userId);
  const avatarUrl = getAvatarUrl(visitor.visitorId, visitor.country);
  const scoreColor = getConversionScoreColor(visitor.conversionScore);

  return (
    <>
      <Marker
        longitude={lng}
        latitude={lat}
        anchor="bottom"
        onClick={(e) => {
          e.originalEvent.stopPropagation();
          setShowPopup(true);
          if (onSelect) {
            onSelect(visitor.visitorId, visitor.userId);
          }
        }}
      >
        <div
          className={`relative cursor-pointer ${
            isFocused ? "animate-bounce" : ""
          }`}
        >
          {isFocused && (
            <div className="absolute inset-0 -m-2 rounded-full bg-primary/20 animate-ping" />
          )}
          <div
            className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white shadow-sm transition-all duration-300 ${
              isFocused ? "scale-150 ring-2 ring-primary" : ""
            }`}
            style={{ backgroundColor: scoreColor }}
          />
          <img
            src={avatarUrl}
            alt={visitorName}
            className={`rounded-full ring-2 transition-all duration-300 bg-white/80 shadow-lg object-cover ${
              isFocused
                ? "ring-primary ring-4 scale-125 shadow-2xl"
                : "ring-gray-200 size-14"
            }`}
            style={{
              width: isFocused ? "3.5rem" : "3.5rem",
              height: isFocused ? "3.5rem" : "3.5rem",
            }}
            loading="lazy"
          />
        </div>
      </Marker>
      {showPopup && (
        <Popup
          longitude={lng}
          latitude={lat}
          anchor="top-left"
          onClose={() => setShowPopup(false)}
          closeButton={true}
          closeOnClick={false}
          className="mapbox-popup-custom"
          offset={[-30, -68]}
          closeOnMove={false}
          maxWidth="500px"
        >
          <VisitorPopupContent visitor={visitor} />
        </Popup>
      )}
    </>
  );
}
