const collectionSearch = document.querySelector("#collectionSearch");
const collectionGrid = document.querySelector("#collectionGrid");
const collectionFilterBtn = document.querySelector("#collectionFilterBtn");
const collectionFilterMenu = document.querySelector("#collectionFilterMenu");
const collectionSortBtn = document.querySelector("#collectionSortBtn");
const collectionSortMenu = document.querySelector("#collectionSortMenu");
const skeletons = window.ChicagoInsiderSkeletons;
const auth = window.ChicagoInsiderAuth;
const API_BASE_URL = window.ChicagoInsiderApiBaseUrl ?? "http://localhost:3000";

function resolveAssetUrl(url) {
  if (!url || !url.startsWith("/")) return url;
  return `${API_BASE_URL}${url}`;
}

let places = [];
let activeCollectionFilter = "all";
let activeSort = "featured";
let playbookPlaceKeys = new Set();

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function displayPlaceId(place = {}) {
  const rawId = String(place.google_place_id || place.googlePlaceId || place.place_id || place.id || "");
  return rawId.startsWith("local:") ? rawId.slice(6) : rawId;
}

function placeMatchKeys(place = {}) {
  return [
    place.id,
    place.googlePlaceId,
    place.google_place_id,
    place.place_id,
    place.placeId,
    place.supabasePlaceId,
    place.name?.toLowerCase()
  ].filter(Boolean).map(String);
}

function priceFromStoredPlace(place = {}, metadata = {}) {
  const priceByLevel = {
    0: "Free",
    1: "$",
    2: "$$",
    3: "$$$",
    4: "$$$$"
  };

  return metadata.price || place.price || priceByLevel[place.price_level] || "$$";
}

function typeFromStoredPlace(place = {}, metadata = {}) {
  const category = String(place.category || "").toLowerCase();
  const primaryType = String(place.primary_type || "").toLowerCase();
  const price = priceFromStoredPlace(place, metadata);
  const filterTypes = new Set(["activity", "bar", "food", "free"]);

  if (metadata.type) return metadata.type;
  if (filterTypes.has(primaryType)) return primaryType;
  if (price === "Free") return "free";
  if (category.includes("bar") || primaryType.includes("bar")) return "bar";
  if (category.includes("food") || category.includes("restaurant") || primaryType.includes("restaurant")) return "food";
  return category || primaryType || "activity";
}

function photoUrlFromName(photoName) {
  if (!photoName) return "";

  const params = new URLSearchParams({
    name: photoName,
    maxWidthPx: "900",
    maxHeightPx: "560"
  });

  return `/api/places/photo?${params.toString()}`;
}

function imageFromStoredPlace(place = {}, metadata = {}) {
  const rawPayload = place.raw_google_payload || {};
  const photoReferences = Array.isArray(place.photo_references) ? place.photo_references : [];
  const photoName = (
    place.photoName ||
    rawPayload.photoName ||
    rawPayload.photos?.[0]?.name ||
    photoReferences[0]
  );

  return resolveAssetUrl(
    metadata.image ||
    place.image ||
    place.imageUrl ||
    rawPayload.image ||
    rawPayload.imageUrl ||
    photoUrlFromName(photoName) ||
    "assets/pixel-chicago-hero.png"
  );
}

function ratingFromStoredPlace(place = {}, metadata = {}) {
  const rawPayload = place.raw_google_payload || {};
  const rating = Number(metadata.rating || place.rating || rawPayload.rating || 0);
  return Number.isFinite(rating) ? rating : 0;
}

function normalizeSavedSpot(savedSpot = {}) {
  if (!savedSpot.place) return null;

  const place = savedSpot.place;
  const metadata = place.metadata || {};
  const price = priceFromStoredPlace(place, metadata);

  return {
    id: displayPlaceId(place) || savedSpot.id,
    savedSpotId: savedSpot.id,
    placeId: place.id,
    googlePlaceId: place.google_place_id || place.googlePlaceId || place.place_id || "",
    supabasePlaceId: place.id,
    name: place.name || "Chicago place",
    category: place.category || "Activity",
    type: typeFromStoredPlace(place, metadata),
    price,
    neighborhood: metadata.neighborhood || "Chicago",
    rating: ratingFromStoredPlace(place, metadata),
    image: imageFromStoredPlace(place, metadata),
    description: place.formatted_address || place.address || "Saved Chicago place.",
    note: savedSpot.notes || metadata.note || "Saved by you",
    createdAt: savedSpot.created_at || ""
  };
}

function usesPlaceholderImage(place = {}) {
  return !place.image || String(place.image).includes("pixel-chicago-hero");
}

async function loadSavedPlacesFromApi() {
  const savedSpots = await auth.getSavedSpots();
  places = savedSpots.map(normalizeSavedSpot).filter(Boolean);

  if (places.some(usesPlaceholderImage)) {
    const cachedPlaces = await window.ChicagoInsiderPlaceCache?.cacheDisplayedPlaces(places).catch((error) => {
      console.error(error);
      return [];
    });

    if (cachedPlaces?.length) {
      const refreshedSavedSpots = await auth.getSavedSpots();
      places = refreshedSavedSpots.map(normalizeSavedSpot).filter(Boolean);
    }
  }
}

async function loadPlaybookPlaceKeysFromApi() {
  const playbookPlaces = await auth.getDefaultPlaybookPlaces();
  playbookPlaceKeys = new Set();
  playbookPlaces.forEach((place) => {
    placeMatchKeys(place).forEach((key) => playbookPlaceKeys.add(key));
  });
}

function matchesSearch(place, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    place.name,
    place.category,
    place.neighborhood,
    place.description,
    place.note,
    place.price
  ].some((value) => String(value || "").toLowerCase().includes(normalized));
}

function priceRank(price) {
  return { Free: 0, "$": 1, "$$": 2, "$$$": 3, "$$$$": 4 }[price] ?? 9;
}

function dateRank(place) {
  const time = new Date(place.createdAt || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function sortedPlaces(nextPlaces) {
  return [...nextPlaces].sort((a, b) => {
    if (activeSort === "name") return a.name.localeCompare(b.name);
    if (activeSort === "neighborhood") return a.neighborhood.localeCompare(b.neighborhood) || a.name.localeCompare(b.name);
    if (activeSort === "budget") return priceRank(a.price) - priceRank(b.price) || a.name.localeCompare(b.name);
    return dateRank(b) - dateRank(a) || a.name.localeCompare(b.name);
  });
}

function cardForPlace(place) {
  const image = resolveAssetUrl(place.image || place.imageUrl || "assets/pixel-chicago-hero.png");
  const rating = Number(place.rating || 0);
  const isInPlaybook = placeMatchKeys(place).some((key) => playbookPlaceKeys.has(key));
  const ratingHtml = rating
    ? `<span class="rating"><span class="stars">*****</span> ${rating.toFixed(1)}</span>`
    : "";

  return `
    <article class="place-card">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(place.name)}" />
      <div class="place-card-body">
        <div class="place-card-topline">
          <span class="pill">${escapeHtml(place.category)} | ${escapeHtml(place.price)}</span>
          ${ratingHtml}
        </div>
        <h2>${escapeHtml(place.name)}</h2>
        <p class="neighborhood">${escapeHtml(place.neighborhood)}</p>
        <p class="description">${escapeHtml(place.description)}</p>
        <p class="source-note">Saved to your Full Collections.</p>
        <p class="vibes">${escapeHtml(place.note)}</p>
        <div class="place-card-actions">
          <button class="save-spot add-playbook-spot${isInPlaybook ? " is-saved" : ""}" type="button" data-add-playbook-saved-spot-id="${escapeHtml(place.savedSpotId)}" ${isInPlaybook ? "disabled" : ""}>
            ${isInPlaybook ? "Added" : "Add to Playbook"}
          </button>
          <button class="save-spot remove-saved-spot" type="button" data-saved-spot-id="${escapeHtml(place.savedSpotId)}">
            Remove
          </button>
        </div>
      </div>
    </article>
  `;
}

function emptyCollectionsMessage() {
  if (places.length) return "No saved places match that search.";
  return "No saved places yet. Save spots from Home or Trending and they will appear here.";
}

function renderCollections() {
  const query = collectionSearch.value;
  const filteredPlaces = places.filter((place) => {
    const filterMatch = activeCollectionFilter === "all" || place.type === activeCollectionFilter;
    return filterMatch && matchesSearch(place, query);
  });
  const nextPlaces = sortedPlaces(filteredPlaces);

  collectionGrid.innerHTML = nextPlaces.length
    ? nextPlaces.map(cardForPlace).join("")
    : `<div class="empty-state">${escapeHtml(emptyCollectionsMessage())}</div>`;
  skeletons?.markLoaded(collectionGrid);
  window.cacheDisplayedPlaces?.(nextPlaces);
}

function setActiveMenuButton(menu, key, value) {
  menu.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset[key] === value);
  });
}

function closeMenus() {
  collectionFilterMenu.classList.remove("open");
  collectionSortMenu.classList.remove("open");
}

collectionSearch.addEventListener("input", renderCollections);

collectionFilterBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  collectionSortMenu.classList.remove("open");
  collectionFilterMenu.classList.toggle("open");
});

collectionSortBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  collectionFilterMenu.classList.remove("open");
  collectionSortMenu.classList.toggle("open");
});

collectionFilterMenu.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;

  activeCollectionFilter = button.dataset.filter;
  setActiveMenuButton(collectionFilterMenu, "filter", activeCollectionFilter);
  renderCollections();
  closeMenus();
});

collectionSortMenu.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-sort]");
  if (!button) return;

  activeSort = button.dataset.sort;
  collectionSortBtn.textContent = `Sort: ${button.textContent}`;
  setActiveMenuButton(collectionSortMenu, "sort", activeSort);
  renderCollections();
  closeMenus();
});

collectionGrid.addEventListener("click", async (event) => {
  const playbookButton = event.target.closest("button[data-add-playbook-saved-spot-id]");
  if (playbookButton) {
    const savedSpotId = playbookButton.dataset.addPlaybookSavedSpotId;
    const place = places.find((item) => String(item.savedSpotId) === String(savedSpotId));
    if (!place) return;

    playbookButton.disabled = true;
    playbookButton.textContent = "Adding...";

    try {
      const playbookPlace = await auth.addPlaceToDefaultPlaybook(place);
      [
        ...placeMatchKeys(place),
        playbookPlace?.place_id
      ].filter(Boolean).forEach((key) => playbookPlaceKeys.add(String(key)));
      playbookButton.textContent = "Added";
      playbookButton.classList.add("is-saved");
    } catch (error) {
      console.error(error);
      playbookButton.disabled = false;
      playbookButton.textContent = "Try Again";
    }
    return;
  }

  const removeButton = event.target.closest("button[data-saved-spot-id]");
  if (!removeButton) return;

  const savedSpotId = removeButton.dataset.savedSpotId;
  if (!savedSpotId) return;

  removeButton.disabled = true;
  try {
    await auth.deleteSavedSpot(savedSpotId);
    places = places.filter((place) => place.savedSpotId !== savedSpotId);
    renderCollections();
  } catch (error) {
    console.error(error);
    if (error.status === 401) return;
    removeButton.disabled = false;
  }
});

document.addEventListener("click", closeMenus);

setActiveMenuButton(collectionFilterMenu, "filter", activeCollectionFilter);
setActiveMenuButton(collectionSortMenu, "sort", activeSort);

async function initializeCollectionsPage() {
  if (!await auth.requireAuth()) return;

  if (!skeletons) {
    await loadSavedPlacesFromApi().catch(console.error);
    await loadPlaybookPlaceKeysFromApi().catch(console.error);
    renderCollections();
    return;
  }

  skeletons.showCollectionCards(collectionGrid, 8);
  await loadSavedPlacesFromApi().catch(console.error);
  await loadPlaybookPlaceKeysFromApi().catch(console.error);
  renderCollections();
}

initializeCollectionsPage();
