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

const API_BASE_URL =
  window.location.protocol === "file:" || !/^(localhost|127\.0\.0\.1):3000$/.test(window.location.host)
    ? "http://127.0.0.1:3000"
    : "";

let chicagoMap;
let googleMapsPromise;
let mapMarkers = [];
let filterSearchTimer;
let hasLoadedInitialPlaces = false;

function titleCase(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

  return `
    <article class="place-card card">
      <span class="tag">${escapeHtml(place.category)} | ${escapeHtml(place.price)}</span>
      <h3>${escapeHtml(place.name)}</h3>
      <p class="neighborhood">${escapeHtml(place.neighborhood)}</p>
      <p>${escapeHtml(place.description)}</p>
      <p class="match-reason">${escapeHtml(place.matchReason)}</p>
      <p class="vibes">${vibes}</p>
      <button type="button">Save Spot</button>
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
