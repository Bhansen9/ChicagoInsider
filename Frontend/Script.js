const form = document.querySelector("#recommendationForm");
const placeGrid = document.querySelector("#placeGrid");
const resultsSummary = document.querySelector("#resultsSummary");
const categoryInput = document.querySelector("#categoryInput");
const categoryChips = document.querySelector("#categoryChips");
const startExploringBtn = document.querySelector("#startExploringBtn");
const mapPreview = document.querySelector("#mapPreview");
const clearFiltersBtn = document.querySelector("#clearFiltersBtn");
const assistantInput = document.querySelector("#assistantInput");
const assistantChat = document.querySelector("#assistantChat");
const heroSearchForm = document.querySelector("#heroSearchForm");
const heroSearchInput = document.querySelector("#heroSearchInput");
const heroBgImageA = document.querySelector("#heroBgImageA");
const heroBgImageB = document.querySelector("#heroBgImageB");

const chicagoHeroSlides = [
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Skyline%20on%20the%20Chicago%20River.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20skyline%20from%20river.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Skyline%20%2853665880118%29.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/ChicagoDowntownSkyline.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20River%20%40%20night.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Skyline%20%2844713240565%29.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Skyline%20%2814908021282%29.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Skyline%20%2811848279395%29.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Full%20chicago%20skyline.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Skyline%20%285946457274%29.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Skyline%20%2810546216053%29.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Cloud%20gate%2C%20Chicago%20skyline.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20River%20Skyline%20196821944.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Skyline%20%284768676199%29.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Skyline%20%2831630363452%29.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20skyline%20at%20night%20%2843378201330%29.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20skyline%20at%20night%20%2845191638871%29.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20River%20and%20downtown%20skyline%20at%20night%20%2849768092838%29.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Night%20River.jpg?width=1800",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Mike%20Chicago%20Skyline.jpg?width=1800"
];

const PLACE_IMAGE_FALLBACKS = {
  "Millennium Park": "https://commons.wikimedia.org/wiki/Special:FilePath/Millennium%20park%2Cchicago.JPG?width=900",
  "Chicago Riverwalk": "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Riverwalk%20%2851556708640%29.jpg?width=900",
  "The Art Institute of Chicago": "https://commons.wikimedia.org/wiki/Special:FilePath/Art%20Institute%20of%20Chicago%20Lion%20%288519756704%29.jpg?width=900",
  "Au Cheval": "https://images.squarespace-cdn.com/content/v1/67223ccb89a1690d7a80caa4/1732119030238-4C3W8KF5GEIN0ZR2Z5XA/auc1-29.jpg",
  "Small Cheval": "https://images.squarespace-cdn.com/content/v1/664b756924d01f2bafa19992/bfae2152-f1c0-4280-80f5-11ea7e0860db/new-shots-outdoor-2.jpeg",
  "LondonHouse Rooftop": "https://commons.wikimedia.org/wiki/Special:FilePath/London%20House%20Rooftop%2C%20Chicago.jpg?width=900",
  "Lincoln Park Zoo": "https://commons.wikimedia.org/wiki/Special:FilePath/Lincoln%20Park%20Zoo%2C%20Chicago%2C%20United%20States%20%28Unsplash%20LfGqCrLmhp0%29.jpg?width=900",
  "Navy Pier": "https://commons.wikimedia.org/wiki/Special:FilePath/Navy%20Pier%2C%20Chicago%2C%20Illinois%20%2811004497314%29.jpg?width=900",
  "The Violet Hour": "https://images.squarespace-cdn.com/content/v1/5689f7a2c21b8690d5c16c46/1626115529676-3NAZ1D98F1VN338QGJW4/tvh7.jpeg",
  "Lou Malnati's": "https://commons.wikimedia.org/wiki/Special:FilePath/Lou%20Malnati%27s%20%287705519362%29.jpg?width=900",
  "Cindy's Rooftop": "https://cdn.prod.website-files.com/692deee1433d0acae210e525/6930b2963bc306834dd9c99c_Daniel%20Kelleghan%20Photography-2024-03-25%20Cindys57247-HDR.avif",
  "Garfield Park Conservatory": "https://commons.wikimedia.org/wiki/Special:FilePath/Garfield%20Park%20Conservatory%20%28Chicago%29%20%2838106651681%29.jpg?width=900"
};

const API_BASE_URL =
  window.location.protocol === "file:" || window.location.host !== "localhost:3000"
    ? "http://localhost:3000"
    : "";

function resolveAssetUrl(url) {
  if (!url || !url.startsWith("/")) return url;
  return `${API_BASE_URL}${url}`;
}

let chicagoMap;
let googleMapsPromise;
let mapMarkers = [];
let filterSearchTimer;
let hasLoadedInitialPlaces = false;
let heroSlideIndex = 0;
let showingHeroImageA = true;
let heroSlideshowTimer;

function titleCase(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function preloadHeroSlide(src) {
  const image = new Image();
  image.src = src;
}

function fadeHeroBackground(newSrc) {
  if (!heroBgImageA || !heroBgImageB) return;

  const currentImage = showingHeroImageA ? heroBgImageA : heroBgImageB;
  const nextImage = showingHeroImageA ? heroBgImageB : heroBgImageA;

  nextImage.onload = () => {
    nextImage.classList.add("active");
    currentImage.classList.remove("active");
    showingHeroImageA = !showingHeroImageA;
    nextImage.onload = null;
  };

  nextImage.src = newSrc;
}

function startHeroSlideshow() {
  if (!heroBgImageA || !heroBgImageB || heroSlideshowTimer) return;

  heroBgImageA.src = chicagoHeroSlides[0];
  chicagoHeroSlides.slice(1, 4).forEach(preloadHeroSlide);

  heroSlideshowTimer = window.setInterval(() => {
    heroSlideIndex = (heroSlideIndex + 1) % chicagoHeroSlides.length;
    fadeHeroBackground(chicagoHeroSlides[heroSlideIndex]);
    preloadHeroSlide(chicagoHeroSlides[(heroSlideIndex + 1) % chicagoHeroSlides.length]);
  }, 3000);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function restaurantMeta(place) {
  const rating = Number(place.rating);
  if (!rating || !place.reviewUrl) return "";

  const roundedStars = Math.max(0, Math.min(5, Math.round(rating)));
  const stars = Array.from({ length: 5 }, (_, index) => (
    index < roundedStars ? "&#9733;" : "&#9734;"
  )).join("");

  return `
    <div class="restaurant-meta">
      <span class="stars" aria-label="${rating.toFixed(1)} out of 5 stars">${stars}</span>
      <span>${rating.toFixed(1)}</span>
      <a href="${escapeHtml(place.reviewUrl)}" target="_blank" rel="noopener noreferrer">Yelp reviews</a>
    </div>
  `;
}

function usePlaceImageFallback(image) {
  const fallback = PLACE_IMAGE_FALLBACKS[image.dataset.placeName] || PLACE_IMAGE_FALLBACKS["Chicago Riverwalk"];
  const fallbackUrl = resolveAssetUrl(fallback);
  if (image.src === fallbackUrl) return;
  image.src = fallbackUrl;
}

window.usePlaceImageFallback = usePlaceImageFallback;

function placeImageUrl(place) {
  if (!place.imageUrl || place.imageUrl.startsWith("/api/places/photo")) {
    return PLACE_IMAGE_FALLBACKS[place.name] || PLACE_IMAGE_FALLBACKS["Chicago Riverwalk"];
  }

  return resolveAssetUrl(place.imageUrl);
}

function renderLoading(message = "Finding Chicago spots...") {
  placeGrid.innerHTML = `<p class="empty-state">${message}</p>`;
}

function renderError() {
  placeGrid.innerHTML = `
    <div class="empty-state error-state">
      Could not load recommendations. Make sure the backend server is running.
    </div>
  `;
}

async function loadGoogleMaps() {
  if (window.google?.maps) return window.google.maps;
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = fetch(`${API_BASE_URL}/api/config/maps`)
    .then((response) => response.json())
    .then(({ googleMapsApiKey }) => {
      if (!googleMapsApiKey) {
        throw new Error("Missing Google Maps API key");
      }

      return new Promise((resolve, reject) => {
        window.initChicagoLensMap = () => resolve(window.google.maps);

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsApiKey)}&callback=initChicagoLensMap`;
        script.async = true;
        script.defer = true;
        script.onerror = () => reject(new Error("Google Maps failed to load"));
        document.head.appendChild(script);
      });
    });

  return googleMapsPromise;
}

async function ensureMap() {
  const maps = await loadGoogleMaps();

  if (!chicagoMap) {
    chicagoMap = new maps.Map(mapPreview, {
      center: { lat: 41.8781, lng: -87.6298 },
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });
  }

  return { maps, map: chicagoMap };
}

async function updateMapMarkers(places = []) {
  try {
    const { maps, map } = await ensureMap();
    const bounds = new maps.LatLngBounds();
    const placesWithCoordinates = places.filter((place) => place.coordinates);

    mapMarkers.forEach((marker) => marker.setMap(null));
    mapMarkers = placesWithCoordinates.map((place) => {
      const marker = new maps.Marker({
        position: place.coordinates,
        map,
        title: place.name
      });

      const infoWindow = new maps.InfoWindow({
        content: `<strong>${escapeHtml(place.name)}</strong><br>${escapeHtml(place.neighborhood)}`
      });

      marker.addListener("click", () => infoWindow.open({ anchor: marker, map }));
      bounds.extend(place.coordinates);
      return marker;
    });

    if (placesWithCoordinates.length > 1) {
      map.fitBounds(bounds, 48);
    } else if (placesWithCoordinates.length === 1) {
      map.setCenter(placesWithCoordinates[0].coordinates);
      map.setZoom(14);
    }
  } catch (error) {
    console.error(error);
    mapPreview.textContent = "Add a Google Maps API key to enable the map.";
  }
}

function placeCard(place) {
  const vibes = (place.vibes || []).slice(0, 3).map(titleCase).map(escapeHtml).join(", ");
  const imageUrl = placeImageUrl(place);

  return `
    <article class="place-card card">
      <div class="place-card-body">
        <span class="tag">${escapeHtml(place.category)} | ${escapeHtml(place.price)}</span>
        <h3>${escapeHtml(place.name)}</h3>
        <img
          class="place-card-image"
          src="${escapeHtml(imageUrl)}"
          alt="${escapeHtml(place.name)}"
          data-place-name="${escapeHtml(place.name)}"
          loading="lazy"
          onerror="window.usePlaceImageFallback(this)"
        />
        ${restaurantMeta(place)}
        <p class="neighborhood">${escapeHtml(place.neighborhood)}</p>
        <p>${escapeHtml(place.description)}</p>
        <p class="match-reason">${escapeHtml(place.matchReason)}</p>
        <p class="vibes">${vibes}</p>
        <button type="button">Save Spot</button>
      </div>
    </article>
  `;
}

function renderRecommendations(recommendations, parsedFilters = {}) {
  updateMapMarkers(recommendations);

  if (!recommendations.length) {
    placeGrid.innerHTML = `
      <div class="empty-state">
        No exact matches yet. Try broadening the neighborhood, vibe, or budget.
      </div>
    `;
    resultsSummary.textContent = "No matches found for that combination.";
    return;
  }

  placeGrid.innerHTML = recommendations.map(placeCard).join("");

  const activeFilters = Object.entries(parsedFilters)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${titleCase(value)}`);

  resultsSummary.textContent = activeFilters.length
    ? `Showing ${recommendations.length} matches for ${activeFilters.join(", ")}.`
    : `Showing ${recommendations.length} curated Chicago spots.`;
}

function readFormFilters() {
  const formData = new FormData(form);

  return Object.fromEntries(
    [...formData.entries()].map(([key, value]) => [key, String(value).trim()])
  );
}

async function fetchRecommendations(filters = {}) {
  renderLoading();

  const response = await fetch(`${API_BASE_URL}/api/recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(filters)
  });

  if (!response.ok) {
    throw new Error("Recommendation request failed");
  }

  return response.json();
}

async function fetchPlaces() {
  renderLoading();

  const response = await fetch(`${API_BASE_URL}/api/places`);

  if (!response.ok) {
    throw new Error("Places request failed");
  }

  return response.json();
}

async function runRecommendationSearch(filters = {}) {
  try {
    const data = await fetchRecommendations(filters);
    renderRecommendations(data.recommendations || [], data.parsedFilters || {});
    return data;
  } catch (error) {
    console.error(error);
    renderError();
    return null;
  }
}

async function loadInitialPlaces() {
  if (hasLoadedInitialPlaces) return;
  hasLoadedInitialPlaces = true;

  try {
    const data = await fetchPlaces();
    const places = (data.places || []).map((place) => ({
      ...place,
      matchReason: "From the curated Chicago places list."
    }));

    renderRecommendations(places, {});
  } catch (error) {
    console.error(error);
    renderError();
  }
}

function initializeApp() {
  startHeroSlideshow();
  loadInitialPlaces();
  window.setTimeout(() => {
    if (placeGrid.textContent.includes("Loading curated Chicago spots")) {
      runRecommendationSearch(readFormFilters());
    }
  }, 800);
}

function scheduleFilterSearch() {
  window.clearTimeout(filterSearchTimer);
  filterSearchTimer = window.setTimeout(() => {
    runRecommendationSearch(readFormFilters());
  }, 180);
}

async function searchByPrompt(prompt) {
  const cleanedPrompt = prompt.trim();
  if (!cleanedPrompt) return null;

  const data = await runRecommendationSearch({ prompt: cleanedPrompt });
  document.querySelector("#explore").scrollIntoView({ behavior: "smooth" });
  return data;
}

categoryChips.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip");
  if (!chip) return;

  categoryChips.querySelectorAll(".chip").forEach((button) => {
    button.classList.remove("active");
  });

  chip.classList.add("active");
  categoryInput.value = chip.dataset.category || "";
  scheduleFilterSearch();
});

form.querySelectorAll("select").forEach((select) => {
  select.addEventListener("change", scheduleFilterSearch);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runRecommendationSearch(readFormFilters());
});

clearFiltersBtn.addEventListener("click", () => {
  form.reset();
  categoryInput.value = "";
  categoryChips.querySelectorAll(".chip").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === "");
  });
  runRecommendationSearch();
});

if (startExploringBtn) {
  startExploringBtn.addEventListener("click", () => {
    document.querySelector("#explore").scrollIntoView({ behavior: "smooth" });
  });
}

assistantInput.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter" || !assistantInput.value.trim()) return;

  const prompt = assistantInput.value.trim();
  assistantInput.value = "";
  assistantChat.innerHTML = `<p><strong>You:</strong> ${escapeHtml(prompt)}</p><p><strong>AI:</strong> Thinking...</p>`;

  const data = await searchByPrompt(prompt);
  const topPlaces = (data?.recommendations || []).slice(0, 3).map((place) => escapeHtml(place.name));

  assistantChat.innerHTML = topPlaces.length
    ? `<p><strong>You:</strong> ${escapeHtml(prompt)}</p><p><strong>AI:</strong> Start with ${topPlaces.join(", ")}.</p>`
    : `<p><strong>You:</strong> ${escapeHtml(prompt)}</p><p><strong>AI:</strong> I could not find a strong match yet. Try naming a neighborhood or vibe.</p>`;
});

heroSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const prompt = heroSearchInput.value;
  const data = await searchByPrompt(prompt);
  const topPlaces = (data?.recommendations || []).slice(0, 3).map((place) => escapeHtml(place.name));

  if (prompt.trim()) {
    assistantChat.innerHTML = topPlaces.length
      ? `<p><strong>You:</strong> ${escapeHtml(prompt)}</p><p><strong>AI:</strong> Try ${topPlaces.join(", ")}.</p>`
      : `<p><strong>You:</strong> ${escapeHtml(prompt)}</p><p><strong>AI:</strong> I could not find a strong match yet.</p>`;
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

window.addEventListener("pageshow", initializeApp);
