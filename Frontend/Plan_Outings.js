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
const savedOutingsStorageKey = "chicagoInsider.savedOutings";
const selectedOutingStorageKey = "chicagoInsider.selectedOuting";
const favoriteOutingsStorageKey = "chicagoInsider.favoriteOutings";
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
let favoriteOutingIds = loadFavoriteOutingIds();

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

function loadLocalOutingSnapshots() {
  try {
    const savedOutings = JSON.parse(localStorage.getItem(savedOutingsStorageKey) || "[]");
    return Array.isArray(savedOutings) ? savedOutings : [];
  } catch (error) {
    return [];
  }
}

function loadFavoriteOutingIds() {
  try {
    const value = JSON.parse(localStorage.getItem(favoriteOutingsStorageKey) || "[]");
    return new Set(Array.isArray(value) ? value.map(String) : []);
  } catch (error) {
    return new Set();
  }
}

function saveFavoriteOutingIds() {
  try {
    localStorage.setItem(favoriteOutingsStorageKey, JSON.stringify([...favoriteOutingIds]));
  } catch (error) {
    // localStorage can be unavailable in some private browsing or restricted contexts.
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // localStorage can be unavailable in some private browsing or restricted contexts.
  }
}

function playbookServerPlaceId(place = {}) {
  return place.supabasePlaceId || place.placeId || "";
}

async function clearPlaybookPlaces() {
  const placesToClear = [...playbookPlaces];
  const serverPlaceIds = [...new Set(placesToClear.map(playbookServerPlaceId).filter(Boolean).map(String))];

  updatePlaybookPlaces([]);
  if (!serverPlaceIds.length) return;

  const deleteResults = await Promise.allSettled(
    serverPlaceIds.map((placeId) => auth.deletePlaceFromDefaultPlaybook(placeId))
  );
  const failedPlaceIds = deleteResults
    .map((result, index) => result.status === "rejected" ? serverPlaceIds[index] : "")
    .filter(Boolean);

  if (!failedPlaceIds.length) return;

  deleteResults
    .filter((result) => result.status === "rejected")
    .forEach((result) => console.error(result.reason));

  const failedIdSet = new Set(failedPlaceIds);
  updatePlaybookPlaces(placesToClear
    .filter((place) => failedIdSet.has(String(playbookServerPlaceId(place))))
    .map((place) => ({
      ...place,
      syncFailed: true,
      syncError: "Clear failed"
    })));
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
    serverId: outing.id,
    clientId: "",
    title: outing.title || "Untitled Outing",
    filter: outingFilterFor(outing),
    location: normalizedPlaces[0]?.neighborhood || "Chicago",
    duration: `${normalizedPlaces.length} places | ${(outing.outing_contributors || []).length} contributors`,
    time: outing.starts_at ? new Date(outing.starts_at).toLocaleString() : "No date set",
    date: outing.starts_at ? outing.starts_at.slice(0, 10) : "",
    timeframe: String(outing.description || "").replace(/^TimeFrame:\s*/i, "") || "Evening: 5 PM - 9 PM",
    workspacePlaceIds: normalizedPlaces.map((place) => place.id),
    workspacePlaces: normalizedPlaces,
    contributors: (outing.outing_contributors || []).map((contributor) => ({
      username: contributor.user?.username || contributor.user_id || "guest",
      role: contributor.permission || "read"
    })),
    images,
    savedAt: outing.updated_at || outing.created_at || new Date().toISOString()
  };
}

function localOutingPlaceLookup(localOuting = {}) {
  const byId = new Map();
  const rememberPlace = (place = {}) => {
    [
      place.id,
      place.placeId,
      place.supabasePlaceId,
      place.googlePlaceId,
      place.google_place_id
    ].filter(Boolean).forEach((id) => byId.set(String(id), place));
  };

  places.forEach(rememberPlace);
  playbookPlaces.forEach(rememberPlace);
  (localOuting.playbookPlaces || []).forEach(rememberPlace);
  (localOuting.workspacePlaces || []).forEach(rememberPlace);
  return byId;
}

function normalizeLocalOuting(localOuting = {}) {
  const placeIds = Array.isArray(localOuting.workspacePlaceIds)
    ? localOuting.workspacePlaceIds
    : localOuting.playbookPlaceIds || [];
  const placeById = localOutingPlaceLookup(localOuting);
  const outingPlaces = placeIds
    .map((placeId) => placeById.get(String(placeId)))
    .filter(Boolean);
  const images = outingPlaces.length
    ? outingPlaces.slice(0, 3).map((place) => resolveAssetUrl(place.image || place.imageUrl || "assets/pixel-chicago-hero.png"))
    : [resolveAssetUrl("assets/pixel-chicago-hero.png")];
  const contributorCount = Array.isArray(localOuting.contributors) ? localOuting.contributors.length : 0;
  const dateValue = localOuting.date || localOuting.starts_at || localOuting.startsAt;
  const savedAt = localOuting.savedAt || new Date().toISOString();

  return {
    id: localOuting.serverId || localOuting.id || localOuting.clientId || `local-${savedAt}`,
    clientId: localOuting.clientId,
    serverId: localOuting.serverId,
    title: localOuting.title || "Untitled Outing",
    filter: outingFilterFor(localOuting),
    location: outingPlaces[0]?.neighborhood || "Chicago",
    duration: `${placeIds.length || outingPlaces.length} places | ${contributorCount} contributors`,
    time: dateValue ? new Date(dateValue).toLocaleString() : "No date set",
    date: localOuting.date || "",
    timeframe: localOuting.timeframe || "Evening: 5 PM - 9 PM",
    playbookPlaceIds: localOuting.playbookPlaceIds || [],
    workspacePlaceIds: localOuting.workspacePlaceIds || placeIds,
    playbookPlaces: localOuting.playbookPlaces || [],
    workspacePlaces: localOuting.workspacePlaces || outingPlaces,
    contributors: localOuting.contributors || [],
    images,
    savedAt
  };
}

function mergeOutings(apiOutings, localOutings) {
  const merged = [];
  const seen = new Set();
  const keysForOuting = (outing = {}) => [
    outing.serverId,
    outing.clientId,
    outing.id
  ].filter(Boolean).map(String);
  const isNewerOrSame = (candidate = {}, existing = {}) => (
    new Date(candidate.savedAt || 0).getTime() >= new Date(existing.savedAt || 0).getTime()
  );

  apiOutings.forEach((outing) => {
    merged.push(outing);
    keysForOuting(outing).forEach((key) => seen.add(key));
  });

  localOutings.forEach((outing) => {
    const existingIndex = merged.findIndex((mergedOuting) => (
      keysForOuting(outing).some((key) => keysForOuting(mergedOuting).includes(key))
    ));

    if (existingIndex >= 0) {
      if (isNewerOrSame(outing, merged[existingIndex])) {
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...outing
        };
      }
      keysForOuting(outing).forEach((key) => seen.add(key));
      return;
    }

    merged.push(outing);
    keysForOuting(outing).forEach((key) => seen.add(key));
  });

  return merged;
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
  const localOutings = loadLocalOutingSnapshots()
    .sort((a, b) => Date.parse(b.savedAt || 0) - Date.parse(a.savedAt || 0))
    .map(normalizeLocalOuting);

  try {
    const apiOutings = await auth.getOutings();
    outings = mergeOutings(
      localOutings,
      apiOutings.filter(isOwnedOuting).map(normalizeApiOuting)
    );
  } catch (error) {
    console.error(error);
    outings = localOutings;
  }
}

function outingCard(outing) {
  const images = outing.images.map((image, index) => (
    `<img src="${escapeHtml(image)}" alt="${escapeHtml(outing.title)} stop ${index + 1}" />`
  )).join("");
  const isFavorite = favoriteOutingIds.has(String(outing.id));

  return `
    <article class="outing-card" data-outing-id="${escapeHtml(outing.id)}" role="button" tabindex="0" aria-label="Open ${escapeHtml(outing.title)}">
      <div class="outing-actions">
        <span class="outing-left-icons">
          <button class="outing-action-button" type="button" data-outing-action="share" aria-label="Share ${escapeHtml(outing.title)}">
            <svg class="outing-icon upload-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M12 3v12"></path>
              <path d="M7 8l5-5 5 5"></path>
              <path d="M5 13v6h14v-6"></path>
            </svg>
          </button>
          <button class="outing-action-button favorite-button ${isFavorite ? "is-favorite" : ""}" type="button" data-outing-action="favorite" aria-label="${isFavorite ? "Unstar" : "Star"} ${escapeHtml(outing.title)}" aria-pressed="${isFavorite}">
            <svg class="outing-icon star-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
              <path d="M12 3.5l2.65 5.35 5.9.86-4.27 4.16 1.01 5.87L12 16.96 6.71 19.74l1.01-5.87-4.27-4.16 5.9-.86L12 3.5z"></path>
            </svg>
          </button>
        </span>
        <button class="outing-action-button" type="button" data-outing-action="more" aria-label="More options for ${escapeHtml(outing.title)}">
          <svg class="outing-icon more-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <circle cx="12" cy="12" r="8.5"></circle>
            <circle class="more-dot" cx="8.5" cy="12" r="1"></circle>
            <circle class="more-dot" cx="12" cy="12" r="1"></circle>
            <circle class="more-dot" cx="15.5" cy="12" r="1"></circle>
          </svg>
        </button>
      </div>
      <h4>${escapeHtml(outing.title)}</h4>
      <p class="location">Location: ${escapeHtml(outing.location)}</p>
      <p class="location">${escapeHtml(outing.duration)}</p>
      <div class="outing-images">${images}</div>
      <p class="time">${escapeHtml(outing.time)}</p>
      <div class="outing-card-menu" data-outing-menu="${escapeHtml(outing.id)}">
        <button type="button" data-outing-action="open">Open</button>
        <button type="button" data-outing-action="share">Share</button>
        <button type="button" data-outing-action="duplicate">Duplicate</button>
        <button class="danger-action" type="button" data-outing-action="delete">Delete</button>
      </div>
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
    ? filteredOutings.map(outingCard).join("")
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

function outingById(outingId) {
  return outings.find((outing) => String(outing.id) === String(outingId));
}

function outingEditSnapshot(outing = {}) {
  return {
    id: outing.id,
    clientId: outing.clientId || outing.id,
    serverId: outing.serverId || "",
    title: outing.title || "Untitled Outing",
    date: outing.date || "",
    timeframe: outing.timeframe || "Evening: 5 PM - 9 PM",
    playbookPlaceIds: outing.playbookPlaceIds || [],
    workspacePlaceIds: outing.workspacePlaceIds || [],
    playbookPlaces: outing.playbookPlaces || [],
    workspacePlaces: outing.workspacePlaces || [],
    contributors: outing.contributors || [],
    savedAt: outing.savedAt || new Date().toISOString()
  };
}

function openOuting(outingId) {
  const outing = outingById(outingId);
  if (!outing) return;

  writeJson(selectedOutingStorageKey, outingEditSnapshot(outing));
  window.location.href = `Outings_Creations_Page.html?outingId=${encodeURIComponent(outing.id)}`;
}

function outingShareUrl(outing = {}) {
  const url = new URL("Outings_Creations_Page.html", window.location.href);
  url.searchParams.set("outingId", outing.id);
  return url.href;
}

async function shareOuting(outingId) {
  const outing = outingById(outingId);
  if (!outing) return;

  const shareData = {
    title: outing.title || "ChicagoInsider outing",
    text: `${outing.title || "ChicagoInsider outing"} - ${outing.duration || ""}`.trim(),
    url: outingShareUrl(outing)
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    await navigator.clipboard.writeText(shareData.url);
    window.alert("Outing link copied.");
  } catch (error) {
    if (error?.name !== "AbortError") console.error(error);
  }
}

function toggleFavoriteOuting(outingId) {
  const key = String(outingId || "");
  if (!key) return;

  if (favoriteOutingIds.has(key)) {
    favoriteOutingIds.delete(key);
  } else {
    favoriteOutingIds.add(key);
  }

  saveFavoriteOutingIds();
  renderOutings();
}

function duplicateOuting(outingId) {
  const outing = outingById(outingId);
  if (!outing) return;
  const duplicateId = `outing-${Date.now()}`;

  const duplicate = {
    ...outingEditSnapshot(outing),
    id: duplicateId,
    clientId: duplicateId,
    serverId: "",
    title: `${outing.title || "Untitled Outing"} Copy`,
    savedAt: new Date().toISOString()
  };
  const savedOutings = loadLocalOutingSnapshots();
  writeJson(savedOutingsStorageKey, [duplicate, ...savedOutings]);
  loadOutingsFromApi().finally(renderOutings);
}

function removeLocalOuting(outing = {}) {
  const keys = new Set([
    outing.id,
    outing.clientId,
    outing.serverId
  ].filter(Boolean).map(String));
  const savedOutings = loadLocalOutingSnapshots().filter((savedOuting) => ![
    savedOuting.id,
    savedOuting.clientId,
    savedOuting.serverId
  ].filter(Boolean).some((key) => keys.has(String(key))));

  writeJson(savedOutingsStorageKey, savedOutings);
  keys.forEach((key) => favoriteOutingIds.delete(key));
  saveFavoriteOutingIds();
}

async function deleteOutingCard(outingId) {
  const outing = outingById(outingId);
  if (!outing) return;

  closeOutingMenus();
  removeLocalOuting(outing);
  outings = outings.filter((item) => String(item.id) !== String(outing.id));
  renderOutings();

  if (!outing.serverId || !auth.deleteOuting) return;

  try {
    await auth.deleteOuting(outing.serverId);
  } catch (error) {
    console.error(error);
    window.alert("Could not delete this outing from your account. Refresh to check its current status.");
  }
}

function closeOutingMenus() {
  document.querySelectorAll(".outing-card-menu.open").forEach((menu) => {
    menu.classList.remove("open");
  });
}

function toggleOutingMenu(outingId) {
  const menu = [...outingGrid.querySelectorAll(".outing-card-menu")]
    .find((item) => item.dataset.outingMenu === String(outingId));
  if (!menu) return;

  const wasOpen = menu.classList.contains("open");
  closeOutingMenus();
  menu.classList.toggle("open", !wasOpen);
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
  closeOutingMenus();
}

collectionSearch.addEventListener("input", renderCollections);
outingSearch.addEventListener("input", renderOutings);

outingGrid.addEventListener("click", (event) => {
  const card = event.target.closest(".outing-card[data-outing-id]");
  if (!card) return;

  const actionButton = event.target.closest("[data-outing-action]");
  if (actionButton) {
    event.stopPropagation();
    const action = actionButton.dataset.outingAction;

    if (action !== "more") closeOutingMenus();
    if (action === "open") openOuting(card.dataset.outingId);
    if (action === "share") shareOuting(card.dataset.outingId);
    if (action === "favorite") toggleFavoriteOuting(card.dataset.outingId);
    if (action === "duplicate") duplicateOuting(card.dataset.outingId);
    if (action === "delete") deleteOutingCard(card.dataset.outingId);
    if (action === "more") toggleOutingMenu(card.dataset.outingId);
    return;
  }

  openOuting(card.dataset.outingId);
});

outingGrid.addEventListener("keydown", (event) => {
  if (!["Enter", " "].includes(event.key)) return;
  const card = event.target.closest(".outing-card[data-outing-id]");
  if (!card || event.target.closest("[data-outing-action]")) return;

  event.preventDefault();
  openOuting(card.dataset.outingId);
});

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

playbookFilterMenu.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.action === "clear") {
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Clearing...";
    await clearPlaybookPlaces();
    button.disabled = false;
    button.textContent = originalText;
    closeMenus();
    return;
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
