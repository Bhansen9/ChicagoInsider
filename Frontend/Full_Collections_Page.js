const collectionSearch = document.querySelector("#collectionSearch");
const collectionGrid = document.querySelector("#collectionGrid");
const collectionFilterBtn = document.querySelector("#collectionFilterBtn");
const collectionFilterMenu = document.querySelector("#collectionFilterMenu");
const collectionSortBtn = document.querySelector("#collectionSortBtn");
const collectionSortMenu = document.querySelector("#collectionSortMenu");
const skeletons = window.ChicagoInsiderSkeletons;
const playbookStorageKey = "chicagoInsider.playbookPlaces";

const places = [
  {
    id: "millennium",
    name: "Millennium Park",
    category: "Landmark",
    type: "free",
    price: "Free",
    neighborhood: "Downtown",
    rating: 4.7,
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Millennium%20park%2Cchicago.JPG?width=900",
    description: "A classic downtown landmark known for Cloud Gate, public art, open space, and skyline views.",
    note: "Touristy, Scenic, Photo Friendly"
  },
  {
    id: "riverwalk",
    name: "Chicago Riverwalk",
    category: "Activity",
    type: "activity",
    price: "Free",
    neighborhood: "River North",
    rating: 4.8,
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Riverwalk%20%2851556708640%29.jpg?width=900",
    description: "A scenic walkway along the Chicago River with restaurants, views, public seating, and boat tour access.",
    note: "Scenic, Walkable, Romantic"
  },
  {
    id: "art-institute",
    name: "The Art Institute of Chicago",
    category: "Museum",
    type: "activity",
    price: "$$",
    neighborhood: "Downtown",
    rating: 4.8,
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Art%20Institute%20of%20Chicago%20Lion%20%288519756704%29.jpg?width=900",
    description: "One of Chicago's best-known museums, great for art, history, architecture, and quiet afternoon plans.",
    note: "Arts, Classic, Quiet"
  },
  {
    id: "au-cheval",
    name: "Au Cheval",
    category: "Food",
    type: "food",
    price: "$$$",
    neighborhood: "West Loop",
    rating: 4.4,
    image: "https://images.squarespace-cdn.com/content/v1/67223ccb89a1690d7a80caa4/1732119030238-4C3W8KF5GEIN0ZR2Z5XA/auc1-29.jpg",
    description: "A popular West Loop restaurant known for its burger, late-night energy, and polished diner feel.",
    note: "Trendy, Busy, Foodie"
  },
  {
    id: "small-cheval",
    name: "Small Cheval",
    category: "Food",
    type: "food",
    price: "$$",
    neighborhood: "Wicker Park",
    rating: 4.3,
    image: "https://images.squarespace-cdn.com/content/v1/664b756924d01f2bafa19992/bfae2152-f1c0-4280-80f5-11ea7e0860db/new-shots-outdoor-2.jpeg",
    description: "A casual burger spot with a simple menu and a relaxed neighborhood feel.",
    note: "Casual, Quick, Tasty"
  },
  {
    id: "londonhouse",
    name: "LondonHouse Rooftop",
    category: "Bar",
    type: "bar",
    price: "$$$",
    neighborhood: "River North",
    rating: 4.2,
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/London%20House%20Rooftop%2C%20Chicago.jpg?width=900",
    description: "An upscale rooftop bar with strong downtown and river views, ideal for scenic evenings.",
    note: "Rooftop, Luxury, Romantic"
  },
  {
    id: "lincoln-park-zoo",
    name: "Lincoln Park Zoo",
    category: "Activity",
    type: "free",
    price: "Free",
    neighborhood: "Lincoln Park",
    rating: 4.6,
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lincoln%20Park%20Zoo%2C%20Chicago%2C%20United%20States%20%28Unsplash%20LfGqCrLmhp0%29.jpg?width=900",
    description: "A free zoo in Lincoln Park, great for walking, animals, lake-adjacent views, and low-cost city exploring.",
    note: "Family Friendly, Outdoors, Casual"
  },
  {
    id: "violet-hour",
    name: "The Violet Hour",
    category: "Bar",
    type: "bar",
    price: "$$$",
    neighborhood: "Wicker Park",
    rating: 4.2,
    image: "https://images.squarespace-cdn.com/content/v1/5689f7a2c21b8690d5c16c46/1626115529676-3NAZ1D98F1VN338QGJW4/tvh7.jpeg",
    description: "A stylish cocktail bar with a darker, intimate atmosphere and a strong date-night rhythm.",
    note: "Speakeasy, Moody, Romantic"
  },
  {
    id: "lou-malnatis",
    name: "Lou Malnati's",
    category: "Food",
    type: "food",
    price: "$$",
    neighborhood: "River North",
    rating: 4.1,
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Lou%20Malnati%27s%20%287705519362%29.jpg?width=900",
    description: "A well-known Chicago deep dish pizza spot that works well for visitors and groups.",
    note: "Classic, Touristy, Casual"
  },
  {
    id: "cindy",
    name: "Cindy's Rooftop",
    category: "Bar",
    type: "bar",
    price: "$$$",
    neighborhood: "Downtown",
    rating: 4.1,
    image: "https://cdn.prod.website-files.com/692deee1433d0acae210e525/6930b2963bc306834dd9c99c_Daniel%20Kelleghan%20Photography-2024-03-25%20Cindys57247-HDR.avif",
    description: "A rooftop restaurant and bar with views over Millennium Park and Lake Michigan.",
    note: "Rooftop, Scenic, Trendy"
  }
];

let activeCollectionFilter = "all";
let activeSort = "featured";
let savedPlaceIds = loadSavedPlaceIds();

function loadSavedPlaceIds() {
  try {
    const savedIds = JSON.parse(localStorage.getItem(playbookStorageKey) || "[]");
    return Array.isArray(savedIds) ? savedIds : [];
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
  return { Free: 0, "$": 1, "$$": 2, "$$$": 3 }[price] ?? 9;
}

function sortedPlaces(nextPlaces) {
  return [...nextPlaces].sort((a, b) => {
    if (activeSort === "name") return a.name.localeCompare(b.name);
    if (activeSort === "neighborhood") return a.neighborhood.localeCompare(b.neighborhood) || a.name.localeCompare(b.name);
    if (activeSort === "budget") return priceRank(a.price) - priceRank(b.price) || a.name.localeCompare(b.name);
    return places.findIndex((place) => place.id === a.id) - places.findIndex((place) => place.id === b.id);
  });
}

function cardForPlace(place) {
  const isSaved = savedPlaceIds.includes(place.id);

  return `
    <article class="place-card">
      <img src="${escapeHtml(place.image)}" alt="${escapeHtml(place.name)}" />
      <div class="place-card-body">
        <div class="place-card-topline">
          <span class="pill">${escapeHtml(place.category)} | ${escapeHtml(place.price)}</span>
          <span class="rating"><span class="stars">*****</span> ${place.rating.toFixed(1)}</span>
        </div>
        <h2>${escapeHtml(place.name)}</h2>
        <p class="neighborhood">${escapeHtml(place.neighborhood)}</p>
        <p class="description">${escapeHtml(place.description)}</p>
        <p class="source-note">From the curated Chicago places list.</p>
        <p class="vibes">${escapeHtml(place.note)}</p>
        <button class="save-spot ${isSaved ? "is-saved" : ""}" type="button" data-place-id="${escapeHtml(place.id)}">
          ${isSaved ? "Saved" : "Save Spot"}
        </button>
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
  const nextPlaces = sortedPlaces(filteredPlaces);

  collectionGrid.innerHTML = nextPlaces.length
    ? nextPlaces.map(cardForPlace).join("")
    : `<div class="empty-state">No collections match that search.</div>`;
  skeletons?.markLoaded(collectionGrid);
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

collectionGrid.addEventListener("click", (event) => {
  const saveButton = event.target.closest("button[data-place-id]");
  if (!saveButton) return;

  const placeId = saveButton.dataset.placeId;
  if (savedPlaceIds.includes(placeId)) {
    savedPlaceIds = savedPlaceIds.filter((id) => id !== placeId);
  } else {
    savedPlaceIds = [...savedPlaceIds, placeId];
  }

  saveSavedPlaceIds();
  renderCollections();
});

document.addEventListener("click", closeMenus);

setActiveMenuButton(collectionFilterMenu, "filter", activeCollectionFilter);
setActiveMenuButton(collectionSortMenu, "sort", activeSort);

function initializeCollectionsPage() {
  if (!skeletons) {
    renderCollections();
    return;
  }

  skeletons.showCollectionCards(collectionGrid, 8);
  window.requestAnimationFrame(renderCollections);
}

initializeCollectionsPage();
