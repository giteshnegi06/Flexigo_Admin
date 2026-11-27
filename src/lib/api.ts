// Admin API client. The session token lives in sessionStorage, so it is cleared when the browser tab closes.
// Trailing slashes are removed: "https://api.example/" would make "//api/..." URLs, which Vercel redirects,
// and browsers refuse redirects on CORS checks, so sign-in would fail with "Cannot reach the API server".
const API = (import.meta.env.VITE_API_URL || "http://localhost:4000").trim().replace(/\/+$/, "");
const KEY = "flexigo-admin-token";

export const token = {
  get: () => sessionStorage.getItem(KEY),
  set: (t: string) => sessionStorage.setItem(KEY, t),
  clear: () => sessionStorage.removeItem(KEY),
};

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}/api${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(token.get() ? { Authorization: `Bearer ${token.get()}` } : {}), ...init.headers },
    });
  } catch {
    // Also what the browser reports when the backend refuses this site's address (CORS), so say how to check both.
    throw new ApiError(
      `Cannot reach the API server at ${API}. Check that the backend is running, and that its ADMIN_URL setting includes ${window.location.origin}.`,
      0,
    );
  }
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.endsWith("/login")) {
    token.clear();
    window.location.assign("/login");
  }
  if (!res.ok) throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status);
  return body as T;
}

export type Summary = { newEnquiries: number; newMessages: number; upcomingStays: number; activeHomes: number; blockedNightsThisMonth: number; today: string };
export type EnquiryStatus = "new" | "contacted" | "booked" | "closed";
export type Enquiry = {
  id: number;
  home: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  name: string;
  email: string;
  phone: string;
  message: string | null;
  quotedTotal: number;
  status: EnquiryStatus;
  sourcePage: string | null;
  createdAt: string;
};
export type Home = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  summary: string;
  maxGuests: number;
  bedrooms: number;
  nightlyPrice: number;
  weekendPrice: number;
  compareAtPrice: number | null;
  minNights: number;
  wifiMbps: number | null;
  icalUrl: string | null;
  isActive: boolean;
  coverPhoto: string;
  mapLat: number | null;
  mapLng: number | null;
  mapExact: boolean;
  locationId: number | null;
  propertyType: PropertyType;
  area: string | null;
  bathrooms: number;
  photos: { url: string; alt: string }[];
};
export type PropertyType = "apartment" | "villa";
export type BlockedNight = { night: string; source: "airbnb" | "booking" | "manual"; note: string | null };

export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
export function prettyDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
export type Holiday = { id: number; day: string; name: string };
export type SiteImage = { key: string; section: string; label: string; url: string; alt: string; sortOrder: number; updatedAt: string };
export type ContactRequest = { id: number; name: string; phone: string; message: string | null; status: EnquiryStatus; sourcePage: string | null; createdAt: string };
export type Location = { id: number; slug: string; name: string; description: string; image: string; imageAlt: string; sortOrder: number; isActive: boolean; homes: number };
