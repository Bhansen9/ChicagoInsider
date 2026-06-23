const trendGrid = document.querySelector("#trendGrid");
const savedTrendCount = document.querySelector("#savedTrendCount");
const trendTabs = document.querySelectorAll(".trend-tab");
const skeletons = window.ChicagoInsiderSkeletons;
const auth = window.ChicagoInsiderAuth;
const playbookStorageKey = "chicagoInsider.playbookPlaces";
const API_BASE_URL = window.ChicagoInsiderApiBaseUrl ?? "http://localhost:3000";
const TRENDING_LIMIT = 12;
const TRENDING_FILTER_LIMIT = 12;
const TRENDING_SEARCHES = [
  {
    key: "food",
    label: "new restaurants",
    filters: {
      prompt: "new and popular restaurants people are talking about in Chicago this week",
      category: "Food"
    }
  },
  {
    key: "bar",
    label: "cocktail bars",
    filters: {
      prompt: "trending bars rooftop bars cocktail lounges and nightlife in Chicago this week",
      category: "Bar"
    }
  },
  {
    key: "activity",
    label: "weekend activities",
    filters: {
      prompt: "popular things to do museums parks activities in Chicago this week",
      category: "Activity"
    }
  },
  {
    key: "free",
    label: "free plans",
    filters: {
      prompt: "free things to do in Chicago this week",
      category: "Activity",
      budget: "free"
    }
  }
];

function resolveAssetUrl(url) {
  if (!url || !url.startsWith("/")) return url;
  return `${API_BASE_URL}${url}`;
}

let trendingPlaces = [];
let trendingPlacesByFilter = {};
let activeFilter = "all";
let savedPlaceIds = loadSavedPlaceIds();
let savedSpotByKey = new Map();

function loadSavedPlaceIds() {
  try {
    const value = JSON.parse(localStorage.getItem(playbookStorageKey) || "[]");
    return Array.isArray(value) ? value : [];
  } catch (error) {
    return [];
  }
}

function saveSavedPlaceIds() {
  try {
    localStorage.setItem(playbookStorageKey, JSON.stringify(savedPlaceIds));
  } catch (error) {
    // localStorage can be unavailable in restricted browser modes.
  }
}

function keysForStoredPlace(place = {}) {
  return [
    place.id,
    place.google_place_id,
    place.googlePlaceId,
    place.google_place_id?.startsWith("local:") ? place.google_place_id.slice(6) : "",
    place.name
  ].filter(Boolean).map(String);
}

function keysForDisplayPlace(place = {}) {
  return [
    place.id,
    place.googlePlaceId,
    place.google_place_id,
    place.place_id,
    `local:${place.id}`,
    place.name
  ].filter(Boolean).map(String);
}

function rememberSavedSpot(savedSpot) {
  keysForStoredPlace(savedSpot.place).forEach((key) => {
    savedSpotByKey.set(key, savedSpot);
    if (!savedPlaceIds.includes(key)) savedPlaceIds.push(key);
  });
}

async function loadSavedSpotsFromApi() {
  if (!auth.getSession()) return;
  const savedSpots = await auth.getSavedSpots();
  savedPlaceIds = [];
  savedSpotByKey = new Map();
  savedSpots.forEach(rememberSavedSpot);
  saveSavedPlaceIds();
}

function savedSpotForPlace(place) {
  return keysForDisplayPlace(place)
    .map((key) => savedSpotByKey.get(key))
    .find(Boolean);
}

function isPlaceSaved(place) {
  return keysForDisplayPlace(place).some((key) => savedPlaceIds.includes(key));
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function titleCase(value) {
  return String(value || "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function uniqueTrendingCandidates(candidates) {
  const byKey = new Map();

  candidates.forEach((candidate) => {
    const place = candidate.place || {};
    const key = String(
      place.googlePlaceId ||
      place.google_place_id ||
      place.place_id ||
      place.id ||
      place.name ||
      ""
    ).toLowerCase();

    if (!key || byKey.has(key)) return;
    byKey.set(key, candidate);
  });

  return [...byKey.values()];
}

function trendScore(candidate) {
  const place = candidate.place || {};
  const rating = Number(place.rating) || 0;
  const ratingCount = Number(place.userRatingCount || place.user_rating_count) || 0;
  const sourceBoost = (TRENDING_SEARCHES.length - candidate.sourceIndex) * 3;
  const photoBoost = place.image || place.imageUrl || place.photoName ? 4 : 0;

  return (rating * 18) + (Math.log10(ratingCount + 1) * 12) + sourceBoost + photoBoost;
}

function heatForPlace(place = {}) {
  const rating = Number(place.rating) || 0;
  const ratingCount = Number(place.userRatingCount || place.user_rating_count) || 0;

  if (rating && ratingCount) return `${rating.toFixed(1)} | ${ratingCount.toLocaleString()} ratings`;
  if (rating) return `${rating.toFixed(1)} on Google`;
  return "Live Chicago pick";
}

function bestForText(place = {}) {
  if (Array.isArray(place.bestFor) && place.bestFor.length) {
    return place.bestFor.map(titleCase).join(", ");
  }

  if (Array.isArray(place.vibes) && place.vibes.length) {
    return place.vibes.slice(0, 3).map(titleCase).join(", ");
  }

  return place.note || "Chicago plans";
}

function normalizeTrendingPlace(candidate, rank) {
  const place = candidate.place || {};
  const searchLabel = candidate.search?.label || "Chicago";
  const category = place.category || candidate.search?.filters?.category || "Activity";
  const price = place.price || (category === "Activity" ? "Free" : "$$");

  return {
    ...place,
    rank,
    category,
    price,
    type: place.type || (category === "Food" ? "food" : category === "Bar" ? "bar" : price === "Free" ? "free" : "activity"),
    image: resolveAssetUrl(place.image || place.imageUrl || "assets/pixel-chicago-hero.png"),
    heat: heatForPlace(place),
    reason: `Pulled from a live ${searchLabel} search, then ranked by rating, review activity, and photo quality.`,
    bestFor: bestForText(place),
    trendScore: trendScore(candidate)
  };
}

function rankedTrendingPlaces(candidates, limit = TRENDING_LIMIT) {
  return uniqueTrendingCandidates(candidates)
    .sort((a, b) => trendScore(b) - trendScore(a))
    .slice(0, limit)
    .map((candidate, index) => normalizeTrendingPlace(candidate, index + 1));
}

function candidateMatchesFilter(candidate, filter) {
  if (filter === "all") return true;
  const place = candidate.place || {};
  const searchKey = candidate.search?.key;

  if (filter === "free") return place.type === "free" || place.price === "Free" || searchKey === "free";
  return place.type === filter || searchKey === filter;
}

function trendingPlacesForFilter(filter) {
  return trendingPlacesByFilter[filter] || [];
}

function allLoadedTrendingPlaces() {
  return Object.values(trendingPlacesByFilter).flat();
}

function uniqueLoadedTrendingPlaces() {
  const byId = new Map();
  allLoadedTrendingPlaces().forEach((place) => {
    const key = String(place.googlePlaceId || place.google_place_id || place.place_id || place.id || place.name || "");
    if (key && !byId.has(key)) byId.set(key, place);
  });
  return [...byId.values()];
}

async function fetchTrendingSearch(search, sourceIndex) {
  const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(search.filters)
  });

  if (!response.ok) throw new Error(`Trending search failed for ${search.label}`);

  const data = await response.json();
  return (data.recommendations || []).map((place) => ({
    place,
    search,
    sourceIndex
  }));
}

async function loadFallbackTrendingCandidates() {
  const response = await fetch(`${API_BASE_URL}/api/places`);
  if (!response.ok) throw new Error("Could not load fallback Google Places");

  const data = await response.json();
  return (data.places || []).map((place) => ({
    place,
    search: { label: "Chicago places" },
    sourceIndex: TRENDING_SEARCHES.length
  }));
}

function renderTrendCard(place) {
  const isSaved = isPlaceSaved(place);
  const image = resolveAssetUrl(place.image || place.imageUrl || "assets/pixel-chicago-hero.png");
  const heat = place.heat || (place.rating ? `${Number(place.rating).toFixed(1)} on Google` : "Chicago pick");
  const reason = place.reason || place.description || "A Google Places result inside Chicago.";
  const bestFor = place.bestFor || (place.note ? place.note : "Chicago plans");

  return `
    <article class="trend-card">
      <div class="trend-image-wrap">
        <img src="${escapeHtml(image)}" alt="${escapeHtml(place.name)}" />
        <span class="rank-badge">#${place.rank}</span>
      </div>
      <div class="trend-card-body">
        <div class="trend-topline">
          <span class="pill">${escapeHtml(place.category)} | ${escapeHtml(place.price)}</span>
          <span class="heat">${escapeHtml(heat)}</span>
        </div>
        <h2>${escapeHtml(place.name)}</h2>
        <p class="neighborhood">${escapeHtml(place.neighborhood)}</p>
        <p class="reason">${escapeHtml(reason)}</p>
        <p class="best-for">${escapeHtml(bestFor)}</p>
        <button class="save-trend ${isSaved ? "is-saved" : ""}" type="button" data-place-id="${escapeHtml(place.id)}">
          ${isSaved ? "Saved" : "Save Spot"}
        </button>
      </div>
    </article>
  `;
}

async function loadTrendingPlacesFromApi() {
  const searchResults = await Promise.allSettled(
    TRENDING_SEARCHES.map((search, index) => fetchTrendingSearch(search, index))
  );
  let candidates = searchResults.flatMap((result) => (
    result.status === "fulfilled" ? result.value : []
  ));

  searchResults
    .filter((result) => result.status === "rejected")
    .forEach((result) => console.error(result.reason));

  if (!candidates.length) {
    candidates = await loadFallbackTrendingCandidates();
  } else {
    const barCandidates = candidates.filter((candidate) => candidateMatchesFilter(candidate, "bar"));
    if (barCandidates.length < TRENDING_FILTER_LIMIT) {
      const fallbackCandidates = await loadFallbackTrendingCandidates().catch((error) => {
        console.error(error);
        return [];
      });
      candidates = [
        ...candidates,
        ...fallbackCandidates.filter((candidate) => candidateMatchesFilter(candidate, "bar"))
      ];
    }
  }

  trendingPlaces = rankedTrendingPlaces(candidates, TRENDING_LIMIT);
  trendingPlacesByFilter = {
    all: trendingPlaces,
    food: rankedTrendingPlaces(candidates.filter((candidate) => candidateMatchesFilter(candidate, "food")), TRENDING_FILTER_LIMIT),
    bar: rankedTrendingPlaces(candidates.filter((candidate) => candidateMatchesFilter(candidate, "bar")), TRENDING_FILTER_LIMIT),
    activity: rankedTrendingPlaces(candidates.filter((candidate) => candidateMatchesFilter(candidate, "activity")), TRENDING_FILTER_LIMIT),
    free: rankedTrendingPlaces(candidates.filter((candidate) => candidateMatchesFilter(candidate, "free")), TRENDING_FILTER_LIMIT)
  };
}

function renderTrends() {
  const filteredPlaces = trendingPlacesForFilter(activeFilter);
  const activeFilterLabel = document.querySelector(`.trend-tab[data-filter="${activeFilter}"]`)?.textContent || "that filter";

  trendGrid.innerHTML = filteredPlaces.length
    ? filteredPlaces.map(renderTrendCard).join("")
    : `
        <div class="trend-empty-state">
          ${trendingPlaces.length
            ? `No ${escapeHtml(activeFilterLabel.toLowerCase())} picks loaded yet. Try another tab.`
            : "No trending places loaded yet. Make sure the backend server is running."}
        </div>
      `;
  skeletons?.markLoaded(trendGrid);
  window.cacheDisplayedPlaces?.(filteredPlaces);
  skeletons?.clearStat(savedTrendCount);
  savedTrendCount.textContent = uniqueLoadedTrendingPlaces().filter(isPlaceSaved).length;
}

trendTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeFilter = tab.dataset.filter;
    trendTabs.forEach((button) => {
      button.classList.toggle("active", button === tab);
    });
    renderTrends();
  });
});

trendGrid.addEventListener("click", async (event) => {
  const saveButton = event.target.closest("button[data-place-id]");
  if (!saveButton) return;

  const placeId = saveButton.dataset.placeId;
  const place = allLoadedTrendingPlaces().find((item) => String(item.id) === String(placeId));
  if (!place) return;

  saveButton.disabled = true;
  try {
    const savedSpot = savedSpotForPlace(place);
    if (savedSpot) {
      await auth.deleteSavedSpot(savedSpot.id);
    } else {
      await auth.saveSpot(place);
    }
    await loadSavedSpotsFromApi();
  } catch (error) {
    if (error.status !== 401) console.error(error);
  } finally {
    saveButton.disabled = false;
    renderTrends();
  }
});

async function initializeTrendingPage() {
  if (!skeletons) {
    await Promise.all([
      loadTrendingPlacesFromApi().catch(console.error),
      loadSavedSpotsFromApi().catch(console.error)
    ]);
    renderTrends();
    return;
  }

  skeletons.showTrendCards(trendGrid, 6);
  skeletons.showStat(savedTrendCount);
  await Promise.all([
    loadTrendingPlacesFromApi().catch(console.error),
    loadSavedSpotsFromApi().catch(console.error)
  ]);
  renderTrends();
}

initializeTrendingPage();
