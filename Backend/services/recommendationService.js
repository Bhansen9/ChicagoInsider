const places = require("../data/chicagoPlacesSeed.json");

const CATEGORY_ALIASES = {
  bars: "Bar",
  bar: "Bar",
  food: "Food",
  restaurant: "Food",
  restaurants: "Food",
  landmark: "Landmark",
  landmarks: "Landmark",
  activity: "Activity",
  activities: "Activity",
  museum: "Museum",
  museums: "Museum"
};

const PRICE_ALIASES = {
  cheap: ["$", "Free"],
  free: ["Free"],
  moderate: ["$$"],
  expensive: ["$$$"],
  "$": ["$"],
  "$$": ["$$"],
  "$$$": ["$$$"]
};

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function normalizeToken(value) {
  return normalize(value).replace(/\s+/g, "-");
}

function allowedPrices(price) {
  return PRICE_ALIASES[normalize(price)] || (price ? [price] : []);
}

function normalizeCategory(category) {
  const key = normalize(category);
  return CATEGORY_ALIASES[key] || category;
}

function scorePlace(place, filters) {
  let score = 0;
  const reasons = [];
  const requestedPrices = allowedPrices(filters.budget || filters.price);
  const requestedCategory = normalizeCategory(filters.category);
  const requestedNeighborhood = normalize(filters.neighborhood);
  const requestedVibe = normalizeToken(filters.vibe);

  if (requestedNeighborhood && normalize(place.neighborhood) === requestedNeighborhood) {
    score += 4;
    reasons.push(`matches ${place.neighborhood}`);
  }

  if (requestedCategory && normalize(place.category) === normalize(requestedCategory)) {
    score += 3;
    reasons.push(`fits ${place.category.toLowerCase()}`);
  }

  if (requestedPrices.length && requestedPrices.includes(place.price)) {
    score += 3;
    reasons.push(`works for ${place.price === "Free" ? "a free" : place.price} budget`);
  }

  if (requestedVibe && place.vibes.map(normalizeToken).includes(requestedVibe)) {
    score += 4;
    reasons.push(`has a ${filters.vibe} vibe`);
  }

  return {
    ...place,
    score,
    matchReason: reasons.length
      ? `Recommended because it ${reasons.join(", ")}.`
      : `Recommended from the curated Chicago dataset as a flexible option.`
  };
}

function matchesRequiredFilters(place, filters) {
  const requestedPrices = allowedPrices(filters.budget || filters.price);
  const requestedCategory = normalizeCategory(filters.category);
  const requestedNeighborhood = normalize(filters.neighborhood);
  const requestedVibe = normalizeToken(filters.vibe);
  const placeVibes = place.vibes.map(normalizeToken);

  if (requestedPrices.length && !requestedPrices.includes(place.price)) {
    return false;
  }

  if (requestedCategory && normalize(place.category) !== normalize(requestedCategory)) {
    return false;
  }

  if (requestedNeighborhood && normalize(place.neighborhood) !== requestedNeighborhood) {
    return false;
  }

  if (requestedVibe && !placeVibes.includes(requestedVibe)) {
    return false;
  }

  return true;
}

function recommendPlaces(filters = {}) {
  const scored = places
    .filter((place) => matchesRequiredFilters(place, filters))
    .map((place) => scorePlace(place, filters))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  return scored.slice(0, 6);
}

module.exports = {
  recommendPlaces
};
