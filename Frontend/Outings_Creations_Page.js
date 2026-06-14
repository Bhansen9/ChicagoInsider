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
const shareRoleSelect = document.querySelector("#shareRoleSelect");
const addShareUserBtn = document.querySelector("#addShareUserBtn");
const shareResults = document.querySelector("#shareResults");
const sharedUsers = document.querySelector("#sharedUsers");
const contributorsCard = document.querySelector("#contributorsCard");
const addContributorPanelBtn = document.querySelector("#addContributorPanelBtn");
const budgetCard = document.querySelector("#budgetCard");
const canvasDropZone = document.querySelector("#canvasDropZone");
const skeletons = window.ChicagoInsiderSkeletons;
const playbookStorageKey = "chicagoInsider.playbookPlaces";
const savedOutingsStorageKey = "chicagoInsider.savedOutings";
const workspaceStorageKey = "chicagoInsider.workspacePlaces";
const contributorsStorageKey = "chicagoInsider.contributors";

const isBackendOrigin =
  ["localhost:3000", "127.0.0.1:3000"].includes(window.location.host);
const API_BASE_URL = window.location.protocol === "file:" || !isBackendOrigin
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
let workspacePlaces = loadWorkspacePlaces();
let outingMap;
let googleMapsPromise;
let mapMarkers = [];
let activeInfoWindow;
let mapCloseClickListener;
let contributors = loadContributors();
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
    workspacePlaceIds: workspacePlaces.map((place) => place.id),
    contributors: contributors.map((contributor) => ({ ...contributor }))
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
  workspacePlaces = (state.workspacePlaceIds || [])
    .map((placeId) => allPlaces.find((place) => place.id === placeId))
    .filter(Boolean);
  contributors = normalizeContributors(state.contributors);
  savePlaybookPlaces();
  saveWorkspacePlaces();
  saveContributors();
  renderPlaybook();
  renderWorkspace();
  renderPlaybookMap();
  renderShareResults();
  renderSharedUsers();
  renderContributors();
  renderBudgetEstimate();
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

function titleCase(value) {
  return String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

function loadWorkspacePlaces() {
  try {
    const savedIds = JSON.parse(localStorage.getItem(workspaceStorageKey) || "null");
    if (!Array.isArray(savedIds)) return [];

    return savedIds
      .map((placeId) => allPlaces.find((place) => place.id === placeId))
      .filter(Boolean);
  } catch (error) {
    return [];
  }
}

function normalizeContributors(value) {
  const fallback = [
    { username: "ben", role: "owner" },
    { username: "trevor", role: "viewer" }
  ];

  if (!Array.isArray(value)) return fallback;

  const roleSet = new Set(["owner", "editor", "viewer"]);
  const contributorsByName = new Map();
  value.forEach((item) => {
    const username = String(item?.username || item || "").trim().toLowerCase();
    if (!username) return;
    const role = roleSet.has(item?.role) ? item.role : "viewer";
    contributorsByName.set(username, { username, role });
  });

  return contributorsByName.size ? [...contributorsByName.values()] : fallback;
}

function loadContributors() {
  try {
    return normalizeContributors(JSON.parse(localStorage.getItem(contributorsStorageKey) || "null"));
  } catch (error) {
    return normalizeContributors();
  }
}

function savePlaybookPlaces() {
  try {
    localStorage.setItem(playbookStorageKey, JSON.stringify(playbookPlaces.map((place) => place.id)));
  } catch (error) {
    // Some browser modes can block localStorage.
  }
}

function saveWorkspacePlaces() {
  try {
    localStorage.setItem(workspaceStorageKey, JSON.stringify(workspacePlaces.map((place) => place.id)));
  } catch (error) {
    // Some browser modes can block localStorage.
  }
}

function saveContributors() {
  try {
    localStorage.setItem(contributorsStorageKey, JSON.stringify(contributors));
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
  renderBudgetEstimate();
}

function currentOutingSnapshot() {
  return {
    id: `outing-${Date.now()}`,
    title: outingTitleInput.value.trim() || "Untitled Outing",
    date: outingDateInput.value,
    timeframe: timeframeSelect.value,
    playbookPlaceIds: playbookPlaces.map((place) => place.id),
    workspacePlaceIds: workspacePlaces.map((place) => place.id),
    contributors,
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
  workspacePlaces = [];
  contributors = normalizeContributors();
  savePlaybookPlaces();
  saveWorkspacePlaces();
  saveContributors();
  syncOutingTitleStyle();
  renderPlaybook();
  renderWorkspace();
  renderPlaybookMap();
  renderContributors();
  renderBudgetEstimate();
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
  contributors = normalizeContributors();
  workspacePlaces = [];
  saveContributors();
  saveWorkspacePlaces();
  updatePlaybookPlaces([], false);
  renderWorkspace();
  renderSharedUsers();
  renderContributors();
  renderBudgetEstimate();
  syncOutingTitleStyle();
}

function openShareDialog() {
  shareDialog.classList.add("open");
  shareDialog.setAttribute("aria-hidden", "false");
  shareUsernameInput.value = "";
  shareRoleSelect.value = "editor";
  renderShareResults();
  renderSharedUsers();
  window.setTimeout(() => shareUsernameInput.focus(), 0);
}

function closeShareDialog() {
  shareDialog.classList.remove("open");
  shareDialog.setAttribute("aria-hidden", "true");
}

function addSharedUser(username) {
  const cleanedUsername = String(username || "").trim().toLowerCase();
  if (!cleanedUsername) return;
  const shareRole = shareRoleSelect.value === "editor" ? "editor" : "viewer";

  pushUndoState();
  const existingContributor = contributors.find((item) => item.username === cleanedUsername);
  if (existingContributor) {
    if (existingContributor.role !== "owner") existingContributor.role = shareRole;
  } else {
    contributors = [...contributors, { username: cleanedUsername, role: shareRole }];
  }

  shareUsernameInput.value = "";
  saveContributors();
  saveCurrentOuting();
  renderShareResults();
  renderSharedUsers();
  renderContributors();
}

function removeSharedUser(username) {
  const cleanedUsername = String(username || "").trim().toLowerCase();
  if (cleanedUsername === "ben") return;

  pushUndoState();
  contributors = contributors.filter((item) => item.username !== cleanedUsername);
  saveContributors();
  saveCurrentOuting();
  renderSharedUsers();
  renderShareResults();
  renderContributors();
}

function updateContributorRole(username, role) {
  const contributor = contributors.find((item) => item.username === username);
  if (!contributor || contributor.role === "owner") {
    renderContributors();
    renderSharedUsers();
    return;
  }

  pushUndoState();
  contributors = contributors.map((contributor) => (
    contributor.username === username ? { ...contributor, role } : contributor
  ));
  saveContributors();
  saveCurrentOuting();
  renderContributors();
  renderSharedUsers();
}

function renderShareResults() {
  const query = shareUsernameInput.value.trim().toLowerCase();
  if (!query) {
    shareResults.innerHTML = "";
    return;
  }

  const matches = mockUsers.filter((username) => (
    username.includes(query) && !contributors.some((contributor) => contributor.username === username)
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
  sharedUsers.innerHTML = contributors.length
    ? contributors.map(({ username, role }) => `
      <div class="shared-user">
        <span>${escapeHtml(username)} - ${escapeHtml(roleLabel(role))}</span>
        <button type="button" data-remove-share-user="${escapeHtml(username)}" ${username === "ben" ? "disabled" : ""}>Remove</button>
      </div>
    `).join("")
    : `<div class="shared-user"><span>No users shared yet</span></div>`;
}

function roleLabel(role) {
  return {
    owner: "Owner",
    editor: "Can edit",
    viewer: "Can view"
  }[role] || "Can view";
}

function roleIcon(role) {
  if (role === "owner" || role === "editor") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`;
  }

  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
}

function renderContributors() {
  const addButton = `
    <button class="add-contributor-button" id="addContributorPanelBtn" type="button">
      Add New Contributors
      <span aria-hidden="true">+</span>
    </button>
  `;

  contributorsCard.innerHTML = contributors.map(({ username, role }) => `
    <div class="contributor-row">
      <span class="contributor-name">${escapeHtml(titleCase(username))}</span>
      <span class="contributor-role-icon">${roleIcon(role)}</span>
      <select data-contributor-role="${escapeHtml(username)}" aria-label="${escapeHtml(username)} privilege" ${role === "owner" ? "disabled" : ""}>
        <option value="owner" ${role === "owner" ? "selected" : ""}>Owner</option>
        <option value="editor" ${role === "editor" ? "selected" : ""}>Can edit</option>
        <option value="viewer" ${role === "viewer" ? "selected" : ""}>Can view</option>
      </select>
      <button class="remove-contributor-button" type="button" data-remove-contributor="${escapeHtml(username)}" aria-label="Remove ${escapeHtml(username)}" ${username === "ben" ? "disabled" : ""}>x</button>
    </div>
  `).join("") + addButton;
  skeletons?.markLoaded(contributorsCard);
}

function playbookCard(place) {
  const date = currentFormattedDate();

  return `
    <article
      class="collection-card"
      data-place-id="${escapeHtml(place.id)}"
      data-lat="${escapeHtml(place.coordinates.lat)}"
      data-lng="${escapeHtml(place.coordinates.lng)}"
      draggable="true"
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
  skeletons?.markLoaded(collectionsList);
}

function workspaceCard(place, index) {
  return `
    <article class="workspace-place-card" data-workspace-place-id="${escapeHtml(place.id)}">
      <div class="workspace-place-order">${index + 1}</div>
      <div>
        <h3>${escapeHtml(place.name)}</h3>
        <p>${escapeHtml(place.neighborhood)} | ${escapeHtml(place.timeWindow)}</p>
      </div>
      <span>${escapeHtml(place.price)}</span>
      <button type="button" data-remove-workspace-place="${escapeHtml(place.id)}" aria-label="Remove ${escapeHtml(place.name)}">x</button>
    </article>
  `;
}

function renderWorkspace() {
  if (!workspacePlaces.length) {
    canvasDropZone.innerHTML = `
      <div class="workspace-empty-state">
        <strong>Drop places here</strong>
        <span>Drag cards from Collections Playbook into this workspace.</span>
      </div>
    `;
    skeletons?.markLoaded(canvasDropZone);
    return;
  }

  canvasDropZone.innerHTML = `
    <div class="workspace-list">
      ${workspacePlaces.map(workspaceCard).join("")}
    </div>
  `;
  skeletons?.markLoaded(canvasDropZone);
}

function addPlaceToWorkspace(placeId, shouldRecordHistory = true) {
  const place = allPlaces.find((item) => item.id === placeId);
  if (!place || workspacePlaces.some((item) => item.id === placeId)) return;

  if (shouldRecordHistory) pushUndoState();
  workspacePlaces = [...workspacePlaces, place];
  saveWorkspacePlaces();
  renderWorkspace();
  renderBudgetEstimate();
  saveCurrentOuting();
}

function removePlaceFromWorkspace(placeId) {
  if (!workspacePlaces.some((place) => place.id === placeId)) return;

  pushUndoState();
  workspacePlaces = workspacePlaces.filter((place) => place.id !== placeId);
  saveWorkspacePlaces();
  renderWorkspace();
  renderBudgetEstimate();
  saveCurrentOuting();
}

function priceRangeForPlace(place) {
  const ranges = {
    Free: [0, 0],
    "$": [10, 25],
    "$$": [25, 60],
    "$$$": [60, 120]
  };

  return ranges[place.price] || [20, 50];
}

function renderBudgetEstimate() {
  const budgetPlaces = workspacePlaces;
  const [lowTotal, highTotal] = budgetPlaces.reduce((totals, place) => {
    const [low, high] = priceRangeForPlace(place);
    return [totals[0] + low, totals[1] + high];
  }, [0, 0]);

  if (!budgetPlaces.length) {
    budgetCard.innerHTML = `
      <div class="budget-empty-state">
        Add places to the workspace to estimate your outing cost.
      </div>
    `;
    skeletons?.markLoaded(budgetCard);
    return;
  }

  budgetCard.innerHTML = `
    <div class="budget-total">
      <span>Estimated total</span>
      <strong>$${lowTotal} - $${highTotal}</strong>
    </div>
    <div class="budget-breakdown">
      ${budgetPlaces.map((place) => {
        const [low, high] = priceRangeForPlace(place);
        return `
          <div class="budget-line">
            <span>${escapeHtml(place.name)}</span>
            <strong>${low === high ? "$0" : `$${low} - $${high}`}</strong>
          </div>
        `;
      }).join("")}
    </div>
  `;
  skeletons?.markLoaded(budgetCard);
}

function selectPlaybookCard(placeId) {
  document.querySelectorAll(".collection-card[data-place-id]").forEach((card) => {
    card.classList.toggle("is-map-selected", card.dataset.placeId === placeId);
  });
}

async function loadGoogleMaps() {
  if (window.google?.maps) return window.google.maps;
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = fetch(`${API_BASE_URL}/api/config/maps?surface=creations`)
    .then((response) => {
      if (!response.ok) throw new Error("Could not load Google Maps config");
      return response.json();
    })
    .then(({ googleMapsApiKey }) => {
      if (!googleMapsApiKey) throw new Error("Missing Google Maps API key");

      return new Promise((resolve, reject) => {
        const callbackName = "initOutingCreationMap";
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

        const existingScript = document.querySelector("script[data-google-maps-script]");
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

async function ensureOutingMap() {
  const maps = await loadGoogleMaps();

  if (!outingMap) {
    skeletons?.markLoaded(outingMapPreview);
    outingMapPreview.innerHTML = "";
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

    mapMarkers = placesWithCoordinates.map((place) => {
      const marker = new maps.Marker({
        position: place.coordinates,
        map,
        title: place.name
      });

      const infoWindow = new maps.InfoWindow({
        content: mapInfoContent(place)
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

    if (!mapCloseClickListener) {
      mapCloseClickListener = map.addListener("click", () => {
        if (activeInfoWindow) activeInfoWindow.close();
        activeInfoWindow = null;
        selectPlaybookCard("");
      });
    }

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

function mapInfoContent(place) {
  return `
    <div class="map-info-card">
      <img class="map-info-image" src="${escapeHtml(place.image)}" alt="${escapeHtml(place.name)}" />
      <div class="map-info-body">
        <strong>${escapeHtml(place.name)}</strong>
        <div class="map-info-tags">
          <span>${escapeHtml(place.category)}</span>
          <span>${escapeHtml(place.price)}</span>
        </div>
        <p>${escapeHtml(place.timeWindow || "")}</p>
      </div>
    </div>
  `;
}

function renderMapFallback(selectedPlace = null) {
  const pins = playbookPlaces.filter((place) => place.coordinates).map((place) => {
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
      ></button>
    `;
  }).join("");

  const selectedInfo = selectedPlace ? `
    <article class="map-fallback-info">
      <button class="map-fallback-close" type="button" aria-label="Close ${escapeHtml(selectedPlace.name)} details">x</button>
      <img class="map-info-image" src="${escapeHtml(selectedPlace.image)}" alt="${escapeHtml(selectedPlace.name)}" />
      <div class="map-info-body">
        <strong>${escapeHtml(selectedPlace.name)}</strong>
        <div class="map-info-tags">
          <span>${escapeHtml(selectedPlace.category)}</span>
          <span>${escapeHtml(selectedPlace.price)}</span>
        </div>
        <p>${escapeHtml(selectedPlace.timeWindow || "")}</p>
      </div>
    </article>
  ` : "";

  outingMapPreview.innerHTML = `
    <iframe
      class="map-fallback-frame"
      title="Chicago outing map"
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      src="https://www.google.com/maps?q=Chicago&output=embed"
    ></iframe>
    <div class="map-overlay-pins" aria-label="Map markers">${pins}</div>
    ${selectedInfo}
  `;
  skeletons?.markLoaded(outingMapPreview);
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

collectionsList.addEventListener("dragstart", (event) => {
  const card = event.target.closest(".collection-card[data-place-id]");
  if (!card) return;

  event.dataTransfer.setData("text/plain", card.dataset.placeId);
  event.dataTransfer.effectAllowed = "copy";
  card.classList.add("is-dragging");
});

collectionsList.addEventListener("dragend", (event) => {
  const card = event.target.closest(".collection-card[data-place-id]");
  if (card) card.classList.remove("is-dragging");
});

canvasDropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  canvasDropZone.classList.add("is-drag-over");
});

canvasDropZone.addEventListener("dragleave", (event) => {
  if (!canvasDropZone.contains(event.relatedTarget)) {
    canvasDropZone.classList.remove("is-drag-over");
  }
});

canvasDropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  canvasDropZone.classList.remove("is-drag-over");
  addPlaceToWorkspace(event.dataTransfer.getData("text/plain"));
});

canvasDropZone.addEventListener("click", (event) => {
  const removeButton = event.target.closest("button[data-remove-workspace-place]");
  if (!removeButton) return;

  removePlaceFromWorkspace(removeButton.dataset.removeWorkspacePlace);
});

outingMapPreview.addEventListener("click", (event) => {
  if (event.target.closest(".map-fallback-close")) {
    renderMapFallback(null);
    selectPlaybookCard("");
    return;
  }

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

contributorsCard.addEventListener("click", (event) => {
  if (event.target.closest("#addContributorPanelBtn")) {
    openShareDialog();
    return;
  }

  const removeButton = event.target.closest("button[data-remove-contributor]");
  if (removeButton) removeSharedUser(removeButton.dataset.removeContributor);
});

contributorsCard.addEventListener("change", (event) => {
  const roleSelect = event.target.closest("select[data-contributor-role]");
  if (!roleSelect) return;

  updateContributorRole(roleSelect.dataset.contributorRole, roleSelect.value);
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
  if (event.key === playbookStorageKey) {
    playbookPlaces = loadPlaybookPlaces();
    renderPlaybook();
    renderPlaybookMap();
    renderBudgetEstimate();
  }

  if (event.key === workspaceStorageKey) {
    workspacePlaces = loadWorkspacePlaces();
    renderWorkspace();
    renderBudgetEstimate();
  }

  if (event.key === contributorsStorageKey) {
    contributors = loadContributors();
    renderContributors();
    renderSharedUsers();
  }
});

window.addEventListener("pageshow", () => {
  playbookPlaces = loadPlaybookPlaces();
  workspacePlaces = loadWorkspacePlaces();
  contributors = loadContributors();
  renderPlaybook();
  renderWorkspace();
  renderPlaybookMap();
  renderContributors();
  renderSharedUsers();
  renderBudgetEstimate();
});

function initializeCreationPage() {
  if (!skeletons) {
    renderPlaybook();
    renderWorkspace();
    renderPlaybookMap();
    renderContributors();
    renderSharedUsers();
    renderBudgetEstimate();
    syncOutingTitleStyle();
    return;
  }

  skeletons.showCreationPlaybook(collectionsList, 3);
  skeletons.showWorkspace(canvasDropZone);
  skeletons.showMap(outingMapPreview);
  skeletons.showContributors(contributorsCard, 3);
  skeletons.showBudget(budgetCard);
  window.requestAnimationFrame(() => {
    renderPlaybook();
    renderWorkspace();
    renderPlaybookMap();
    renderContributors();
    renderSharedUsers();
    renderBudgetEstimate();
    syncOutingTitleStyle();
  });
}

initializeCreationPage();
