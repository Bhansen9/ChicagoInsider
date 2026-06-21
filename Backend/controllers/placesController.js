const seedPlaces = require("../data/chicagoPlacesSeed.json");
const { googlePlacesApiKey, googlePlacesReferer, searchChicagoPlaces } = require("../services/googlePlacesService");
const { PlaceCacheError, getOrCreatePlace } = require("../services/placeCacheService");

async function getPlaces(req, res, next) {
  try {
    const places = await searchChicagoPlaces({}, { limit: 18 });
    res.json({ places, source: "google-places" });
  } catch (error) {
    next(error);
  }
}

async function getFilterOptions(req, res, next) {
  const unique = (values) => [...new Set(values.flat().filter(Boolean))].sort();

  try {
    const places = await searchChicagoPlaces({}, { limit: 18 });
    res.json({
      neighborhoods: unique(places.map((place) => place.neighborhood)),
      categories: unique(places.map((place) => place.category)),
      prices: unique(places.map((place) => place.price)),
      vibes: unique(places.map((place) => place.vibes))
    });
  } catch (error) {
    res.json({
      neighborhoods: unique(seedPlaces.map((place) => place.neighborhood)),
      categories: unique(seedPlaces.map((place) => place.category)),
      prices: unique(seedPlaces.map((place) => place.price)),
      vibes: unique(seedPlaces.map((place) => place.vibes))
    });
  }
}

async function getPlacePhoto(req, res, next) {
  const { name, lat, lng, heading = 0, pitch = 0 } = req.query;
  const googleMapsApiKey = googlePlacesApiKey();

  if (googleMapsApiKey && name) {
    try {
      const photoUrl = new URL(`https://places.googleapis.com/v1/${String(name).replace(/^\/+/, "")}/media`);
      photoUrl.searchParams.set("maxWidthPx", req.query.maxWidthPx || "900");
      photoUrl.searchParams.set("maxHeightPx", req.query.maxHeightPx || "560");
      photoUrl.searchParams.set("key", googleMapsApiKey);

      const response = await fetch(photoUrl, {
        headers: {
          Referer: googlePlacesReferer()
        }
      });

      if (!response.ok) {
        throw new Error(`Google Places photo failed with status ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      const imageBuffer = Buffer.from(await response.arrayBuffer());

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      res.send(imageBuffer);
    } catch (error) {
      next(error);
    }
    return;
  }

  if (!googleMapsApiKey || !lat || !lng) {
    res.status(400).send("Missing map photo configuration.");
    return;
  }

  const photoUrl = new URL("https://maps.googleapis.com/maps/api/streetview");
  photoUrl.searchParams.set("size", "900x560");
  photoUrl.searchParams.set("location", `${lat},${lng}`);
  photoUrl.searchParams.set("heading", heading);
  photoUrl.searchParams.set("pitch", pitch);
  photoUrl.searchParams.set("fov", "78");
  photoUrl.searchParams.set("source", "outdoor");
  photoUrl.searchParams.set("key", googleMapsApiKey);

  res.redirect(photoUrl.toString());
}

async function getPlaceByGooglePlaceId(req, res, next) {
  try {
    const result = await getOrCreatePlace(req.params.googlePlaceId);
    res.setHeader("X-Place-Cache", result.source);
    res.json(result.place);
  } catch (error) {
    next(error);
  }
}

async function cachePlace(req, res, next) {
  try {
    const googlePlaceId = req.body?.googlePlaceId || req.body?.google_place_id;
    const result = await getOrCreatePlace(googlePlaceId);
    res.setHeader("X-Place-Cache", result.source);
    res.status(result.source === "google" ? 201 : 200).json(result.place);
  } catch (error) {
    next(error);
  }
}

function handlePlaceCacheError(error, req, res, next) {
  if (!(error instanceof PlaceCacheError)) {
    return next(error);
  }

  if (error.statusCode >= 500 || error.cause) {
    console.error(error.cause || error);
  }

  res.status(error.statusCode).json({
    error: error.message,
    code: error.code
  });
}

module.exports = {
  cachePlace,
  getPlaces,
  getFilterOptions,
  getPlaceByGooglePlaceId,
  getPlacePhoto,
  handlePlaceCacheError
};
