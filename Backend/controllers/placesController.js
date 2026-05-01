const places = require("../data/chicagoPlacesSeed.json");

function getPlaces(req, res) {
  res.json({ places });
}

function getFilterOptions(req, res) {
  const unique = (values) => [...new Set(values.flat().filter(Boolean))].sort();

  res.json({
    neighborhoods: unique(places.map((place) => place.neighborhood)),
    categories: unique(places.map((place) => place.category)),
    prices: unique(places.map((place) => place.price)),
    vibes: unique(places.map((place) => place.vibes))
  });
}

function getPlacePhoto(req, res) {
  const { lat, lng, heading = 0, pitch = 0 } = req.query;
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;

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

module.exports = {
  getPlaces,
  getFilterOptions,
  getPlacePhoto
};
