const reverseGeocodeCache = new Map<string, string | null>();
const reverseGeocodeInflight = new Map<string, Promise<string | null>>();

const unusableLocationNamePatterns = [
  /^-$/i,
  /^geocoder tidak tersedia(?:\s*\(aosp\))?$/i,
  /^geocoder unavailable(?:\s*\(aosp\))?$/i,
  /^location unavailable$/i,
  /^unknown location$/i,
];

function toKey(latitude: number, longitude: number): string {
  return `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
}

export function hasUsableLocationName(value?: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim();
  return (
    normalized.length > 0 &&
    !unusableLocationNamePatterns.some((pattern) => pattern.test(normalized))
  );
}

export async function reverseGeocodeLocation(
  latitude?: number,
  longitude?: number,
): Promise<string | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const key = toKey(latitude!, longitude!);

  if (reverseGeocodeCache.has(key)) {
    return reverseGeocodeCache.get(key) ?? null;
  }

  const existing = reverseGeocodeInflight.get(key);
  if (existing) return existing;

  const request = fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  )
    .then(async (res) => {
      if (!res.ok) return null;
      const data = await res.json();
      const name =
        typeof data?.display_name === "string" && data.display_name.trim()
          ? data.display_name.trim()
          : null;
      reverseGeocodeCache.set(key, name);
      return name;
    })
    .catch(() => {
      reverseGeocodeCache.set(key, null);
      return null;
    })
    .finally(() => {
      reverseGeocodeInflight.delete(key);
    });

  reverseGeocodeInflight.set(key, request);
  return request;
}
