const savedCount = document.querySelector("#savedCount");
const outingCount = document.querySelector("#outingCount");
const workspaceCount = document.querySelector("#workspaceCount");
const savedPlacesList = document.querySelector("#savedPlacesList");
const activityList = document.querySelector("#activityList");
const neighborhoodPreference = document.querySelector("#neighborhoodPreference");
const vibePreference = document.querySelector("#vibePreference");
const budgetPreference = document.querySelector("#budgetPreference");

const playbookStorageKey = "chicagoInsider.playbookPlaces";
const savedOutingsStorageKey = "chicagoInsider.savedOutings";
const workspaceStorageKey = "chicagoInsider.workspacePlaces";
const profilePreferenceStorageKey = "chicagoInsider.profilePreferences";

const places = [
  {
    id: "millennium",
    name: "Millennium Park",
    category: "Landmark",
    price: "Free",
    neighborhood: "Downtown",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Millennium%20park%2Cchicago.JPG?width=500"
  },
  {
    id: "riverwalk",
    name: "Chicago Riverwalk",
    category: "Activity",
    price: "Free",
    neighborhood: "River North",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Riverwalk%20%2851556708640%29.jpg?width=500"
  },
  {
    id: "art-institute",
    name: "The Art Institute of Chicago",
    category: "Museum",
    price: "$$",
    neighborhood: "Downtown",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Art%20Institute%20of%20Chicago%20Lion%20%288519756704%29.jpg?width=500"
  },
  {
    id: "au-cheval",
    name: "Au Cheval",
    category: "Food",
    price: "$$$",
    neighborhood: "West Loop",
    image: "https://images.squarespace-cdn.com/content/v1/67223ccb89a1690d7a80caa4/1732119030238-4C3W8KF5GEIN0ZR2Z5XA/auc1-29.jpg"
  },
  {
    id: "small-cheval",
    name: "Small Cheval",
    category: "Food",
    price: "$$",
    neighborhood: "Wicker Park",
    image: "https://images.squarespace-cdn.com/content/v1/664b756924d01f2bafa19992/bfae2152-f1c0-4280-80f5-11ea7e0860db/new-shots-outdoor-2.jpeg"
  },
  {
    id: "londonhouse",
    name: "LondonHouse Rooftop",
    category: "Bar",
    price: "$$$",
    neighborhood: "River North",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/London%20House%20Rooftop%2C%20Chicago.jpg?width=500"
  },
  {
    id: "lincoln-park-zoo",
    name: "Lincoln Park Zoo",
    category: "Activity",
    price: "Free",
    neighborhood: "Lincoln Park",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lincoln%20Park%20Zoo%2C%20Chicago%2C%20United%20States%20%28Unsplash%20LfGqCrLmhp0%29.jpg?width=500"
  },
  {
    id: "violet-hour",
    name: "The Violet Hour",
    category: "Bar",
    price: "$$$",
    neighborhood: "Wicker Park",
    image: "https://images.squarespace-cdn.com/content/v1/5689f7a2c21b8690d5c16c46/1626115529676-3NAZ1D98F1VN338QGJW4/tvh7.jpeg"
  },
  {
    id: "lou-malnatis",
    name: "Lou Malnati's",
    category: "Food",
    price: "$$",
    neighborhood: "River North",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lou%20Malnati%27s%20%287705519362%29.jpg?width=500"
  },
  {
    id: "cindy",
    name: "Cindy's Rooftop",
    category: "Bar",
    price: "$$$",
    neighborhood: "Downtown",
    image: "https://cdn.prod.website-files.com/692deee1433d0acae210e525/6930b2963bc306834dd9c99c_Daniel%20Kelleghan%20Photography-2024-03-25%20Cindys57247-HDR.avif"
  }
];

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value ?? fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
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

function placeById(placeId) {
  return places.find((place) => place.id === placeId);
}

function renderSavedPlaces(savedIds) {
  const savedPlaces = savedIds.map(placeById).filter(Boolean);

  savedPlacesList.innerHTML = savedPlaces.length
    ? savedPlaces.map((place) => `
      <article class="saved-item">
        <img src="${escapeHtml(place.image)}" alt="${escapeHtml(place.name)}" />
        <div>
          <h3>${escapeHtml(place.name)}</h3>
          <p>${escapeHtml(place.neighborhood)} | ${escapeHtml(place.category)}</p>
        </div>
        <span>${escapeHtml(place.price)}</span>
      </article>
    `).join("")
    : `<div class="empty-state">No saved places yet.</div>`;
}

function renderActivity(savedOutings) {
  activityList.innerHTML = savedOutings.length
    ? savedOutings.slice(-4).reverse().map((outing) => `
      <article class="activity-item">
        <h3>${escapeHtml(outing.title || "Untitled Outing")}</h3>
        <p>${escapeHtml(outing.date || "No date")} | ${(outing.playbookPlaceIds || []).length} places | ${(outing.contributors || outing.sharedWith || []).length} contributors</p>
      </article>
    `).join("")
    : `<div class="empty-state">No saved outing activity yet.</div>`;
}

function loadPreferences() {
  const preferences = readJson(profilePreferenceStorageKey, {
    neighborhood: "Downtown",
    vibe: "Scenic",
    budget: "Free - $$"
  });

  neighborhoodPreference.value = preferences.neighborhood || "Downtown";
  vibePreference.value = preferences.vibe || "Scenic";
  budgetPreference.value = preferences.budget || "Free - $$";
}

function savePreferences() {
  writeJson(profilePreferenceStorageKey, {
    neighborhood: neighborhoodPreference.value,
    vibe: vibePreference.value,
    budget: budgetPreference.value
  });
}

function renderProfile() {
  const savedIds = readJson(playbookStorageKey, []);
  const savedOutings = readJson(savedOutingsStorageKey, []);
  const workspaceIds = readJson(workspaceStorageKey, []);

  savedCount.textContent = Array.isArray(savedIds) ? savedIds.length : 0;
  outingCount.textContent = Array.isArray(savedOutings) ? savedOutings.length : 0;
  workspaceCount.textContent = Array.isArray(workspaceIds) ? workspaceIds.length : 0;

  renderSavedPlaces(Array.isArray(savedIds) ? savedIds : []);
  renderActivity(Array.isArray(savedOutings) ? savedOutings : []);
  loadPreferences();
}

[neighborhoodPreference, vibePreference, budgetPreference].forEach((select) => {
  select.addEventListener("change", savePreferences);
});

renderProfile();
