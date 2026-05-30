const outingTitleInput = document.querySelector("#outingTitleInput");
const outingDateInput = document.querySelector("#outingDateInput");
const timeframeSelect = document.querySelector("#timeframeSelect");
const collectionsList = document.querySelector("#creationPlaybookList");
const fileMenuBtn = document.querySelector("#fileMenuBtn");
const fileMenu = document.querySelector("#fileMenu");
const editMenuBtn = document.querySelector("#editMenuBtn");
const editMenu = document.querySelector("#editMenu");
const headerShareBtn = document.querySelector("#headerShareBtn");
const playbookOptionsBtn = document.querySelector("#playbookOptionsBtn");
const playbookOptionsMenu = document.querySelector("#playbookOptionsMenu");
const outingMapPreview = document.querySelector("#outingMapPreview");
const shareDialog = document.querySelector("#shareDialog");
const closeShareDialogBtn = document.querySelector("#closeShareDialogBtn");
const shareUsernameInput = document.querySelector("#shareUsernameInput");
const addShareUserBtn = document.querySelector("#addShareUserBtn");
const shareResults = document.querySelector("#shareResults");
const sharedUsers = document.querySelector("#sharedUsers");
const playbookStorageKey = "chicagoInsider.playbookPlaces";
const savedOutingsStorageKey = "chicagoInsider.savedOutings";

const API_BASE_URL =
  window.location.protocol === "file:" || window.location.host !== "localhost:3000"
    ? "http://localhost:3000"
    : "";

const allPlaces = [
  {
    id: "art-institute",
    name: "The Art Institute of Chicago",
    category: "Museum",
    price: "$$",
    neighborhood: "Downtown",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Art%20Institute%20of%20Chicago%20Lion%20%288519756704%29.jpg?width=500",
    website: "artic.edu",
    timeWindow: "11 AM - 5 PM",
    note: "Arts, Classic, Quiet",
    coordinates: { lat: 41.8796, lng: -87.6237 }
  },
  {
    id: "riverwalk",
    name: "Chicago Riverwalk",
    category: "Activity",
    price: "Free",
    neighborhood: "River North",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Riverwalk%20%2851556708640%29.jpg?width=500",
    website: "chicagoriverwalk.us",
    timeWindow: "Open all day",
    note: "Scenic, Walkable, Romantic",
    coordinates: { lat: 41.8871, lng: -87.6271 }
  },
  {
    id: "au-cheval",
    name: "Au Cheval",
    category: "Food",
    price: "$$$",
    neighborhood: "West Loop",
    image: "https://images.squarespace-cdn.com/content/v1/67223ccb89a1690d7a80caa4/1732119030238-4C3W8KF5GEIN0ZR2Z5XA/auc1-29.jpg",
    website: "auchevaldiner.com",
    timeWindow: "10:30 AM - 11 PM",
    note: "Trendy, Busy, Foodie",
    coordinates: { lat: 41.8847, lng: -87.6477 }
  },
  {
    id: "londonhouse",
    name: "LondonHouse Rooftop",
    category: "Bar",
    price: "$$$",
    neighborhood: "River North",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/London%20House%20Rooftop%2C%20Chicago.jpg?width=500",
    website: "londonhousechicago.com",
    timeWindow: "11 AM - 12 AM",
    note: "Fancy, Scenic, Romantic",
    coordinates: { lat: 41.8876, lng: -87.6255 }
  },
  {
    id: "small-cheval",
    name: "Small Cheval",
    category: "Food",
    price: "$$",
    neighborhood: "Wicker Park",
    image: "https://images.squarespace-cdn.com/content/v1/664b756924d01f2bafa19992/bfae2152-f1c0-4280-80f5-11ea7e0860db/new-shots-outdoor-2.jpeg",
    website: "smallcheval.com",
    timeWindow: "11 AM - 10 PM",
    note: "Casual, Quick, Tasty",
    coordinates: { lat: 41.9099, lng: -87.6777 }
  },
  {
    id: "violet-hour",
    name: "The Violet Hour",
    category: "Bar",
    price: "$$$",
    neighborhood: "Wicker Park",
    image: "https://images.squarespace-cdn.com/content/v1/5689f7a2c21b8690d5c16c46/1626115529676-3NAZ1D98F1VN338QGJW4/tvh7.jpeg",
    website: "theviolethour.com",
    timeWindow: "5 PM - 1 AM",
    note: "Hidden, Cocktails, Date",
    coordinates: { lat: 41.9094, lng: -87.6774 }
  },
  {
    id: "millennium",
    name: "Millennium Park",
    category: "Landmark",
    price: "Free",
    neighborhood: "Downtown",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Millennium%20park%2Cchicago.JPG?width=500",
    website: "chicago.gov/millenniumpark",
    timeWindow: "6 AM - 11 PM",
    note: "Touristy, Scenic, Photo Friendly",
    coordinates: { lat: 41.8826, lng: -87.6226 }
  },
  {
    id: "cindy",
    name: "Cindy's Rooftop",
    category: "Food",
    price: "$$$",
    neighborhood: "Loop",
    image: "https://cdn.prod.website-files.com/692deee1433d0acae210e525/6930b2963bc306834dd9c99c_Daniel%20Kelleghan%20Photography-2024-03-25%20Cindys57247-HDR.avif",
    website: "cindysrooftop.com",
    timeWindow: "11 AM - 12 AM",
    note: "Views, Brunch, Groups",
    coordinates: { lat: 41.8817, lng: -87.6247 }
  }
];

let playbookPlaces = loadPlaybookPlaces();
let outingMap;
let googleMapsPromise;
let mapMarkers = [];
let activeInfoWindow;
let sharedUsernames = [];
const mockUsers = ["ben", "trevor", "alex", "jordan"];
let undoStack = [];
let redoStack = [];
let titleEditSnapshot = null;
let dateEditSnapshot = null;
let timeframeEditSnapshot = null;
let isApplyingHistory = false;

const chicagoMapBounds = {
  north: 41.96,
  south: 41.78,
  west: -87.74,
  east: -87.55
};

function captureOutingState() {
  return {
    title: outingTitleInput.value,
    date: outingDateInput.value,
    timeframe: timeframeSelect.value,
    playbookPlaceIds: playbookPlaces.map((place) => place.id),
    sharedUsernames: [...sharedUsernames]
  };
}

function statesMatch(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function pushUndoState(state = captureOutingState()) {
  if (isApplyingHistory) return;
  if (undoStack.length && statesMatch(undoStack[undoStack.length - 1], state)) return;

  undoStack.push(state);
  redoStack = [];
}

function applyOutingState(state) {
  isApplyingHistory = true;
  outingTitleInput.value = state.title || "Untitled Outing";
  outingDateInput.value = state.date || new Date().toISOString().slice(0, 10);
  timeframeSelect.value = state.timeframe || "Evening: 5 PM - 9 PM";
  playbookPlaces = state.playbookPlaceIds
    .map((placeId) => allPlaces.find((place) => place.id === placeId))
    .filter(Boolean);
  sharedUsernames = [...state.sharedUsernames];
  savePlaybookPlaces();
  renderPlaybook();
  renderPlaybookMap();
  renderShareResults();
  renderSharedUsers();
  syncOutingTitleStyle();
  isApplyingHistory = false;
}

function undoOutingChange() {
  if (!undoStack.length) return;

  const currentState = captureOutingState();
  const previousState = undoStack.pop();
  redoStack.push(currentState);
  applyOutingState(previousState);
}

function redoOutingChange() {
  if (!redoStack.length) return;

  const currentState = captureOutingState();
  const nextState = redoStack.pop();
  undoStack.push(currentState);
  applyOutingState(nextState);
}

function syncOutingTitleStyle() {
  const hasCustomTitle = outingTitleInput.value.trim() && outingTitleInput.value.trim() !== "Untitled Outing";
  outingTitleInput.classList.toggle("has-custom-title", hasCustomTitle);
}

function restoreUntitledOuting() {
  if (outingTitleInput.value.trim()) return;

  outingTitleInput.value = "Untitled Outing";
  syncOutingTitleStyle();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatOutingDate(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function currentFormattedDate() {
  return outingDateInput.value ? formatOutingDate(outingDateInput.value) : "May 29, 2026";
}

function loadPlaybookPlaces() {
  try {
    const savedIds = JSON.parse(localStorage.getItem(playbookStorageKey) || "null");
    if (!Array.isArray(savedIds)) return [allPlaces[2], allPlaces[5]];

    return savedIds
      .map((placeId) => allPlaces.find((place) => place.id === placeId))
      .filter(Boolean);
  } catch (error) {
    return [allPlaces[2], allPlaces[5]];
  }
}

function savePlaybookPlaces() {
  try {
    localStorage.setItem(playbookStorageKey, JSON.stringify(playbookPlaces.map((place) => place.id)));
  } catch (error) {
    // Some browser modes can block localStorage.
  }
}

function updatePlaybookPlaces(nextPlaces, shouldRecordHistory = true) {
  if (shouldRecordHistory) pushUndoState();
  playbookPlaces = nextPlaces;
  savePlaybookPlaces();
  renderPlaybook();
  renderPlaybookMap();
}

function currentOutingSnapshot() {
  return {
    id: `outing-${Date.now()}`,
    title: outingTitleInput.value.trim() || "Untitled Outing",
    date: outingDateInput.value,
    timeframe: timeframeSelect.value,
    playbookPlaceIds: playbookPlaces.map((place) => place.id),
    sharedWith: sharedUsernames,
    savedAt: new Date().toISOString()
  };
}

function saveCurrentOuting() {
  try {
    const savedOutings = JSON.parse(localStorage.getItem(savedOutingsStorageKey) || "[]");
    savedOutings.push(currentOutingSnapshot());
    localStorage.setItem(savedOutingsStorageKey, JSON.stringify(savedOutings));
  } catch (error) {
    // Saving is best-effort while the app is front-end only.
  }
}

function startNewOuting() {
  pushUndoState();
  saveCurrentOuting();
  outingTitleInput.value = "Untitled Outing";
  outingDateInput.value = new Date().toISOString().slice(0, 10);
  timeframeSelect.value = "Evening: 5 PM - 9 PM";
  playbookPlaces = [];
  sharedUsernames = [];
  savePlaybookPlaces();
  syncOutingTitleStyle();
  renderPlaybook();
  renderPlaybookMap();
  renderSharedUsers();
}

function renameOuting() {
  outingTitleInput.focus();
  outingTitleInput.select();
}

function downloadOutingPdf() {
  saveCurrentOuting();
  window.print();
}

function emailOuting() {
  const subject = encodeURIComponent(outingTitleInput.value.trim() || "Untitled Outing");
  const placeList = playbookPlaces.map((place) => `- ${place.name} (${place.neighborhood})`).join("\n");
  const body = encodeURIComponent([
    `${outingTitleInput.value.trim() || "Untitled Outing"}`,
    `Date: ${currentFormattedDate()}`,
    `TimeFrame: ${timeframeSelect.value}`,
    "",
    "Places:",
    placeList || "No places added yet.",
    "",
    window.location.href
  ].join("\n"));

  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function deleteCurrentOuting() {
  pushUndoState();
  outingTitleInput.value = "Untitled Outing";
  outingDateInput.value = new Date().toISOString().slice(0, 10);
  timeframeSelect.value = "Evening: 5 PM - 9 PM";
  sharedUsernames = [];
  updatePlaybookPlaces([], false);
  renderSharedUsers();
  syncOutingTitleStyle();
}

function openShareDialog() {
  shareDialog.classList.add("open");
  shareDialog.setAttribute("aria-hidden", "false");
  shareUsernameInput.value = "";
  renderShareResults();
  renderSharedUsers();
  window.setTimeout(() => shareUsernameInput.focus(), 0);
}

function closeShareDialog() {
  shareDialog.classList.remove("open");
  shareDialog.setAttribute("aria-hidden", "true");
}

function addSharedUser(username) {
  if (!username || sharedUsernames.includes(username)) return;
  pushUndoState();
  sharedUsernames = [...sharedUsernames, username];
  shareUsernameInput.value = "";
  saveCurrentOuting();
  renderShareResults();
  renderSharedUsers();
}

function removeSharedUser(username) {
  pushUndoState();
  sharedUsernames = sharedUsernames.filter((item) => item !== username);
  saveCurrentOuting();
  renderSharedUsers();
  renderShareResults();
}

function renderShareResults() {
  const query = shareUsernameInput.value.trim().toLowerCase();
  if (!query) {
    shareResults.innerHTML = "";
    return;
  }

  const matches = mockUsers.filter((username) => (
    username.includes(query) && !sharedUsernames.includes(username)
  ));

  shareResults.innerHTML = matches.length
    ? matches.map((username) => `
      <div class="share-result">
        <span>${escapeHtml(username)}</span>
        <button type="button" data-share-user="${escapeHtml(username)}">Add</button>
      </div>
    `).join("")
    : `<div class="share-result"><span>No matching users</span></div>`;
}

function renderSharedUsers() {
  sharedUsers.innerHTML = sharedUsernames.length
    ? sharedUsernames.map((username) => `
      <div class="shared-user">
        <span>${escapeHtml(username)}</span>
        <button type="button" data-remove-share-user="${escapeHtml(username)}">Remove</button>
      </div>
    `).join("")
    : `<div class="shared-user"><span>No users shared yet</span></div>`;
}

function playbookCard(place) {
  const date = currentFormattedDate();

  return `
    <article
      class="collection-card"
      data-place-id="${escapeHtml(place.id)}"
      data-lat="${escapeHtml(place.coordinates.lat)}"
      data-lng="${escapeHtml(place.coordinates.lng)}"
    >
      <span class="tag">${escapeHtml(place.category)} | ${escapeHtml(place.price)}</span>
      <h3>${escapeHtml(place.name)}</h3>
      <img src="${escapeHtml(place.image)}" alt="${escapeHtml(place.name)}" />
      <p class="source">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.07 0l2-2a5 5 0 0 0-7.07-7.07l-1.16 1.16"></path>
          <path d="M14 11a5 5 0 0 0-7.07 0l-2 2A5 5 0 0 0 12 20.07l1.16-1.16"></path>
        </svg>
        ${escapeHtml(place.website)}
      </p>
      <p class="time">${escapeHtml(date)} - ${escapeHtml(place.timeWindow)}</p>
      <p class="neighborhood">${escapeHtml(place.neighborhood)}</p>
      <p class="note">${escapeHtml(place.note)}</p>
      <button class="remove-playbook-place" type="button" aria-label="Remove ${escapeHtml(place.name)}">Remove</button>
    </article>
  `;
}

function renderPlaybook() {
  collectionsList.innerHTML = playbookPlaces.length
    ? `${playbookPlaces.map(playbookCard).join("")}
      <button class="add-stop-card" type="button" aria-label="Add collection">
        <span>+</span>
      </button>`
    : `<button class="add-stop-card empty-add-card" type="button" aria-label="Add collection">
        <span>+</span>
      </button>`;
}

function selectPlaybookCard(placeId) {
  document.querySelectorAll(".collection-card[data-place-id]").forEach((card) => {
    card.classList.toggle("is-map-selected", card.dataset.placeId === placeId);
  });
}

async function loadGoogleMaps() {
  if (window.google?.maps) return window.google.maps;
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = fetch(`${API_BASE_URL}/api/config/maps`)
    .then((response) => response.json())
    .then(({ googleMapsApiKey }) => {
      if (!googleMapsApiKey) throw new Error("Missing Google Maps API key");

      return new Promise((resolve, reject) => {
        window.initOutingCreationMap = () => resolve(window.google.maps);

        const existingScript = document.querySelector("script[data-google-maps-script]");
        if (existingScript) {
          existingScript.addEventListener("load", () => resolve(window.google.maps), { once: true });
          existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load")), { once: true });
          return;
        }

        const script = document.createElement("script");
        script.dataset.googleMapsScript = "true";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsApiKey)}&callback=initOutingCreationMap`;
        script.async = true;
        script.defer = true;
        script.onerror = () => reject(new Error("Google Maps failed to load"));
        document.head.appendChild(script);
      });
    });

  return googleMapsPromise;
}

async function ensureOutingMap() {
  const maps = await loadGoogleMaps();

  if (!outingMap) {
    outingMap = new maps.Map(outingMapPreview, {
      center: { lat: 41.8781, lng: -87.6298 },
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });
  }

  return { maps, map: outingMap };
}

async function renderPlaybookMap() {
  try {
    const { maps, map } = await ensureOutingMap();
    const bounds = new maps.LatLngBounds();
    const placesWithCoordinates = playbookPlaces.filter((place) => place.coordinates);

    mapMarkers.forEach((entry) => entry.marker.setMap(null));
    mapMarkers = [];
    if (activeInfoWindow) activeInfoWindow.close();

    mapMarkers = placesWithCoordinates.map((place, index) => {
      const marker = new maps.Marker({
        position: place.coordinates,
        map,
        title: place.name,
        label: {
          text: String(index + 1),
          color: "#ffffff",
          fontSize: "11px",
          fontWeight: "700"
        }
      });

      const infoWindow = new maps.InfoWindow({
        content: `
          <strong>${escapeHtml(place.name)}</strong><br>
          ${escapeHtml(place.category)} | ${escapeHtml(place.price)}<br>
          ${escapeHtml(place.timeWindow || "")}
        `
      });

      marker.addListener("click", () => {
        selectPlaybookCard(place.id);
        if (activeInfoWindow) activeInfoWindow.close();
        infoWindow.open({ anchor: marker, map });
        activeInfoWindow = infoWindow;
      });

      bounds.extend(place.coordinates);
      return { placeId: place.id, marker, infoWindow };
    });

    if (placesWithCoordinates.length > 1) {
      map.fitBounds(bounds, 42);
    } else if (placesWithCoordinates.length === 1) {
      map.setCenter(placesWithCoordinates[0].coordinates);
      map.setZoom(14);
    } else {
      map.setCenter({ lat: 41.8781, lng: -87.6298 });
      map.setZoom(12);
    }

    if (playbookPlaces[0]) selectPlaybookCard(playbookPlaces[0].id);
  } catch (error) {
    console.error(error);
    renderMapFallback();
    if (playbookPlaces[0]) selectPlaybookCard(playbookPlaces[0].id);
  }
}

function renderMapFallback(selectedPlace = playbookPlaces[0]) {
  const pins = playbookPlaces.filter((place) => place.coordinates).map((place, index) => {
    const position = mapPinPosition(place.coordinates);
    const selectedClass = selectedPlace?.id === place.id ? "is-selected" : "";

    return `
      <button
        class="map-overlay-pin ${selectedClass}"
        type="button"
        style="left: ${position.x}%; top: ${position.y}%;"
        data-place-id="${escapeHtml(place.id)}"
        title="${escapeHtml(place.name)}"
        aria-label="${escapeHtml(place.name)} map marker"
      >
        <span>${index + 1}</span>
      </button>
    `;
  }).join("");

  outingMapPreview.innerHTML = `
    <iframe
      class="map-fallback-frame"
      title="Chicago outing map"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps?q=Chicago&output=embed"
    ></iframe>
    <div class="map-overlay-pins" aria-label="Map markers">${pins}</div>
  `;
}

function mapPinPosition(coordinates) {
  const x = ((coordinates.lng - chicagoMapBounds.west) / (chicagoMapBounds.east - chicagoMapBounds.west)) * 100;
  const y = ((chicagoMapBounds.north - coordinates.lat) / (chicagoMapBounds.north - chicagoMapBounds.south)) * 100;

  return {
    x: Math.min(94, Math.max(6, x)),
    y: Math.min(94, Math.max(8, y))
  };
}

function openPlaceMarker(placeId) {
  const place = playbookPlaces.find((item) => item.id === placeId);

  selectPlaybookCard(placeId);
  const mapEntry = mapMarkers.find((entry) => entry.placeId === placeId);
  if (mapEntry && outingMap) {
    if (activeInfoWindow) activeInfoWindow.close();
    outingMap.setCenter(mapEntry.marker.getPosition());
    outingMap.setZoom(Math.max(outingMap.getZoom() || 12, 14));
    mapEntry.infoWindow.open({ anchor: mapEntry.marker, map: outingMap });
    activeInfoWindow = mapEntry.infoWindow;
    return;
  }

  if (place) renderMapFallback(place);
}

function removePlaybookPlace(placeId) {
  const place = playbookPlaces.find((item) => item.id === placeId);
  if (!place) return;

  updatePlaybookPlaces(playbookPlaces.filter((item) => item.id !== placeId));
}

function addNextPlace() {
  const nextPlace = allPlaces.find((place) => !playbookPlaces.some((item) => item.id === place.id));
  if (!nextPlace) return;

  updatePlaybookPlaces([...playbookPlaces, nextPlace]);
}

function closePlaybookMenu() {
  playbookOptionsMenu.classList.remove("open");
}

function closeFileMenu() {
  fileMenu.classList.remove("open");
}

function closeEditMenu() {
  editMenu.classList.remove("open");
}

function handleFileAction(action) {
  if (action === "new") startNewOuting();
  if (action === "download") downloadOutingPdf();
  if (action === "share") openShareDialog();
  if (action === "email") emailOuting();
  if (action === "rename") renameOuting();
  if (action === "delete") deleteCurrentOuting();

  closeFileMenu();
}

function handleEditAction(action) {
  if (action === "undo") undoOutingChange();
  if (action === "redo") redoOutingChange();

  closeEditMenu();
}

outingDateInput.addEventListener("change", () => {
  if (dateEditSnapshot) {
    pushUndoState(dateEditSnapshot);
    dateEditSnapshot = null;
  }

  renderPlaybook();
  renderPlaybookMap();
});

outingDateInput.addEventListener("focus", () => {
  dateEditSnapshot = captureOutingState();
});

timeframeSelect.addEventListener("focus", () => {
  timeframeEditSnapshot = captureOutingState();
});

timeframeSelect.addEventListener("change", () => {
  if (timeframeEditSnapshot) {
    pushUndoState(timeframeEditSnapshot);
    timeframeEditSnapshot = null;
  }
});

fileMenuBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  closePlaybookMenu();
  closeEditMenu();
  fileMenu.classList.toggle("open");
});

fileMenu.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-file-action]");
  if (!button) return;

  handleFileAction(button.dataset.fileAction);
});

headerShareBtn.addEventListener("click", openShareDialog);

editMenuBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  closeFileMenu();
  closePlaybookMenu();
  editMenu.classList.toggle("open");
});

editMenu.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-edit-action]");
  if (!button) return;

  handleEditAction(button.dataset.editAction);
});

playbookOptionsBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  closeFileMenu();
  closeEditMenu();
  playbookOptionsMenu.classList.toggle("open");
});

playbookOptionsMenu.addEventListener("click", (event) => {
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

  closePlaybookMenu();
});

collectionsList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-playbook-place");
  if (removeButton) {
    const card = removeButton.closest(".collection-card[data-place-id]");
    removePlaybookPlace(card.dataset.placeId);
    return;
  }

  const addButton = event.target.closest(".add-stop-card");
  if (addButton) {
    addNextPlace();
    return;
  }

  const card = event.target.closest(".collection-card[data-place-id]");
  if (!card) return;

  openPlaceMarker(card.dataset.placeId);
});

outingMapPreview.addEventListener("click", (event) => {
  const pin = event.target.closest(".map-overlay-pin[data-place-id]");
  if (!pin) return;

  openPlaceMarker(pin.dataset.placeId);
});

closeShareDialogBtn.addEventListener("click", closeShareDialog);

shareDialog.addEventListener("click", (event) => {
  if (event.target === shareDialog) closeShareDialog();
});

shareUsernameInput.addEventListener("input", renderShareResults);

shareUsernameInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addSharedUser(shareUsernameInput.value.trim().toLowerCase());
});

addShareUserBtn.addEventListener("click", () => {
  addSharedUser(shareUsernameInput.value.trim().toLowerCase());
});

shareResults.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-share-user]");
  if (!button) return;

  addSharedUser(button.dataset.shareUser);
});

sharedUsers.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-remove-share-user]");
  if (!button) return;

  removeSharedUser(button.dataset.removeShareUser);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeFileMenu();
    closeEditMenu();
    closePlaybookMenu();
    closeShareDialog();
  }
});

document.addEventListener("click", () => {
  closePlaybookMenu();
  closeFileMenu();
  closeEditMenu();
});

outingTitleInput.addEventListener("focus", () => {
  titleEditSnapshot = captureOutingState();
});

outingTitleInput.addEventListener("input", () => {
  syncOutingTitleStyle();
});

outingTitleInput.addEventListener("blur", restoreUntitledOuting);

outingTitleInput.addEventListener("change", () => {
  if (!titleEditSnapshot) return;
  if (!statesMatch(titleEditSnapshot, captureOutingState())) {
    pushUndoState(titleEditSnapshot);
  }
  titleEditSnapshot = null;
});

window.addEventListener("storage", (event) => {
  if (event.key !== playbookStorageKey) return;
  playbookPlaces = loadPlaybookPlaces();
  renderPlaybook();
  renderPlaybookMap();
});

window.addEventListener("pageshow", () => {
  playbookPlaces = loadPlaybookPlaces();
  renderPlaybook();
  renderPlaybookMap();
});

renderPlaybook();
renderPlaybookMap();
syncOutingTitleStyle();
