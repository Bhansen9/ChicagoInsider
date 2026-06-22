const { getSupabaseClient, getSupabaseServiceClient } = require("../data/supabaseClient");
const { ApiError } = require("./authService");
const { getOrCreatePlace } = require("./placeCacheService");

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function slug(value) {
  return String(value || "chicago-place")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "chicago-place";
}

function priceLevel(price) {
  return {
    Free: 0,
    "$": 1,
    "$$": 2,
    "$$$": 3
  }[String(price || "").trim()] ?? null;
}

function coordinatesFrom(input) {
  const coordinates = input.coordinates || {};
  const latitude = input.latitude ?? input.lat ?? coordinates.lat ?? coordinates.latitude;
  const longitude = input.longitude ?? input.lng ?? coordinates.lng ?? coordinates.longitude;

  return {
    latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
    longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null
  };
}

function googlePlaceIdFrom(input = {}) {
  const candidate = input.googlePlaceId || input.google_place_id || input.place_id;
  if (candidate) return String(candidate).trim();

  const id = String(input.placeId || input.id || "").trim();
  if (id && !UUID_PATTERN.test(id)) return `local:${slug(id)}`;

  return `local:${slug(input.name)}`;
}

function placeNameFrom(input = {}) {
  return String(input.name || input.title || "Chicago place").trim().slice(0, 160);
}

function hasDisplayMetadata(input = {}) {
  return Boolean(
    input.image ||
    input.imageUrl ||
    input.photoName ||
    input.neighborhood ||
    input.price ||
    input.note ||
    input.description
  );
}

function mapInputToPlaceRow(input = {}) {
  const { latitude, longitude } = coordinatesFrom(input);
  const photoReferences = input.photoName ? [input.photoName] : [];

  return {
    google_place_id: googlePlaceIdFrom(input),
    name: placeNameFrom(input),
    formatted_address: input.formatted_address || input.address || input.description || null,
    category: input.category || null,
    primary_type: input.primaryType || input.type || null,
    price_level: priceLevel(input.price),
    latitude,
    longitude,
    website_url: input.website || input.websiteUri || null,
    google_maps_url: input.googleMapsUri || input.reviewUrl || null,
    photo_references: photoReferences,
    raw_google_payload: input,
    metadata: {
      source: input.googlePlaceId || input.google_place_id ? "google-places" : "frontend",
      image: input.image || input.imageUrl || null,
      neighborhood: input.neighborhood || null,
      price: input.price || null,
      note: input.note || null
    }
  };
}

async function getPlaceById(placeId) {
  if (!UUID_PATTERN.test(String(placeId || ""))) return null;
  const supabase = getSupabaseServiceClient() || getSupabaseClient();
  if (!supabase) throw new ApiError("Supabase is not configured.", 503, "SUPABASE_NOT_CONFIGURED");

  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("id", placeId)
    .maybeSingle();

  if (error) throw new ApiError(error.message, 500, "PLACE_LOOKUP_FAILED");
  return data;
}

async function upsertPlaceFromInput(input = {}) {
  const supabase = getSupabaseServiceClient() || getSupabaseClient();
  if (!supabase) throw new ApiError("Supabase is not configured.", 503, "SUPABASE_NOT_CONFIGURED");

  const row = mapInputToPlaceRow(input);
  const { data, error } = await supabase
    .from("places")
    .upsert(row, { onConflict: "google_place_id" })
    .select("*")
    .single();

  if (error) throw new ApiError(error.message, 500, "PLACE_UPSERT_FAILED");
  return data;
}

async function ensurePlace(input = {}) {
  const placeId = input.placeId || input.id;
  const existingById = await getPlaceById(placeId);
  if (existingById) return existingById;

  const googlePlaceId = input.googlePlaceId || input.google_place_id || input.place_id;
  if (googlePlaceId) {
    try {
      const result = await getOrCreatePlace(googlePlaceId);
      if (result?.place) {
        if (hasDisplayMetadata(input)) {
          return upsertPlaceFromInput({
            ...input,
            placeId: result.place.id,
            id: result.place.id,
            googlePlaceId
          });
        }
        return result.place;
      }
    } catch (error) {
      if (!["MISSING_GOOGLE_PLACES_API_KEY", "GOOGLE_PLACES_API_FAILED"].includes(error.code)) {
        throw error;
      }
    }
  }

  return upsertPlaceFromInput({
    ...input,
    id: placeId
  });
}

function publicPlace(place = {}) {
  const metadata = place.metadata || {};
  return {
    id: place.id,
    googlePlaceId: place.google_place_id,
    name: place.name,
    category: place.category,
    neighborhood: metadata.neighborhood || null,
    price: metadata.price || null,
    image: metadata.image || null,
    note: metadata.note || null,
    formatted_address: place.formatted_address,
    latitude: place.latitude,
    longitude: place.longitude
  };
}

module.exports = {
  ensurePlace,
  publicPlace
};
