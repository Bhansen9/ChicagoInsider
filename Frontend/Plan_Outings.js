const collectionSearch = document.querySelector("#collectionSearch");
const outingSearch = document.querySelector("#outingSearch");
const collectionGrid = document.querySelector("#collectionGrid");
const outingGrid = document.querySelector("#outingGrid");
const playbookList = document.querySelector("#playbookList");
const playbookPanel = document.querySelector(".playbook-panel");
const playbookFilterBtn = document.querySelector("#playbookFilterBtn");
const playbookFilterMenu = document.querySelector("#playbookFilterMenu");
const addBlankStopBtn = document.querySelector("#addBlankStopBtn");
const createOutingBtn = document.querySelector("#createOutingBtn");
const collectionFilterBtn = document.querySelector("#collectionFilterBtn");
const outingFilterBtn = document.querySelector("#outingFilterBtn");
const collectionFilterMenu = document.querySelector("#collectionFilterMenu");
const outingFilterMenu = document.querySelector("#outingFilterMenu");
const skeletons = window.ChicagoInsiderSkeletons;
const auth = window.ChicagoInsiderAuth;
const playbookStorageKey = "chicagoInsider.playbookPlaces";
const API_BASE_URL = window.ChicagoInsiderApiBaseUrl ?? "http://localhost:3000";

function resolveAssetUrl(url) {
  if (!url || !url.startsWith("/")) return url;
  return `${API_BASE_URL}${url}`;
}

let places = [];
let outings = [];

let activeCollectionFilter = "all";
let activeOutingFilter = "all";
let playbookPlaces = loadPlaybookPlaces();
let draggedPlaceId = "";

function loadPlaybookPlaces() {
  try {
    const savedIds = JSON.parse(localStorage.getItem(playbookStorageKey) || "null");
    if (!Array.isArray(savedIds)) return [];

    return savedIds
      .map((placeId) => places.find((place) => place.id === placeId))
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

function savePlaybookPlaces() {
  try {
    localStorage.setItem(playbookStorageKey, JSON.stringify(playbookPlaces.map((place) => place.id)));
  } catch (error) {
    // localStorage can be unavailable in some private browsing or restricted contexts.
  }
}

function updatePlaybookPlaces(nextPlaces) {
  playbookPlaces = nextPlaces;
  savePlaybookPlaces();
  renderPlaybook();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function syncErrorText(error) {
  if (!error) return "";
  const detail = error.message || error.code || error.status;
  return detail ? String(detail) : "Save failed";
}

function matchesSearch(item, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [
    item.name,
    item.title,
    item.category,
    item.neighborhood,
    item.location,
    item.description,
    item.note
  ].some((value) => String(value || "").toLowerCase().includes(normalized));
}

function placeTile(place) {
  const image = resolveAssetUrl(place.image || place.imageUrl || "assets/pixel-chicago-hero.png");
  return `
    <article class="spot-tile" draggable="true" data-place-id="${escapeHtml(place.id)}">
      <span class="pill">${escapeHtml(place.category)} | ${escapeHtml(place.price)}</span>
      <button class="remove-saved-spot" type="button" draggable="false" data-saved-spot-id="${escapeHtml(place.savedSpotId)}" aria-label="Remove ${escapeHtml(place.name)} from saved places">Remove</button>
      <h4>${escapeHtml(place.name)}</h4>
      <img src="${escapeHtml(image)}" alt="${escapeHtml(place.name)}" draggable="false" />
      <p>${escapeHtml(place.description)}</p>
      <div class="spot-meta">${escapeHtml(place.note)}</div>
    </article>
  `;
}

function playbookCard(place, index) {
  const image = resolveAssetUrl(place.image || place.imageUrl || "assets/pixel-chicago-hero.png");
  const syncStatus = place.syncFailed
    ? `<span class="sync-status">Sync failed${place.syncError ? `: ${escapeHtml(place.syncError)}` : ""}</span>`
    : "";
  return `
    <article class="playbook-card" data-playbook-index="${index}">
      <span class="pill">${escapeHtml(place.category)} | ${escapeHtml(place.price)}</span>
      <h4>${escapeHtml(place.name)}</h4>
      <img src="${escapeHtml(image)}" alt="${escapeHtml(place.name)}" />
      <p>${escapeHtml(place.neighborhood)}</p>
      <p>${escapeHtml(place.note)}</p>
      ${syncStatus}
      <button class="remove-stop" type="button" aria-label="Remove ${escapeHtml(place.name)}">Remove</button>
    </article>
  `;
}

function displayPlaceId(place = {}) {
  const rawId = String(place.google_place_id || place.googlePlaceId || place.place_id || place.id || "");
  return rawId.startsWith("local:") ? rawId.slice(6) : rawId;
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
    maxWidthPx: "640",
    maxHeightPx: "420"
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

function normalizeStoredPlace(place = {}) {
  const metadata = place.metadata || {};
  const price = priceFromStoredPlace(place, metadata);
  return {
    id: displayPlaceId(place),
    placeId: place.placeId || place.id,
    googlePlaceId: place.google_place_id || place.googlePlaceId || place.place_id || "",
    supabasePlaceId: place.supabasePlaceId || place.id,
    name: place.name || "Chicago place",
    category: place.category || "Activity",
    type: typeFromStoredPlace(place, metadata),
    price,
    neighborhood: metadata.neighborhood || "Chicago",
    image: imageFromStoredPlace(place, metadata),
    description: place.formatted_address || "Saved Chicago place.",
    note: metadata.note || "Saved to your PlayBook"
  };
}

function normalizeSavedSpot(savedSpot = {}) {
  if (!savedSpot.place) return null;

  const place = normalizeStoredPlace(savedSpot.place);
  return {
    ...place,
    savedSpotId: savedSpot.id,
    note: savedSpot.notes || place.note || "Saved by you"
  };
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

function findPlaceByKey(placeId) {
  const key = String(placeId || "");
  if (!key) return null;
  return places.find((place) => placeMatchKeys(place).includes(key));
}

function samePlace(left = {}, right = {}) {
  const rightKeys = new Set(placeMatchKeys(right));
  return placeMatchKeys(left).some((key) => rightKeys.has(key));
}

function usesPlaceholderImage(place = {}) {
  return !place.image || String(place.image).includes("pixel-chicago-hero");
}

function uniquePlaces(nextPlaces) {
  const byId = new Map();
  nextPlaces.filter(Boolean).forEach((place) => {
    if (!place.id || byId.has(place.id)) return;
    byId.set(place.id, place);
  });
  return [...byId.values()];
}

function mergePlaceDisplayData(savedPlaces, discoveryPlaces) {
  const discoveryByKey = new Map();
  discoveryPlaces.forEach((place) => {
    placeMatchKeys(place).forEach((key) => discoveryByKey.set(key, place));
  });

  return savedPlaces.map((place) => {
    const match = placeMatchKeys(place).map((key) => discoveryByKey.get(key)).find(Boolean);
    if (!match) return place;

    return {
      ...place,
      image: usesPlaceholderImage(place) ? resolveAssetUrl(match.image || match.imageUrl || place.image) : place.image,
      description: place.description === "Saved Chicago place." ? (match.description || place.description) : place.description,
      neighborhood: place.neighborhood === "Chicago" ? (match.neighborhood || place.neighborhood) : place.neighborhood,
      note: place.note === "Saved to your PlayBook" ? (match.note || (match.vibes || []).join(", ") || place.note) : place.note
    };
  });
}

async function loadDiscoveryPlacesForDisplay() {
  const response = await fetch(`${API_BASE_URL}/api/places`);
  if (!response.ok) throw new Error("Could not load place display fallbacks");

  const data = await response.json();
  return Array.isArray(data.places) ? data.places : [];
}

function currentUserId() {
  const session = auth.getSession?.();
  return session?.user?.id || session?.user_id || auth.getProfile?.()?.id || "";
}

function isOwnedOuting(outing = {}) {
  const userId = currentUserId();
  if (!userId) return true;

  return [outing.owner_id, outing.user_id, outing.creator_user_id].some((id) => id === userId);
}

function outingFilterFor(outing = {}) {
  const text = `${outing.title || ""} ${outing.description || ""}`.toLowerCase();
  if (text.includes("date")) return "date";
  if (text.includes("birthday")) return "birthday";
  return "adventure";
}

function normalizeApiOuting(outing = {}) {
  const outingPlaces = outing.outing_places || [];
  const normalizedPlaces = outingPlaces.map((entry) => normalizeStoredPlace(entry.place));
  const images = normalizedPlaces.length
    ? normalizedPlaces.slice(0, 3).map((place) => place.image)
    : [resolveAssetUrl("assets/pixel-chicago-hero.png")];

  return {
    id: outing.id,
    title: outing.title || "Untitled Outing",
    filter: outingFilterFor(outing),
    location: normalizedPlaces[0]?.neighborhood || "Chicago",
    duration: `${normalizedPlaces.length} places | ${(outing.outing_contributors || []).length} contributors`,
    time: outing.starts_at ? new Date(outing.starts_at).toLocaleString() : "No date set",
    images
  };
}

async function loadSavedPlacesFromApi() {
  const savedSpots = await auth.getSavedSpots();
  places = uniquePlaces(savedSpots.map(normalizeSavedSpot));
  if (places.some(usesPlaceholderImage)) {
    const cachedPlaces = await window.ChicagoInsiderPlaceCache?.cacheDisplayedPlaces(places).catch((error) => {
      console.error(error);
      return [];
    });
    if (cachedPlaces?.length) {
      const refreshedSavedSpots = await auth.getSavedSpots();
      places = uniquePlaces(refreshedSavedSpots.map(normalizeSavedSpot));
    }
  }
  if (places.some(usesPlaceholderImage)) {
    const discoveryPlaces = await loadDiscoveryPlacesForDisplay().catch((error) => {
      console.error(error);
      return [];
    });
    places = mergePlaceDisplayData(places, discoveryPlaces);
  }
  playbookPlaces = loadPlaybookPlaces();
}

async function loadPlaybookPlacesFromApi() {
  const localPlaces = loadPlaybookPlaces();
  const storedPlaces = await auth.getDefaultPlaybookPlaces();

  const serverPlaces = storedPlaces.map(normalizeStoredPlace);
  const mergedPlaces = [...serverPlaces];
  localPlaces.forEach((localPlace) => {
    if (!mergedPlaces.some((serverPlace) => samePlace(serverPlace, localPlace))) {
      mergedPlaces.push({ ...localPlace, syncFailed: true });
    }
  });

  if (!mergedPlaces.length) {
    playbookPlaces = [];
    savePlaybookPlaces();
    return;
  }

  playbookPlaces = await syncLocalPlaybookPlaces(mergedPlaces);
  savePlaybookPlaces();
}

async function syncLocalPlaybookPlaces(nextPlaces) {
  let syncedPlaces = nextPlaces;
  const localOnlyPlaces = syncedPlaces.filter((place) => place.syncFailed || !place.supabasePlaceId);

  for (const place of localOnlyPlaces) {
    try {
      const playbookPlace = await auth.addPlaceToDefaultPlaybook(place);
      syncedPlaces = syncedPlaces.map((selectedPlace) => (
        samePlace(selectedPlace, place)
          ? { ...selectedPlace, supabasePlaceId: playbookPlace.place_id, syncFailed: false, syncError: "" }
          : selectedPlace
      ));
    } catch (error) {
      console.error(error);
      syncedPlaces = syncedPlaces.map((selectedPlace) => (
        samePlace(selectedPlace, place)
          ? { ...selectedPlace, syncFailed: true, syncError: syncErrorText(error) }
          : selectedPlace
      ));
    }
  }

  return syncedPlaces;
}

async function loadOutingsFromApi() {
  const apiOutings = await auth.getOutings();
  outings = apiOutings.filter(isOwnedOuting).map(normalizeApiOuting);
}

function outingCard(outing) {
  const images = outing.images.map((image, index) => (
    `<img src="${escapeHtml(image)}" alt="${escapeHtml(outing.title)} stop ${index + 1}" />`
  )).join("");

  return `
    <article class="outing-card" data-outing-id="${escapeHtml(outing.id)}">
      <div class="outing-actions" aria-hidden="true">
        <span class="outing-left-icons">
          <svg class="outing-icon upload-icon" viewBox="0 0 24 24" focusable="false">
            <path d="M12 3v12"></path>
            <path d="M7 8l5-5 5 5"></path>
            <path d="M5 13v6h14v-6"></path>
          </svg>
          <svg class="outing-icon star-icon" viewBox="0 0 24 24" focusable="false">
            <path d="M12 3.5l2.65 5.35 5.9.86-4.27 4.16 1.01 5.87L12 16.96 6.71 19.74l1.01-5.87-4.27-4.16 5.9-.86L12 3.5z"></path>
          </svg>
        </span>
        <svg class="outing-icon more-icon" viewBox="0 0 24 24" focusable="false">
          <circle cx="12" cy="12" r="8.5"></circle>
          <circle class="more-dot" cx="8.5" cy="12" r="1"></circle>
          <circle class="more-dot" cx="12" cy="12" r="1"></circle>
          <circle class="more-dot" cx="15.5" cy="12" r="1"></circle>
        </svg>
      </div>
      <h4>${escapeHtml(outing.title)}</h4>
      <p class="location">Location: ${escapeHtml(outing.location)}</p>
      <p class="location">${escapeHtml(outing.duration)}</p>
      <div class="outing-images">${images}</div>
      <p class="time">${escapeHtml(outing.time)}</p>
    </article>
  `;
}

function renderCollections() {
  const query = collectionSearch.value;
  const filteredPlaces = places.filter((place) => {
    const filterMatch = activeCollectionFilter === "all" || place.type === activeCollectionFilter;
    return filterMatch && matchesSearch(place, query);
  });

  const emptyState = places.length
    ? {
      title: "No saved places match",
      body: "Try a different search or filter to find another saved spot.",
      href: "Full_Collections_Page.html",
      action: "Browse collections"
    }
    : {
      title: "No saved places yet",
      body: "Save places from Full Collections and they will appear here for quick planning.",
      href: "Full_Collections_Page.html",
      action: "Find places to save"
    };

  collectionGrid.innerHTML = filteredPlaces.length
    ? filteredPlaces.map(placeTile).join("")
    : emptyBoardState(emptyState);
  collectionGrid.classList.toggle("has-empty-state", filteredPlaces.length === 0);
  skeletons?.markLoaded(collectionGrid);
  window.cacheDisplayedPlaces?.(filteredPlaces);
}

function renderOutings() {
  const query = outingSearch.value;
  const filteredOutings = outings.filter((outing) => {
    const filterMatch = activeOutingFilter === "all" || outing.filter === activeOutingFilter;
    return filterMatch && matchesSearch(outing, query);
  });

  const emptyState = outings.length
    ? {
      title: "No outings match",
      body: "Try a broader search or switch the outing filter.",
      href: "Outings_Creations_Page.html",
      action: "Create new outing"
    }
    : {
      title: "No recent outings yet",
      body: "Create your first outing and it will show up here for quick access.",
      href: "Outings_Creations_Page.html",
      action: "Create an outing"
    };

  outingGrid.innerHTML = filteredOutings.length
    ? filteredOutings.slice(0, 3).map(outingCard).join("")
    : emptyBoardState(emptyState);
  outingGrid.classList.toggle("has-empty-state", filteredOutings.length === 0);
  skeletons?.markLoaded(outingGrid);
}

function emptyBoardState({ title, body, href, action }) {
  return `
    <div class="board-empty-state">
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(body)}</p>
      <a href="${escapeHtml(href)}">${escapeHtml(action)}</a>
    </div>
  `;
}

function renderPlaybook() {
  const isEmpty = playbookPlaces.length === 0;
  playbookList.classList.toggle("is-empty", isEmpty);
  addBlankStopBtn.classList.toggle("is-hidden", !isEmpty);
  playbookList.innerHTML = playbookPlaces.length
    ? playbookPlaces.map(playbookCard).join("")
    : `<p class="drop-hint">Drag places here</p>`;
  skeletons?.markLoaded(playbookList);
}

async function addPlaceToPlaybook(placeId) {
  const place = findPlaceByKey(placeId);
  if (!place) {
    console.warn("Could not find dropped place", placeId);
    return;
  }
  if (playbookPlaces.some((selectedPlace) => samePlace(selectedPlace, place))) return;

  updatePlaybookPlaces([...playbookPlaces, place]);

  try {
    const playbookPlace = await auth.addPlaceToDefaultPlaybook(place);
    updatePlaybookPlaces(playbookPlaces.map((selectedPlace) => (
      samePlace(selectedPlace, place)
        ? { ...selectedPlace, supabasePlaceId: playbookPlace.place_id, syncFailed: false, syncError: "" }
        : selectedPlace
    )));
  } catch (error) {
    console.error(error);
    updatePlaybookPlaces(playbookPlaces.map((selectedPlace) => (
      samePlace(selectedPlace, place)
        ? { ...selectedPlace, syncFailed: true, syncError: syncErrorText(error) }
        : selectedPlace
    )));
  }
}

function setActiveMenuButton(menu, value) {
  menu.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === value);
  });
}

function closeMenus() {
  playbookFilterMenu.classList.remove("open");
  collectionFilterMenu.classList.remove("open");
  outingFilterMenu.classList.remove("open");
}

collectionSearch.addEventListener("input", renderCollections);
outingSearch.addEventListener("input", renderOutings);

playbookFilterBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  collectionFilterMenu.classList.remove("open");
  outingFilterMenu.classList.remove("open");
  playbookFilterMenu.classList.toggle("open");
});

collectionFilterBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  playbookFilterMenu.classList.remove("open");
  outingFilterMenu.classList.remove("open");
  collectionFilterMenu.classList.toggle("open");
});

outingFilterBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  playbookFilterMenu.classList.remove("open");
  collectionFilterMenu.classList.remove("open");
  outingFilterMenu.classList.toggle("open");
});

playbookFilterMenu.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.action === "clear") {
    updatePlaybookPlaces([]);
  }

  if (button.dataset.action === "budget") {
    const priceOrder = { Free: 0, "$": 1, "$$": 2, "$$$": 3 };
    updatePlaybookPlaces([...playbookPlaces].sort((a, b) => (
      (priceOrder[a.price] ?? 99) - (priceOrder[b.price] ?? 99)
    )));
  }

  if (button.dataset.action === "neighborhood") {
    updatePlaybookPlaces([...playbookPlaces].sort((a, b) => (
      a.neighborhood.localeCompare(b.neighborhood)
    )));
  }

  closeMenus();
});

collectionFilterMenu.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  activeCollectionFilter = button.dataset.filter;
  setActiveMenuButton(collectionFilterMenu, activeCollectionFilter);
  renderCollections();
  closeMenus();
});

outingFilterMenu.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  activeOutingFilter = button.dataset.filter;
  setActiveMenuButton(outingFilterMenu, activeOutingFilter);
  renderOutings();
  closeMenus();
});

collectionGrid.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".remove-saved-spot")) return;

  const tile = event.target.closest(".spot-tile");
  if (!tile) return;

  draggedPlaceId = tile.dataset.placeId || "";
});

collectionGrid.addEventListener("dragstart", (event) => {
  const tile = event.target.closest(".spot-tile");
  if (!tile) return;
  if (event.target.closest(".remove-saved-spot")) {
    event.preventDefault();
    return;
  }

  draggedPlaceId = tile.dataset.placeId || "";
  event.dataTransfer.setData("text/plain", draggedPlaceId);
  event.dataTransfer.setData("application/x-chicago-place-id", draggedPlaceId);
  event.dataTransfer.effectAllowed = "copy";
  tile.classList.add("is-dragging");
});

collectionGrid.addEventListener("dragend", (event) => {
  const tile = event.target.closest(".spot-tile");
  if (tile) tile.classList.remove("is-dragging");
  draggedPlaceId = "";
});

collectionGrid.addEventListener("click", async (event) => {
  const removeButton = event.target.closest(".remove-saved-spot[data-saved-spot-id]");
  if (!removeButton) return;

  event.preventDefault();
  event.stopPropagation();

  const savedSpotId = removeButton.dataset.savedSpotId;
  if (!savedSpotId) return;

  removeButton.disabled = true;
  try {
    await auth.deleteSavedSpot(savedSpotId);
    places = places.filter((place) => place.savedSpotId !== savedSpotId);
    renderCollections();
  } catch (error) {
    console.error(error);
    removeButton.disabled = false;
  }
});

function placeIdFromDrop(event) {
  return (
    event.dataTransfer.getData("application/x-chicago-place-id") ||
    event.dataTransfer.getData("text/plain") ||
    draggedPlaceId
  );
}

function markPlaybookDragOver(event) {
  event.preventDefault();
  playbookList.classList.add("drag-over");
  addBlankStopBtn.classList.add("drag-over");
  event.dataTransfer.dropEffect = "copy";
}

function clearPlaybookDragOver() {
  playbookList.classList.remove("drag-over");
  addBlankStopBtn.classList.remove("drag-over");
}

async function handlePlaybookDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  clearPlaybookDragOver();

  const placeId = placeIdFromDrop(event);
  draggedPlaceId = "";
  await addPlaceToPlaybook(placeId);
}

playbookPanel.addEventListener("dragover", markPlaybookDragOver, true);

playbookPanel.addEventListener("dragleave", (event) => {
  if (!playbookPanel.contains(event.relatedTarget)) clearPlaybookDragOver();
});

playbookPanel.addEventListener("drop", handlePlaybookDrop, true);

playbookList.addEventListener("dragover", markPlaybookDragOver);

playbookList.addEventListener("dragleave", clearPlaybookDragOver);

playbookList.addEventListener("drop", handlePlaybookDrop);

addBlankStopBtn.addEventListener("dragover", (event) => {
  markPlaybookDragOver(event);
});

addBlankStopBtn.addEventListener("dragleave", () => {
  clearPlaybookDragOver();
});

addBlankStopBtn.addEventListener("drop", async (event) => {
  await handlePlaybookDrop(event);
});

playbookList.addEventListener("click", async (event) => {
  const removeButton = event.target.closest(".remove-stop");
  if (!removeButton) return;

  const card = removeButton.closest(".playbook-card");
  const index = Number(card.dataset.playbookIndex);
  const place = playbookPlaces[index];
  if (place?.supabasePlaceId) {
    await auth.deletePlaceFromDefaultPlaybook(place.supabasePlaceId).catch(console.error);
  }
  updatePlaybookPlaces(playbookPlaces.filter((_, itemIndex) => itemIndex !== index));
});

addBlankStopBtn.addEventListener("click", async () => {
  const nextPlace = places.find((place) => !playbookPlaces.some((selected) => selected.id === place.id)) || places[0];
  if (!nextPlace) return;
  await addPlaceToPlaybook(nextPlace.id);
});

createOutingBtn.addEventListener("click", () => {
  window.location.href = "Outings_Creations_Page.html";
});

document.addEventListener("click", closeMenus);

setActiveMenuButton(collectionFilterMenu, activeCollectionFilter);
setActiveMenuButton(outingFilterMenu, activeOutingFilter);

async function initializePlannerPage() {
  if (!await auth.requireAuth()) return;

  if (!skeletons) {
    await loadSavedPlacesFromApi().catch(console.error);
    await Promise.all([
      loadPlaybookPlacesFromApi().catch(console.error),
      loadOutingsFromApi().catch(console.error)
    ]);
    renderCollections();
    renderOutings();
    renderPlaybook();
    return;
  }

  skeletons.showSpotTiles(collectionGrid, 6);
  skeletons.showOutingCards(outingGrid, 3);
  skeletons.showPlaybookCards(playbookList, 2);
  await loadSavedPlacesFromApi().catch(console.error);
  await Promise.all([
    loadPlaybookPlacesFromApi().catch(console.error),
    loadOutingsFromApi().catch(console.error)
  ]);
  renderCollections();
  renderOutings();
  renderPlaybook();
}

initializePlannerPage();
