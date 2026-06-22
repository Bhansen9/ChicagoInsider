const supabase = require("../data/supabaseClient");
const { getGooglePlaceDetails, googlePlacesApiKey } = require("./googlePlacesService");

class PlaceCacheError extends Error {
  constructor(message, statusCode = 500, code = "PLACE_CACHE_ERROR", cause = null) {
    super(message);
    this.name = "PlaceCacheError";
    this.statusCode = statusCode;
    this.code = code;
    this.cause = cause;
  }
}

function normalizeGooglePlaceId(googlePlaceId) {
  return String(googlePlaceId || "").trim();
}

function inferCategory(place) {
  const typeText = `${place.primaryType || ""} ${(place.types || []).join(" ")}`.toLowerCase();

  if (typeText.includes("restaurant") || typeText.includes("cafe") || typeText.includes("meal")) {
    return "Food";
  }
  if (typeText.includes("bar") || typeText.includes("night_club")) return "Bar";
  if (typeText.includes("museum") || typeText.includes("art_gallery")) return "Museum";
  if (typeText.includes("tourist_attraction") || typeText.includes("park")) return "Activity";

  return place.primaryTypeDisplayName?.text || "Activity";
}

function photoUrl(photoName, width = 640, height = 420) {
  if (!photoName) return null;

  const params = new URLSearchParams({
    name: photoName,
    maxWidthPx: String(width),
    maxHeightPx: String(height)
  });

  return `/api/places/photo?${params.toString()}`;
}

function mapGoogleDetailsToPlaceRow(googlePlace) {
  const photoName = googlePlace.photos?.[0]?.name || null;
  return {
    google_place_id: googlePlace.id,
    name: googlePlace.displayName?.text || "Unnamed place",
    address: googlePlace.formattedAddress || googlePlace.shortFormattedAddress || "",
    formatted_address: googlePlace.formattedAddress || googlePlace.shortFormattedAddress || "",
    latitude: googlePlace.location?.latitude ?? null,
    longitude: googlePlace.location?.longitude ?? null,
    category: inferCategory(googlePlace),
    primary_type: googlePlace.primaryType || null,
    photo_references: photoName ? [photoName] : [],
    raw_google_payload: googlePlace,
    metadata: {
      source: "google-places",
      image: photoUrl(photoName),
      neighborhood: null,
      price: null,
      note: googlePlace.primaryTypeDisplayName?.text || null
    }
  };
}

function placeHasPhotoMetadata(place = {}) {
  const metadata = place.metadata || {};
  const photoReferences = Array.isArray(place.photo_references) ? place.photo_references : [];
  const rawPayload = place.raw_google_payload || {};

  return Boolean(
    metadata.image ||
    photoReferences.length ||
    rawPayload.photoName ||
    rawPayload.photos?.[0]?.name
  );
}

async function findPlaceByGooglePlaceId(googlePlaceId) {
  try {
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .eq("google_place_id", googlePlaceId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw new PlaceCacheError(
      "Could not check Supabase for this place.",
      500,
      "SUPABASE_LOOKUP_FAILED",
      error
    );
  }
}

async function updatePlaceRow(googlePlaceId, placeRow) {
  const client = supabase.getSupabaseServiceClient?.() || supabase;

  const updateWithRow = (row) => client
    .from("places")
    .update(row)
    .eq("google_place_id", googlePlaceId)
    .select("*")
    .single();

  const { address, ...rowWithoutAddress } = placeRow;
  let result = await updateWithRow(placeRow);
  if (result.error && usesMissingAddressColumn(result.error)) {
    result = await updateWithRow(rowWithoutAddress);
  }

  if (result.error) {
    throw new PlaceCacheError(
      "Could not refresh the Google place in Supabase.",
      500,
      "SUPABASE_REFRESH_FAILED",
      result.error
    );
  }

  return result.data;
}

function usesMissingAddressColumn(error) {
  return (
    error?.code === "PGRST204" &&
    String(error.message || "").toLowerCase().includes("address")
  );
}

function isSupabasePermissionError(error) {
  return error?.code === "42501";
}

async function insertPlaceRow(placeRow) {
  try {
    const { data, error } = await supabase
      .from("places")
      .insert(placeRow)
      .select("*")
      .single();

    if (!error) return data;

    if (usesMissingAddressColumn(error)) {
      const { address, ...rest } = placeRow;
      const fallbackRow = {
        ...rest,
        formatted_address: address
      };

      const fallbackResult = await supabase
        .from("places")
        .insert(fallbackRow)
        .select("*")
        .single();

      if (!fallbackResult.error) return fallbackResult.data;
      throw fallbackResult.error;
    }

    if (error.code === "23505") {
      return findPlaceByGooglePlaceId(placeRow.google_place_id);
    }

    throw error;
  } catch (error) {
    if (error.code === "23505") {
      return findPlaceByGooglePlaceId(placeRow.google_place_id);
    }

    if (isSupabasePermissionError(error)) {
      throw new PlaceCacheError(
        "Supabase rejected the insert. Add SUPABASE_SERVICE_ROLE_KEY to Backend/.env so only the backend can bypass RLS.",
        500,
        "SUPABASE_INSERT_PERMISSION_DENIED",
        error
      );
    }

    throw new PlaceCacheError(
      "Could not save the Google place into Supabase.",
      500,
      "SUPABASE_INSERT_FAILED",
      error
    );
  }
}

async function getOrCreatePlace(googlePlaceIdInput) {
  const googlePlaceId = normalizeGooglePlaceId(googlePlaceIdInput);
  if (!googlePlaceId) {
    throw new PlaceCacheError("googlePlaceId is required.", 400, "MISSING_GOOGLE_PLACE_ID");
  }

  // 1. Cache lookup: Supabase is the source of truth once a Google place has been saved.
  const existingPlace = await findPlaceByGooglePlaceId(googlePlaceId);
  if (!googlePlacesApiKey()) {
    if (existingPlace) return { place: existingPlace, source: "supabase" };
    throw new PlaceCacheError(
      "Google Places API key is missing. Set GOOGLE_PLACES_API_KEY in .env.",
      500,
      "MISSING_GOOGLE_PLACES_API_KEY"
    );
  }

  if (existingPlace && placeHasPhotoMetadata(existingPlace)) {
    return { place: existingPlace, source: "supabase" };
  }

  // 2. Cache miss, or stale cached row: fetch Google details to create/refresh display metadata.
  let googlePlace;
  try {
    googlePlace = await getGooglePlaceDetails(googlePlaceId);
  } catch (error) {
    throw new PlaceCacheError(
      "Google Places API failed while fetching this place.",
      502,
      "GOOGLE_PLACES_API_FAILED",
      error
    );
  }

  if (!googlePlace || !googlePlace.id) {
    throw new PlaceCacheError("Google Places could not find this place.", 404, "GOOGLE_PLACE_NOT_FOUND");
  }

  if (existingPlace) {
    const refreshedPlace = await updatePlaceRow(googlePlaceId, mapGoogleDetailsToPlaceRow(googlePlace));
    return { place: refreshedPlace, source: "refreshed" };
  }

  // 3. Persist and return the saved row. The unique index protects against duplicate races.
  const savedPlace = await insertPlaceRow(mapGoogleDetailsToPlaceRow(googlePlace));
  if (!savedPlace) {
    throw new PlaceCacheError(
      "The place was inserted by another request but could not be loaded.",
      500,
      "SUPABASE_INSERT_LOOKUP_FAILED"
    );
  }

  return { place: savedPlace, source: "google" };
}

module.exports = {
  PlaceCacheError,
  getOrCreatePlace
};
