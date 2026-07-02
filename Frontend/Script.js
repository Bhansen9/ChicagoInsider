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
const placeDetailPanel = document.querySelector("#placeDetailPanel");
const placeDetailBackdrop = document.querySelector("#placeDetailBackdrop");
const placeDetailContent = document.querySelector("#placeDetailContent");
const placeDetailCloseBtn = document.querySelector("#placeDetailCloseBtn");
const skeletons = window.ChicagoInsiderSkeletons;
const auth = window.ChicagoInsiderAuth;

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

const API_BASE_URL = window.ChicagoInsiderApiBaseUrl ?? "http://localhost:3000";
const PLACE_PHOTO_ROTATION_MS = 3000;
const PLACE_PHOTO_TRANSITION_MS = 220;

function resolveAssetUrl(url) {
  if (!url || !url.startsWith("/")) return url;
  return `${API_BASE_URL}${url}`;
}

let chicagoMap;
let googleMapsPromise;
let mapMarkers = [];
let activeMapInfoWindow;
let activeMapMarker;
let mapCloseClickListener;
let filterSearchTimer;
let placePhotoRotationTimer;
let activePlacePhotoCard;
let hasLoadedInitialPlaces = false;
let heroSlideIndex = 0;
let showingHeroImageA = true;
let heroSlideshowTimer;
let placesById = new Map();
let savedPlaceKeys = new Set();
let lastRecommendations = [];
let lastParsedFilters = {};
let lastPlaceDetailTrigger = null;
let placeDetailCloseTimer;

const chicagoMapBounds = {
  north: 41.96,
  south: 41.78,
  west: -87.74,
  east: -87.55
};

const placeCoordinateFallbacks = {
  "Millennium Park": { lat: 41.8826, lng: -87.6226 },
  "Chicago Riverwalk": { lat: 41.8871, lng: -87.6277 },
  "The Art Institute of Chicago": { lat: 41.8796, lng: -87.6237 },
  "Au Cheval": { lat: 41.8847, lng: -87.6476 },
  "Small Cheval": { lat: 41.9105, lng: -87.6776 },
  "LondonHouse Rooftop": { lat: 41.8879, lng: -87.6256 },
  "Lincoln Park Zoo": { lat: 41.9210, lng: -87.6339 },
  "Navy Pier": { lat: 41.8917, lng: -87.6086 },
  "The Violet Hour": { lat: 41.9104, lng: -87.6774 },
  "Lou Malnati's": { lat: 41.8905, lng: -87.6306 },
  "Cindy's Rooftop": { lat: 41.8817, lng: -87.6246 },
  "Garfield Park Conservatory": { lat: 41.8864, lng: -87.7175 }
};

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
  if (!heroBgImageA) return;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function keysForStoredPlace(place = {}) {
  return [
    place.id,
    place.google_place_id,
    place.googlePlaceId,
    place.place_id,
    place.google_place_id?.startsWith("local:") ? place.google_place_id.slice(6) : "",
    place.name?.toLowerCase()
  ].filter(Boolean).map(String);
}

function keysForDisplayPlace(place = {}) {
  return [
    place.id,
    place.googlePlaceId,
    place.google_place_id,
    place.place_id,
    `local:${place.id}`,
    place.name?.toLowerCase()
  ].filter(Boolean).map(String);
}

function rememberSavedPlace(place = {}) {
  keysForStoredPlace(place).forEach((key) => savedPlaceKeys.add(key));
}

function isPlaceSaved(place = {}) {
  return keysForDisplayPlace(place).some((key) => savedPlaceKeys.has(key));
}

async function loadSavedSpotsForSearch() {
  if (!auth.getSession?.()) return;

  try {
    const savedSpots = await auth.getSavedSpots();
    savedPlaceKeys = new Set();
    savedSpots.forEach((savedSpot) => rememberSavedPlace(savedSpot.place));
  } catch (error) {
    if (error.status !== 401) console.error(error);
  }
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
  if (!place.imageUrl && !place.image) {
    return PLACE_IMAGE_FALLBACKS[place.name] || PLACE_IMAGE_FALLBACKS["Chicago Riverwalk"];
  }

  return resolveAssetUrl(place.imageUrl || place.image);
}

function photoUrlFromName(photoName, width = 900, height = 560) {
  if (!photoName) return "";

  const params = new URLSearchParams({
    name: photoName,
    maxWidthPx: String(width),
    maxHeightPx: String(height)
  });

  return `/api/places/photo?${params.toString()}`;
}

function uniquePhotoUrls(urls) {
  const seen = new Set();
  return urls
    .filter(Boolean)
    .map(resolveAssetUrl)
    .filter((url) => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
}

function placePhotoUrls(place) {
  const urls = [
    ...(Array.isArray(place.photoUrls) ? place.photoUrls : []),
    ...(Array.isArray(place.photo_urls) ? place.photo_urls : []),
    ...(Array.isArray(place.photoNames) ? place.photoNames.map((name) => photoUrlFromName(name)) : []),
    ...(Array.isArray(place.photo_references) ? place.photo_references.map((name) => photoUrlFromName(name)) : []),
    place.photoName ? photoUrlFromName(place.photoName) : "",
    place.imageUrl,
    place.image,
    PLACE_IMAGE_FALLBACKS[place.name]
  ];

  const photos = uniquePhotoUrls(urls);
  return photos.length ? photos : [resolveAssetUrl(PLACE_IMAGE_FALLBACKS["Chicago Riverwalk"])];
}

function cleanExternalUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(url)) return `https://${url}`;
  return "";
}

function normalizeTextList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function pillList(items) {
  return normalizeTextList(items)
    .map((item) => `<span class="place-detail-pill">${escapeHtml(titleCase(item))}</span>`)
    .join("");
}

function placeRatingText(place = {}) {
  const rating = Number(place.rating || place.ratingAverage || place.rating_average);
  const ratingCount = Number(place.userRatingCount || place.user_rating_count || place.ratingCount || place.rating_count);

  if (!rating) return "Not rated yet";
  if (ratingCount) return `${rating.toFixed(1)} from ${ratingCount.toLocaleString()} ratings`;
  return `${rating.toFixed(1)} out of 5`;
}

function placeMapUrl(place = {}) {
  const directMapUrl = cleanExternalUrl(place.googleMapsUri || place.google_maps_uri);
  if (directMapUrl) return directMapUrl;

  const query = [place.name, place.neighborhood, "Chicago"].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function detailStat(label, value) {
  if (!value) return "";

  return `
    <div class="place-detail-stat">
      <span>${escapeHtml(label)}</span>
      <span>${escapeHtml(value)}</span>
    </div>
  `;
}

function renderPlaceDetail(place) {
  if (!placeDetailContent) return;

  const photos = placePhotoUrls(place);
  const imageUrl = photos[0] || placeImageUrl(place);
  const mapUrl = placeMapUrl(place);
  const websiteUrl = cleanExternalUrl(place.websiteUri || place.website || place.website_url);
  const reviewUrl = cleanExternalUrl(place.reviewUrl || place.review_url);
  const bestFor = normalizeTextList(place.bestFor || place.best_for);
  const vibes = normalizeTextList(place.vibes);
  const timeWindow = place.timeWindow || place.time_window || "Hours vary";
  const summary = place.description || place.note || "A Chicago spot worth checking out.";
  const matchReason = place.matchReason || place.reason || "";
  const isSaved = isPlaceSaved(place);
  const category = place.category || "Chicago spot";
  const price = place.price || "";

  placeDetailContent.innerHTML = `
    <img
      class="place-detail-hero-image"
      src="${escapeHtml(imageUrl)}"
      alt="${escapeHtml(place.name)}"
      onerror="window.usePlaceImageFallback(this)"
      data-place-name="${escapeHtml(place.name)}"
    />
    <div class="place-detail-kicker">
      <span>${escapeHtml(category)}</span>
      ${price ? `<span>${escapeHtml(price)}</span>` : ""}
    </div>
    <h2 id="placeDetailTitle">${escapeHtml(place.name)}</h2>
    <p class="place-detail-summary">${escapeHtml(summary)}</p>
    <div class="place-detail-stats">
      ${detailStat("Neighborhood", place.neighborhood || "Chicago")}
      ${detailStat("Price", price || "Varies")}
      ${detailStat("Rating", placeRatingText(place))}
      ${detailStat("Best Time", timeWindow)}
    </div>
    ${matchReason ? `
      <section class="place-detail-section">
        <h3>Why it fits</h3>
        <p class="place-detail-copy">${escapeHtml(matchReason)}</p>
      </section>
    ` : ""}
    ${bestFor.length ? `
      <section class="place-detail-section">
        <h3>Best for</h3>
        <div class="place-detail-pill-list">${pillList(bestFor)}</div>
      </section>
    ` : ""}
    ${vibes.length ? `
      <section class="place-detail-section">
        <h3>Vibes</h3>
        <div class="place-detail-pill-list">${pillList(vibes)}</div>
      </section>
    ` : ""}
    <div class="place-detail-actions">
      <button
        type="button"
        class="place-detail-save ${isSaved ? "is-saved" : ""}"
        data-detail-save-place-id="${escapeHtml(place.id)}"
        ${isSaved ? "disabled" : ""}
      >
        ${isSaved ? "Saved" : "Save Spot"}
      </button>
      <a href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener noreferrer">Open Map</a>
      ${websiteUrl ? `<a class="secondary" href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener noreferrer">Website</a>` : ""}
      ${reviewUrl && reviewUrl !== mapUrl ? `<a class="secondary" href="${escapeHtml(reviewUrl)}" target="_blank" rel="noopener noreferrer">Reviews</a>` : ""}
    </div>
  `;
}

function openPlaceDetail(placeId, triggerElement = null, { side = "right" } = {}) {
  const place = placesById.get(String(placeId));
  if (!place || !placeDetailPanel || !placeDetailContent) return;

  window.clearTimeout(placeDetailCloseTimer);
  lastPlaceDetailTrigger = triggerElement || document.activeElement;
  renderPlaceDetail(place);
  placeDetailBackdrop.hidden = false;
  placeDetailPanel.classList.toggle("is-left", side === "left");
  placeDetailPanel.setAttribute("aria-hidden", "false");
  document.body.classList.add("place-detail-open");

  window.requestAnimationFrame(() => {
    placeDetailBackdrop.classList.add("is-open");
    placeDetailPanel.classList.add("is-open");
    placeDetailCloseBtn?.focus({ preventScroll: true });
  });
}

function closePlaceDetail({ restoreFocus = true } = {}) {
  if (!placeDetailPanel) return;

  window.clearTimeout(placeDetailCloseTimer);
  placeDetailBackdrop?.classList.remove("is-open");
  placeDetailPanel.classList.remove("is-open");
  placeDetailPanel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("place-detail-open");

  placeDetailCloseTimer = window.setTimeout(() => {
    if (placeDetailBackdrop) placeDetailBackdrop.hidden = true;
    placeDetailPanel.classList.remove("is-left");
    if (restoreFocus && lastPlaceDetailTrigger?.isConnected) {
      lastPlaceDetailTrigger.focus?.({ preventScroll: true });
    }
  }, 220);
}

async function savePlaceFromButton(saveButton, placeId) {
  const place = placesById.get(String(placeId));
  if (!place) return false;

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    await auth.saveSpot(place);
    rememberSavedPlace(place);
    saveButton.textContent = "Saved";
    saveButton.classList.add("is-saved");
    renderRecommendations(lastRecommendations, lastParsedFilters);
    return true;
  } catch (error) {
    if (error.status !== 401) {
      console.error(error);
      saveButton.textContent = "Try Again";
    }
    return false;
  } finally {
    saveButton.disabled = false;
  }
}

function renderLoading(message = "Finding Chicago spots...") {
  if (skeletons) {
    skeletons.showHomePlaceCards(placeGrid, 8);
    return;
  }

  placeGrid.setAttribute("aria-busy", "true");
  placeGrid.innerHTML = `<p class="empty-state">${message}</p>`;
}

function renderError() {
  skeletons?.markLoaded(placeGrid);
  if (!chicagoMap && mapPreview.getAttribute("aria-busy") === "true") {
    skeletons?.markLoaded(mapPreview);
    mapPreview.textContent = "Map unavailable until recommendations load.";
  }
  placeGrid.innerHTML = `
    <div class="empty-state error-state">
      Could not load recommendations. Make sure the backend server is running.
    </div>
  `;
}

function resetActiveMapMarker() {
  if (!activeMapMarker) return;
  activeMapMarker.setIcon(null);
  activeMapMarker.setAnimation(null);
  activeMapMarker.setZIndex(undefined);
  activeMapMarker = null;
}

function selectedMarkerIcon(maps) {
  return {
    path: maps.SymbolPath.CIRCLE,
    fillColor: "#2563eb",
    fillOpacity: 1,
    scale: 10,
    strokeColor: "#ffffff",
    strokeWeight: 3
  };
}

function selectedMapInfoContent(place) {
  return `
    <div class="map-selected-card">
      <span>Selected</span>
      <strong>${escapeHtml(place.name)}</strong>
      <p>${escapeHtml(place.neighborhood || "Chicago")}</p>
    </div>
  `;
}

function showSelectedMapPlace({ maps, map, marker, place }) {
  resetActiveMapMarker();

  marker.setIcon(selectedMarkerIcon(maps));
  marker.setZIndex(9999);
  if (maps.Animation?.BOUNCE) {
    marker.setAnimation(maps.Animation.BOUNCE);
    window.setTimeout(() => {
      if (activeMapMarker === marker) marker.setAnimation(null);
    }, 900);
  }
  activeMapMarker = marker;

  if (activeMapInfoWindow) activeMapInfoWindow.close();
  activeMapInfoWindow = new maps.InfoWindow({
    content: selectedMapInfoContent(place)
  });
  activeMapInfoWindow.open({ anchor: marker, map });

  map.panTo(place.coordinates);
  if (map.getZoom() < 13) map.setZoom(13);
}

async function loadGoogleMaps() {
  if (window.google?.maps) return window.google.maps;
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = fetch(`${API_BASE_URL}/api/config/maps?surface=home`)
    .then((response) => {
      if (!response.ok) throw new Error("Could not load Google Maps config");
      return response.json();
    })
    .then(({ googleMapsApiKey }) => {
      if (!googleMapsApiKey) {
        throw new Error("Missing Google Maps API key");
      }

      return new Promise((resolve, reject) => {
        const callbackName = "initChicagoLensMap";
        const existingScript = document.querySelector("script[data-google-maps-script]");

        const timeout = window.setTimeout(() => {
          reject(new Error("Google Maps timed out while loading"));
        }, 10000);

        window.gm_authFailure = () => {
          window.clearTimeout(timeout);
          reject(new Error("Google Maps rejected the API key. Check API restrictions, referrers, and billing."));
        };

        window[callbackName] = () => {
          window.clearTimeout(timeout);
          resolve(window.google.maps);
        };

        if (existingScript) {
          existingScript.addEventListener("load", () => {
            window.clearTimeout(timeout);
            if (window.google?.maps) resolve(window.google.maps);
          }, { once: true });
          existingScript.addEventListener("error", () => {
            window.clearTimeout(timeout);
            reject(new Error("Google Maps failed to load"));
          }, { once: true });
          return;
        }

        const script = document.createElement("script");
        script.dataset.googleMapsScript = "true";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsApiKey)}&callback=${callbackName}`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
          window.clearTimeout(timeout);
          reject(new Error("Google Maps failed to load"));
        };
        document.head.appendChild(script);
      });
    });

  return googleMapsPromise;
}

async function ensureMap() {
  const maps = await loadGoogleMaps();

  if (!chicagoMap) {
    skeletons?.markLoaded(mapPreview);
    mapPreview.innerHTML = "";
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
    const placesWithCoordinates = places
      .map((place) => ({
        ...place,
        coordinates: place.coordinates || placeCoordinateFallbacks[place.name]
      }))
      .filter((place) => place.coordinates);

    if (activeMapInfoWindow) activeMapInfoWindow.close();
    activeMapInfoWindow = null;
    resetActiveMapMarker();

    mapMarkers.forEach((marker) => marker.setMap(null));
    mapMarkers = placesWithCoordinates.map((place) => {
      const marker = new maps.Marker({
        position: place.coordinates,
        map,
        title: place.name
      });

      marker.addListener("click", () => {
        showSelectedMapPlace({ maps, map, marker, place });
        openPlaceDetail(place.id, mapPreview, { side: "left" });
      });
      bounds.extend(place.coordinates);
      return marker;
    });

    if (!mapCloseClickListener) {
      mapCloseClickListener = map.addListener("click", () => {
        if (activeMapInfoWindow) activeMapInfoWindow.close();
        activeMapInfoWindow = null;
        resetActiveMapMarker();
      });
    }

    if (placesWithCoordinates.length > 1) {
      map.fitBounds(bounds, 48);
    } else if (placesWithCoordinates.length === 1) {
      map.setCenter(placesWithCoordinates[0].coordinates);
      map.setZoom(14);
    } else {
      map.setCenter({ lat: 41.8781, lng: -87.6298 });
      map.setZoom(12);
    }
  } catch (error) {
    console.error(error);
    skeletons?.markLoaded(mapPreview);
    mapPreview.textContent = "Google Maps could not load. Check the API key settings and restart the server.";
  }
}

function mapInfoContent(place) {
  const imageUrl = placeImageUrl(place);

  return `
    <div class="map-info-card">
      <img
        class="map-info-image"
        src="${escapeHtml(imageUrl)}"
        alt="${escapeHtml(place.name)}"
        onerror="window.usePlaceImageFallback(this)"
        data-place-name="${escapeHtml(place.name)}"
      />
      <div class="map-info-body">
        <strong>${escapeHtml(place.name)}</strong>
        <div class="map-info-tags">
          <span>${escapeHtml(place.category || "Chicago spot")}</span>
          ${place.price ? `<span>${escapeHtml(place.price)}</span>` : ""}
        </div>
        <p>${escapeHtml(place.neighborhood || "Chicago")}</p>
      </div>
    </div>
  `;
}

function placeCard(place) {
  const vibes = (place.vibes || []).slice(0, 3).map(titleCase).map(escapeHtml).join(", ");
  const photos = placePhotoUrls(place);
  const imageUrl = photos[0] || placeImageUrl(place);
  const photoControls = photos.length > 1
    ? `
        <button class="photo-nav-button photo-nav-prev" type="button" data-photo-action="prev" aria-label="Previous photo for ${escapeHtml(place.name)}">
          ‹
        </button>
        <button class="photo-nav-button photo-nav-next" type="button" data-photo-action="next" aria-label="Next photo for ${escapeHtml(place.name)}">
          ›
        </button>
        <span class="photo-count">1 / ${photos.length}</span>
      `
    : "";

  return `
    <article class="place-card card is-clickable" data-place-id="${escapeHtml(place.id)}" tabindex="0" aria-label="Open details for ${escapeHtml(place.name)}">
      <div class="place-card-body">
        <span class="tag">${escapeHtml(place.category)} | ${escapeHtml(place.price)}</span>
        <h3>${escapeHtml(place.name)}</h3>
        <div class="place-photo-frame">
          <img
            class="place-card-image"
            src="${escapeHtml(imageUrl)}"
            alt="${escapeHtml(place.name)} photo 1"
            data-place-name="${escapeHtml(place.name)}"
            data-photo-index="0"
            loading="lazy"
            onerror="window.usePlaceImageFallback(this)"
          />
          ${photoControls}
        </div>
        ${restaurantMeta(place)}
        <p class="neighborhood">${escapeHtml(place.neighborhood)}</p>
        <p>${escapeHtml(place.description)}</p>
        <p class="match-reason">${escapeHtml(place.matchReason)}</p>
        <p class="vibes">${vibes}</p>
        <button type="button" data-save-place-id="${escapeHtml(place.id)}">Save Spot</button>
      </div>
    </article>
  `;
}

function stopPlacePhotoRotation() {
  window.clearInterval(placePhotoRotationTimer);
  placePhotoRotationTimer = null;
  activePlacePhotoCard = null;
}

function placePhotoTransitionMs() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    ? 0
    : PLACE_PHOTO_TRANSITION_MS;
}

function cyclePlaceCardPhoto(card, direction = 1, onlyIfActive = false) {
  if (!card) return;

  const place = placesById.get(String(card.dataset.placeId));
  if (!place) return;

  const photos = placePhotoUrls(place);
  if (photos.length < 2) return;

  const image = card.querySelector(".place-card-image");
  const count = card.querySelector(".photo-count");
  if (!image || image.dataset.photoChanging === "true") return;

  const currentIndex = Number(image?.dataset.photoIndex || 0);
  const nextIndex = (currentIndex + direction + photos.length) % photos.length;
  const nextPhoto = photos[nextIndex];
  const isCycleAllowed = () => !onlyIfActive || card === activePlacePhotoCard;
  const cancelPhotoChange = () => {
    image.classList.remove("is-changing");
    delete image.dataset.photoChanging;
  };

  image.dataset.photoChanging = "true";

  const showNextPhoto = () => {
    if (!card.isConnected || !isCycleAllowed()) {
      cancelPhotoChange();
      return;
    }

    const transitionMs = placePhotoTransitionMs();

    image.classList.add("is-changing");
    window.setTimeout(() => {
      if (!card.isConnected || !isCycleAllowed()) {
        cancelPhotoChange();
        return;
      }

      image.dataset.photoIndex = String(nextIndex);
      image.src = nextPhoto;
      image.alt = `${place.name} photo ${nextIndex + 1}`;
      if (count) count.textContent = `${nextIndex + 1} / ${photos.length}`;

      window.requestAnimationFrame(() => {
        image.classList.remove("is-changing");
        window.setTimeout(() => {
          delete image.dataset.photoChanging;
        }, transitionMs);
      });
    }, transitionMs);
  };

  const preloadedPhoto = new Image();
  preloadedPhoto.onload = showNextPhoto;
  preloadedPhoto.onerror = showNextPhoto;
  preloadedPhoto.src = nextPhoto;
}

function cyclePlacePhoto(button) {
  const card = button.closest(".place-card[data-place-id]");
  const direction = button.dataset.photoAction === "prev" ? -1 : 1;
  cyclePlaceCardPhoto(card, direction);
}

function cardHasRotatingPhotos(card) {
  if (!card) return false;

  const place = placesById.get(String(card.dataset.placeId));
  return place && placePhotoUrls(place).length > 1;
}

function startPlacePhotoRotation(card) {
  stopPlacePhotoRotation();

  if (!cardHasRotatingPhotos(card)) return;

  activePlacePhotoCard = card;
  cyclePlaceCardPhoto(card, 1, true);
  placePhotoRotationTimer = window.setInterval(() => {
    if (!activePlacePhotoCard?.isConnected) {
      stopPlacePhotoRotation();
      return;
    }

    cyclePlaceCardPhoto(activePlacePhotoCard, 1, true);
  }, PLACE_PHOTO_ROTATION_MS);
}

function handlePlaceCardMouseOver(event) {
  const card = event.target.closest(".place-card[data-place-id]");
  if (!card || !placeGrid.contains(card) || card.contains(event.relatedTarget)) return;

  startPlacePhotoRotation(card);
}

function handlePlaceCardMouseOut(event) {
  const card = event.target.closest(".place-card[data-place-id]");
  if (!card || !placeGrid.contains(card) || card.contains(event.relatedTarget)) return;
  if (card === activePlacePhotoCard) stopPlacePhotoRotation();
}

function renderRecommendations(recommendations, parsedFilters = {}) {
  stopPlacePhotoRotation();
  lastRecommendations = recommendations;
  lastParsedFilters = parsedFilters;
  const visibleRecommendations = recommendations.filter((place) => !isPlaceSaved(place));

  updateMapMarkers(visibleRecommendations);
  placesById = new Map(visibleRecommendations.map((place) => [String(place.id), place]));

  if (!visibleRecommendations.length) {
    placeGrid.innerHTML = `
      <div class="empty-state">
        ${recommendations.length ? "Those places are already saved. Try another search for more spots." : "No exact matches yet. Try broadening the neighborhood, vibe, or budget."}
      </div>
    `;
    skeletons?.markLoaded(placeGrid);
    resultsSummary.textContent = recommendations.length
      ? "All matches are already saved."
      : "No matches found for that combination.";
    return;
  }

  placeGrid.innerHTML = visibleRecommendations.map(placeCard).join("");
  skeletons?.markLoaded(placeGrid);
  window.cacheDisplayedPlaces?.(visibleRecommendations);

  const activeFilters = Object.entries(parsedFilters)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${titleCase(value)}`);

  resultsSummary.textContent = activeFilters.length
    ? `Showing ${visibleRecommendations.length} unsaved matches for ${activeFilters.join(", ")}.`
    : `Showing ${visibleRecommendations.length} unsaved Chicago spots.`;
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
    await loadSavedSpotsForSearch();
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
    await loadSavedSpotsForSearch();
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
  if (!chicagoMap && !mapPreview.innerHTML.trim()) {
    skeletons?.showMap(mapPreview);
  }
  loadInitialPlaces();
  window.setTimeout(() => {
    if (placeGrid.getAttribute("aria-busy") === "true") {
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

placeGrid.addEventListener("click", async (event) => {
  const photoButton = event.target.closest("button[data-photo-action]");
  if (photoButton) {
    cyclePlacePhoto(photoButton);
    return;
  }

  if (event.target.closest("a")) return;

  const saveButton = event.target.closest("button[data-save-place-id]");
  if (saveButton) {
    await savePlaceFromButton(saveButton, saveButton.dataset.savePlaceId);
    return;
  }

  const card = event.target.closest(".place-card[data-place-id]");
  if (!card || !placeGrid.contains(card)) return;
  openPlaceDetail(card.dataset.placeId, card);
});

placeGrid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  if (event.target.closest("button, a, input, select, textarea")) return;

  const card = event.target.closest(".place-card[data-place-id]");
  if (!card || !placeGrid.contains(card)) return;

  event.preventDefault();
  openPlaceDetail(card.dataset.placeId, card);
});

placeGrid.addEventListener("mouseover", handlePlaceCardMouseOver);
placeGrid.addEventListener("mouseout", handlePlaceCardMouseOut);

placeDetailContent?.addEventListener("click", async (event) => {
  const saveButton = event.target.closest("button[data-detail-save-place-id]");
  if (!saveButton) return;

  const place = placesById.get(String(saveButton.dataset.detailSavePlaceId));
  const saved = await savePlaceFromButton(saveButton, saveButton.dataset.detailSavePlaceId);
  if (saved && place) renderPlaceDetail(place);
});

placeDetailCloseBtn?.addEventListener("click", () => closePlaceDetail());
placeDetailBackdrop?.addEventListener("click", () => closePlaceDetail());

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && placeDetailPanel?.classList.contains("is-open")) {
    closePlaceDetail();
  }
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

window.addEventListener("pageshow", initializeApp);
