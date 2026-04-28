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

module.exports = {
  getPlaces,
  getFilterOptions
};
