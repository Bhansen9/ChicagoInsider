const trendGrid = document.querySelector("#trendGrid");
const savedTrendCount = document.querySelector("#savedTrendCount");
const trendTabs = document.querySelectorAll(".trend-tab");
const skeletons = window.ChicagoInsiderSkeletons;
const playbookStorageKey = "chicagoInsider.playbookPlaces";
const isBackendOrigin = ["localhost:3000", "127.0.0.1:3000"].includes(window.location.host);
const API_BASE_URL = window.location.protocol === "file:" || !isBackendOrigin
  ? "http://localhost:3000"
  : "";

function resolveAssetUrl(url) {
  if (!url || !url.startsWith("/")) return url;
  return `${API_BASE_URL}${url}`;
}

let trendingPlaces = [
  {
    id: "cindy",
    rank: 1,
    name: "Cindy's Rooftop",
    category: "Bar",
    type: "bar",
    price: "$$$",
    neighborhood: "Downtown",
    heat: "Hot for views",
    image: "https://cdn.prod.website-files.com/692deee1433d0acae210e525/6930b2963bc306834dd9c99c_Daniel%20Kelleghan%20Photography-2024-03-25%20Cindys57247-HDR.avif",
    reason: "Rooftop season energy, skyline photos, and easy pre-show plans around Millennium Park.",
    bestFor: "Rooftop drinks, brunch, groups"
  },
  {
    id: "riverwalk",
    rank: 2,
    name: "Chicago Riverwalk",
    category: "Activity",
    type: "activity",
    price: "Free",
    neighborhood: "River North",
    heat: "Most saved walk",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Riverwalk%20%2851556708640%29.jpg?width=900",
    reason: "Low-cost, scenic, flexible, and easy to pair with food or drinks nearby.",
    bestFor: "Walkable plans, views, visitors"
  },
  {
    id: "au-cheval",
    rank: 3,
    name: "Au Cheval",
    category: "Food",
    type: "food",
    price: "$$$",
    neighborhood: "West Loop",
    heat: "Food queue magnet",
    image: "https://images.squarespace-cdn.com/content/v1/67223ccb89a1690d7a80caa4/1732119030238-4C3W8KF5GEIN0ZR2Z5XA/auc1-29.jpg",
    reason: "Still a go-to pick for burger runs and West Loop dinner plans.",
    bestFor: "Foodie nights, late dinners"
  },
  {
    id: "millennium",
    rank: 4,
    name: "Millennium Park",
    category: "Landmark",
    type: "free",
    price: "Free",
    neighborhood: "Downtown",
    heat: "Visitor favorite",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Millennium%20park%2Cchicago.JPG?width=900",
    reason: "A reliable anchor stop for photos, first visits, and downtown wandering.",
    bestFor: "Photos, first-time visitors"
  },
  {
    id: "violet-hour",
    rank: 5,
    name: "The Violet Hour",
    category: "Bar",
    type: "bar",
    price: "$$$",
    neighborhood: "Wicker Park",
    heat: "Date-night spike",
    image: "https://images.squarespace-cdn.com/content/v1/5689f7a2c21b8690d5c16c46/1626115529676-3NAZ1D98F1VN338QGJW4/tvh7.jpeg",
    reason: "A polished cocktail stop that works well after dinner in Wicker Park.",
    bestFor: "Cocktails, dates, quiet nights"
  },
  {
    id: "lincoln-park-zoo",
    rank: 6,
    name: "Lincoln Park Zoo",
    category: "Activity",
    type: "free",
    price: "Free",
    neighborhood: "Lincoln Park",
    heat: "Free-plan favorite",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lincoln%20Park%20Zoo%2C%20Chicago%2C%20United%20States%20%28Unsplash%20LfGqCrLmhp0%29.jpg?width=900",
    reason: "Free admission, walkable nearby parks, and a calm afternoon pace.",
    bestFor: "Low-cost outings, families"
  }
];

let activeFilter = "all";
let savedPlaceIds = loadSavedPlaceIds();

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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderTrendCard(place) {
  const isSaved = savedPlaceIds.includes(place.id);
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
  const response = await fetch(`${API_BASE_URL}/api/places`);
  if (!response.ok) throw new Error("Could not load Google Places");

  const data = await response.json();
  if (!Array.isArray(data.places) || !data.places.length) return;

  trendingPlaces = data.places
    .slice()
    .sort((a, b) => (
      (Number(b.rating) || 0) - (Number(a.rating) || 0) ||
      (Number(b.userRatingCount) || 0) - (Number(a.userRatingCount) || 0)
    ))
    .slice(0, 8)
    .map((place, index) => ({
      ...place,
      rank: index + 1,
      image: resolveAssetUrl(place.image || place.imageUrl || "assets/pixel-chicago-hero.png"),
      heat: place.rating ? `${Number(place.rating).toFixed(1)} on Google` : "Chicago pick",
      reason: place.description || "A Google Places result inside Chicago.",
      bestFor: place.note || "Chicago plans"
    }));
}

function renderTrends() {
  const filteredPlaces = trendingPlaces.filter((place) => (
    activeFilter === "all" || place.type === activeFilter
  ));

  trendGrid.innerHTML = filteredPlaces.map(renderTrendCard).join("");
  skeletons?.markLoaded(trendGrid);
  skeletons?.clearStat(savedTrendCount);
  savedTrendCount.textContent = trendingPlaces.filter((place) => savedPlaceIds.includes(place.id)).length;
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

trendGrid.addEventListener("click", (event) => {
  const saveButton = event.target.closest("button[data-place-id]");
  if (!saveButton) return;

  const placeId = saveButton.dataset.placeId;
  savedPlaceIds = savedPlaceIds.includes(placeId)
    ? savedPlaceIds.filter((id) => id !== placeId)
    : [...savedPlaceIds, placeId];

  saveSavedPlaceIds();
  renderTrends();
});

function initializeTrendingPage() {
  if (!skeletons) {
    loadTrendingPlacesFromApi().catch(console.error).finally(renderTrends);
    return;
  }

  skeletons.showTrendCards(trendGrid, 6);
  skeletons.showStat(savedTrendCount);
  loadTrendingPlacesFromApi().catch(console.error).finally(renderTrends);
}

initializeTrendingPage();
