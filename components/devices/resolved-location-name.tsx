"use client";

import { useEffect, useState } from "react";
import {
  hasUsableLocationName,
  reverseGeocodeLocation,
} from "@/lib/reverse-geocode";

type ResolvedLocationNameProps = {
  locationName?: string | null;
  latitude?: number;
  longitude?: number;
  className?: string;
  fallback?: string;
};

export default function ResolvedLocationName({
  locationName,
  latitude,
  longitude,
  className,
  fallback = "-",
}: ResolvedLocationNameProps) {
  const [resolvedLocation, setResolvedLocation] = useState<{
    key: string;
    name: string | null;
  } | null>(null);
  const locationKey =
    Number.isFinite(latitude) && Number.isFinite(longitude)
      ? `${latitude!.toFixed(5)},${longitude!.toFixed(5)}`
      : null;

  useEffect(() => {
    let cancelled = false;

    if (hasUsableLocationName(locationName)) return;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const key = `${latitude!.toFixed(5)},${longitude!.toFixed(5)}`;

    reverseGeocodeLocation(latitude, longitude).then((name) => {
      if (!cancelled) setResolvedLocation({ key, name });
    });

    return () => {
      cancelled = true;
    };
  }, [locationName, latitude, longitude]);

  const finalText = hasUsableLocationName(locationName)
    ? locationName!.trim()
    : locationKey && resolvedLocation?.key === locationKey
      ? resolvedLocation.name || fallback
      : fallback;

  return (
    <span className={className} title={finalText}>
      {finalText}
    </span>
  );
}
