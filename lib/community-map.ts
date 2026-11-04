import type { Country } from "./types";

// PLACEHOLDER figures, not real users. Replace USER_LOCATIONS with real numbers before launch.
// Setting IS_SAMPLE_DATA to true shows a "sample data" notice under the map.
export const IS_SAMPLE_DATA = false;

export type LabelSide = "left" | "right" | "above" | "below";

export interface UserLocation {
  slug: string; name: string; ar: string; country: Country;
  lat: number; lon: number; users: number;
  label?: LabelSide; // cities shown with a permanent label; the rest appear on hover
}

export const USER_LOCATIONS: UserLocation[] = [
  { slug: "bengaluru", name: "Bengaluru", ar: "بنغالور", country: "IN", lat: 12.97, lon: 77.59, users: 26750, label: "left" },
  { slug: "dubai", name: "Dubai", ar: "دبي", country: "AE", lat: 25.2, lon: 55.27, users: 18420, label: "right" },
  { slug: "mumbai", name: "Mumbai", ar: "مومباي", country: "IN", lat: 19.08, lon: 72.88, users: 15310, label: "left" },
  { slug: "riyadh", name: "Riyadh", ar: "الرياض", country: "SA", lat: 24.71, lon: 46.68, users: 14280, label: "left" },
  { slug: "hyderabad", name: "Hyderabad", ar: "حيدر آباد", country: "IN", lat: 17.39, lon: 78.49, users: 13940, label: "right" },
  { slug: "delhi", name: "Delhi NCR", ar: "دلهي", country: "IN", lat: 28.61, lon: 77.21, users: 12480, label: "right" },
  { slug: "pune", name: "Pune", ar: "بونه", country: "IN", lat: 18.52, lon: 73.86, users: 9620 },
  { slug: "chennai", name: "Chennai", ar: "تشيناي", country: "IN", lat: 13.08, lon: 80.27, users: 8260 },
  { slug: "abu-dhabi", name: "Abu Dhabi", ar: "أبوظبي", country: "AE", lat: 24.45, lon: 54.38, users: 7350 },
  { slug: "jeddah", name: "Jeddah", ar: "جدة", country: "SA", lat: 21.49, lon: 39.19, users: 6120, label: "left" },
  { slug: "doha", name: "Doha", ar: "الدوحة", country: "QA", lat: 25.29, lon: 51.53, users: 4860, label: "below" },
  { slug: "kuwait-city", name: "Kuwait City", ar: "مدينة الكويت", country: "KW", lat: 29.38, lon: 47.98, users: 3740, label: "above" },
  { slug: "muscat", name: "Muscat", ar: "مسقط", country: "OM", lat: 23.59, lon: 58.41, users: 2510, label: "right" },
  { slug: "manama", name: "Manama", ar: "المنامة", country: "BH", lat: 26.23, lon: 50.59, users: 1980 },
];

// Must match the projection used to generate lib/map-shapes.ts.
const COS = Math.cos((22 * Math.PI) / 180);
const SCALE = 800 / (60 * COS);
export const projectPoint = (lat: number, lon: number) => ({
  x: (lon - 32) * SCALE * COS,
  y: (36 - lat) * SCALE,
});
