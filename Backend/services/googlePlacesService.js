const seedPlaces = require("../data/chicagoPlacesSeed.json");
const { env, getGooglePlacesApiKey } = require("../config/environment");

const PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";
const PLACE_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.shortFormattedAddress",
  "places.location",
  "places.photos",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.types",
  "places.priceLevel",
  "places.rating",
  "places.userRatingCount",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.regularOpeningHours"
].join(",");
const PLACE_DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "shortFormattedAddress",
  "location",
  "photos",
  "primaryType",
  "primaryTypeDisplayName",
  "types",
  "priceLevel",
  "rating",
  "userRatingCount",
  "websiteUri",
  "googleMapsUri",
  "regularOpeningHours"
].join(",");

const CHICAGO_BOUNDS = {
  south: 41.6445,
  west: -87.9401,
  north: 42.023,
  east: -87.524
};

const CACHE_TTL_MS = 1000 * 60 * 10;
const searchCache = new Map();
const warnedMessages = new Set();

const CATEGORY_TO_TYPE = {
  Food: "restaurant",
  Bar: "bar",
  Landmark: "tourist_attraction",
  Activity: "tourist_attraction",
  Museum: "museum"
};

const PRICE_LEVEL_TO_PRICE = {
  PRICE_LEVEL_FREE: "Free",
  PRICE_LEVEL_INEXPENSIVE: "$",
  PRICE_LEVEL_MODERATE: "$$",
  PRICE_LEVEL_EXPENSIVE: "$$$",
  PRICE_LEVEL_VERY_EXPENSIVE: "$$$"
};

const PRICE_FILTERS = {
  cheap: ["PRICE_LEVEL_INEXPENSIVE"],
  moderate: ["PRICE_LEVEL_MODERATE"],
  expensive: ["PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"],
  "$": ["PRICE_LEVEL_INEXPENSIVE"],
  "$$": ["PRICE_LEVEL_MODERATE"],
  "$$$": ["PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"]
};

const CHICAGO_NEIGHBORHOOD_AREAS = [
  { name: "West Loop", south: 41.875, north: 41.895, west: -87.675, east: -87.635 },
  { name: "River North", south: 41.888, north: 41.91, west: -87.645, east: -87.62 },
  { name: "Downtown", south: 41.875, north: 41.889, west: -87.635, east: -87.615 },
  { name: "Streeterville", south: 41.886, north: 41.9, west: -87.625, east: -87.6 },
  { name: "Museum Campus", south: 41.86, north: 41.875, west: -87.63, east: -87.6 },
  { name: "Wicker Park", south: 41.9, north: 41.925, west: -87.69, east: -87.665 },
  { name: "Lincoln Park", south: 41.91, north: 41.94, west: -87.655, east: -87.62 },
  { name: "Logan Square", south: 41.91, north: 41.94, west: -87.72, east: -87.68 },
  { name: "Hyde Park", south: 41.785, north: 41.805, west: -87.61, east: -87.575 },
  { name: "Lakeview", south: 41.935, north: 41.955, west: -87.67, east: -87.63 },
  { name: "Pilsen", south: 41.845, north: 41.865, west: -87.68, east: -87.635 }
];

function googlePlacesApiKey() {
  return getGooglePlacesApiKey();
}

function googlePlacesReferer() {
  return (
    env("GOOGLE_MAPS_HTTP_REFERRER") ||
    env("APP_PUBLIC_URL") ||
    "http://localhost:3000/"
  );
}

function warnOnce(message) {
  if (warnedMessages.has(message)) return;
  warnedMessages.add(message);
  console.warn(message);
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function titleCase(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function cacheKey(body) {
  return JSON.stringify(body);
}

function getCached(key) {
  const entry = searchCache.get(key);
  if (!entry || Date.now() - entry.createdAt > CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }

  return entry.value;
}

function setCached(key, value) {
  searchCache.set(key, { createdAt: Date.now(), value });
}

function inChicagoBounds(location) {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= CHICAGO_BOUNDS.south &&
    latitude <= CHICAGO_BOUNDS.north &&
    longitude >= CHICAGO_BOUNDS.west &&
    longitude <= CHICAGO_BOUNDS.east
  );
}

function hasChicagoAddress(place) {
  const address = `${place.formattedAddress || ""} ${place.shortFormattedAddress || ""}`.toLowerCase();
  return /\bchicago\b/.test(address) && /\bil\b|\billinois\b/.test(address);
}

function isChicagoPlace(place) {
  return inChicagoBounds(place.location) && hasChicagoAddress(place);
}

function inferCategory(place) {
  const types = new Set(place.types || []);
  const primaryType = place.primaryType || "";
  const typeText = `${primaryType} ${[...types].join(" ")}`.toLowerCase();

  if (
    typeText.includes("restaurant") ||
    typeText.includes("cafe") ||
    typeText.includes("bakery") ||
    typeText.includes("meal")
  ) {
    return "Food";
  }
  if (typeText.includes("bar") || typeText.includes("night_club")) return "Bar";
  if (typeText.includes("museum") || typeText.includes("art_gallery")) return "Museum";
  if (
    typeText.includes("park") ||
    typeText.includes("zoo") ||
    typeText.includes("tourist_attraction") ||
    typeText.includes("point_of_interest")
  ) {
    return "Activity";
  }

  return place.primaryTypeDisplayName?.text || "Activity";
}

function inferNeighborhood(place) {
  const latitude = Number(place.location?.latitude);
  const longitude = Number(place.location?.longitude);
  const area = CHICAGO_NEIGHBORHOOD_AREAS.find((area) => (
    latitude >= area.south &&
    latitude <= area.north &&
    longitude >= area.west &&
    longitude <= area.east
  ));

  if (area) return area.name;

  const shortAddress = place.shortFormattedAddress || place.formattedAddress || "";
  const parts = shortAddress.split(",").map((part) => part.trim()).filter(Boolean);

  return parts.find((part) => !/\b(chicago|il|usa|\d{5})\b/i.test(part)) || "Chicago";
}

function photoUrl(photoName, width = 900, height = 560) {
  if (!photoName) return "";

  const params = new URLSearchParams({
    name: photoName,
    maxWidthPx: String(width),
    maxHeightPx: String(height)
  });

  return `/api/places/photo?${params.toString()}`;
}

function mapGooglePlace(place, categoryHint = "") {
  const name = place.displayName?.text || "Chicago spot";
  const category = categoryHint || inferCategory(place);
  const photoName = place.photos?.[0]?.name;
  const neighborhood = inferNeighborhood(place);
  const rating = Number(place.rating) || 0;
  const userRatingCount = Number(place.userRatingCount) || 0;
  const price = PRICE_LEVEL_TO_PRICE[place.priceLevel] || (category === "Activity" ? "Free" : "$$");
  const timeWindow = place.regularOpeningHours?.weekdayDescriptions?.[0]?.replace(/^[^:]+:\s*/, "") || "Hours vary";

  return {
    id: place.id,
    googlePlaceId: place.id,
    place_id: place.id,
    google_place_id: place.id,
    name,
    category,
    type: category === "Food" ? "food" : category === "Bar" ? "bar" : price === "Free" ? "free" : "activity",
    price,
    neighborhood,
    coordinates: {
      lat: place.location.latitude,
      lng: place.location.longitude
    },
    imageUrl: photoUrl(photoName),
    image: photoUrl(photoName, 640, 420),
    photoName,
    rating,
    userRatingCount,
    reviewUrl: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + " Chicago")}`,
    website: place.websiteUri || place.googleMapsUri || "",
    websiteUri: place.websiteUri || "",
    googleMapsUri: place.googleMapsUri || "",
    timeWindow,
    note: [
      place.primaryTypeDisplayName?.text || category,
      rating ? `${rating.toFixed(1)} stars` : "",
      userRatingCount ? `${userRatingCount.toLocaleString()} ratings` : ""
    ].filter(Boolean).join(", "),
    vibes: inferVibes(place, category),
    bestFor: [category.toLowerCase(), neighborhood, "Chicago"],
    description: place.formattedAddress || `A Google Places result in ${neighborhood}, Chicago.`,
    matchReason: `Found with Google Places in Chicago.`
  };
}

function inferVibes(place, category) {
  const types = new Set(place.types || []);
  const vibes = [];

  if (category === "Bar") vibes.push("nightlife", "drinks");
  if (category === "Food") vibes.push("foodie", "casual");
  if (category === "Museum") vibes.push("cultural", "quiet");
  if (types.has("tourist_attraction")) vibes.push("touristy", "scenic");
  if (types.has("park")) vibes.push("outdoors", "walkable");
  if (types.has("cafe")) vibes.push("coffee", "cozy");
  if (!vibes.length) vibes.push("local", "Chicago");

  return [...new Set(vibes)];
}

function queryForFilters(filters = {}) {
  const parts = [];
  const prompt = String(filters.prompt || "").trim();
  const vibe = String(filters.vibe || "").trim();
  const neighborhood = String(filters.neighborhood || "").trim();
  const category = String(filters.category || "").trim();

  if (prompt) parts.push(prompt);
  if (!prompt && vibe) parts.push(vibe.replace(/-/g, " "));
  if (!prompt && category) parts.push(category);
  if (!prompt && !category && !vibe) parts.push("best places");
  if (normalize(filters.budget) === "free") parts.push("free");
  if (neighborhood) parts.push(neighborhood);
  parts.push("Chicago IL");

  return parts.join(" ");
}

function bodyForTextSearch(filters = {}, pageSize = 12) {
  const body = {
    textQuery: queryForFilters(filters),
    pageSize,
    locationRestriction: {
      rectangle: {
        low: {
          latitude: CHICAGO_BOUNDS.south,
          longitude: CHICAGO_BOUNDS.west
        },
        high: {
          latitude: CHICAGO_BOUNDS.north,
          longitude: CHICAGO_BOUNDS.east
        }
      }
    },
    regionCode: "US",
    languageCode: "en"
  };

  const categoryType = CATEGORY_TO_TYPE[filters.category];
  if (categoryType) {
    body.includedType = categoryType;
  }

  const priceLevels = PRICE_FILTERS[normalize(filters.budget || filters.price)];
  if (priceLevels) {
    body.priceLevels = priceLevels;
  }

  return body;
}

async function textSearch(filters = {}, pageSize = 12) {
  const apiKey = googlePlacesApiKey();
  if (!apiKey) throw new Error("Missing GOOGLE_MAPS_API_KEY for Google Places API.");

  const body = bodyForTextSearch(filters, pageSize);
  const key = cacheKey(body);
  const cached = getCached(key);
  if (cached) return cached;

  const response = await fetch(PLACES_TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Referer": googlePlacesReferer(),
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACE_FIELD_MASK
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places Text Search failed (${response.status}): ${errorText.slice(0, 240)}`);
  }

  const data = await response.json();
  const places = (data.places || [])
    .filter(isChicagoPlace)
    .map((place) => mapGooglePlace(place, filters.category));

  setCached(key, places);
  return places;
}

async function getGooglePlaceDetails(googlePlaceId) {
  const apiKey = googlePlacesApiKey();
  if (!apiKey) throw new Error("Missing GOOGLE_PLACES_API_KEY for Google Places API.");
  if (!googlePlaceId) throw new Error("Missing Google place id.");

  const response = await fetch(`${PLACE_DETAILS_URL}/${encodeURIComponent(googlePlaceId)}`, {
    headers: {
      "Referer": googlePlacesReferer(),
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK
    }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Places Details failed (${response.status}): ${errorText.slice(0, 240)}`);
  }

  return response.json();
}

async function getDefaultGooglePlaces(limit = 18) {
  const searches = [
    { category: "Food", prompt: "popular restaurants" },
    { category: "Bar", prompt: "popular bars rooftops cocktails" },
    { category: "Activity", prompt: "tourist attractions activities museums parks" }
  ];

  const results = await Promise.all(searches.map((filters) => textSearch(filters, 8)));
  const interleavedPlaces = [];
  const maxLength = Math.max(...results.map((places) => places.length));

  for (let index = 0; index < maxLength; index += 1) {
    results.forEach((places) => {
      if (places[index]) interleavedPlaces.push(places[index]);
    });
  }

  return dedupePlaces(interleavedPlaces).slice(0, limit);
}

function dedupePlaces(places) {
  const byId = new Map();
  places.forEach((place) => {
    if (!place.id || byId.has(place.id)) return;
    byId.set(place.id, place);
  });

  return [...byId.values()];
}

function fallbackPlaces(filters = {}, limit = 12) {
  const category = normalize(filters.category);
  const neighborhood = normalize(filters.neighborhood);
  const budget = normalize(filters.budget || filters.price);
  const vibe = normalize(filters.vibe);
  const fallbackPriceMap = {
    cheap: ["$", "free"],
    free: ["free"],
    moderate: ["$$"],
    expensive: ["$$$"],
    "$": ["$"],
    "$$": ["$$"],
    "$$$": ["$$$"]
  };
  const allowedFallbackPrices = fallbackPriceMap[budget];

  return seedPlaces
    .filter((place) => !category || normalize(place.category) === category)
    .filter((place) => !neighborhood || normalize(place.neighborhood) === neighborhood)
    .filter((place) => !allowedFallbackPrices || allowedFallbackPrices.includes(normalize(place.price)))
    .filter((place) => !vibe || (place.vibes || []).some((item) => normalize(item).includes(vibe)))
    .map((place, index) => ({
      ...place,
      id: place.id || normalize(place.name).replace(/[^a-z0-9]+/g, "-"),
      googlePlaceId: "",
      place_id: "",
      google_place_id: "",
      image: place.imageUrl,
      type: normalize(place.category) === "food" ? "food" : normalize(place.category) === "bar" ? "bar" : normalize(place.price) === "free" ? "free" : "activity",
      rating: place.rating || 4.2,
      userRatingCount: 0,
      website: "",
      timeWindow: "Hours vary",
      note: (place.vibes || []).slice(0, 3).map(titleCase).join(", "),
      matchReason: index === 0
        ? "Google Places was unavailable, so this is from the Chicago fallback list."
        : "From the Chicago fallback list."
    }))
    .slice(0, limit);
}

async function searchChicagoPlaces(filters = {}, options = {}) {
  const limit = options.limit || 12;

  if (!googlePlacesApiKey()) {
    warnOnce("Google Places API key is not configured. Using local Chicago seed data.");
    return fallbackPlaces(filters, limit);
  }

  try {
    const places = Object.keys(filters).length
      ? await textSearch(filters, Math.min(20, Math.max(limit, 8)))
      : await getDefaultGooglePlaces(limit);

    return places.slice(0, limit);
  } catch (error) {
    warnOnce(`${error.message} Using local Chicago seed data.`);
    return fallbackPlaces(filters, limit);
  }
}

module.exports = {
  CHICAGO_BOUNDS,
  getGooglePlaceDetails,
  googlePlacesApiKey,
  googlePlacesReferer,
  searchChicagoPlaces
};
