const collectionSearch = document.querySelector("#collectionSearch");
const outingSearch = document.querySelector("#outingSearch");
const collectionGrid = document.querySelector("#collectionGrid");
const outingGrid = document.querySelector("#outingGrid");
const playbookList = document.querySelector("#playbookList");
const playbookFilterBtn = document.querySelector("#playbookFilterBtn");
const playbookFilterMenu = document.querySelector("#playbookFilterMenu");
const addBlankStopBtn = document.querySelector("#addBlankStopBtn");
const createOutingBtn = document.querySelector("#createOutingBtn");
const collectionFilterBtn = document.querySelector("#collectionFilterBtn");
const outingFilterBtn = document.querySelector("#outingFilterBtn");
const collectionFilterMenu = document.querySelector("#collectionFilterMenu");
const outingFilterMenu = document.querySelector("#outingFilterMenu");
const playbookStorageKey = "chicagoInsider.playbookPlaces";

const places = [
  {
    id: "art-institute",
    name: "The Art Institute of Chicago",
    category: "Museum",
    type: "activity",
    price: "$$",
    neighborhood: "Downtown",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Art%20Institute%20of%20Chicago%20Lion%20%288519756704%29.jpg?width=500",
    description: "One of Chicago's most well-known museums, great for art, history, and culture.",
    note: "Arts, Classic, Quiet"
  },
  {
    id: "riverwalk",
    name: "Chicago Riverwalk",
    category: "Activity",
    type: "activity",
    price: "Free",
    neighborhood: "River North",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Chicago%20Riverwalk%20%2851556708640%29.jpg?width=500",
    description: "A scenic walkway along the Chicago River with restaurants, views, and boat tour access.",
    note: "Scenic, Walkable, Romantic"
  },
  {
    id: "au-cheval",
    name: "Au Cheval",
    category: "Food",
    type: "food",
    price: "$$$",
    neighborhood: "West Loop",
    image: "https://images.squarespace-cdn.com/content/v1/67223ccb89a1690d7a80caa4/1732119030238-4C3W8KF5GEIN0ZR2Z5XA/auc1-29.jpg",
    description: "A popular West Loop restaurant known for its burger and late-night dining experience.",
    note: "Trendy, Busy, Foodie"
  },
  {
    id: "londonhouse",
    name: "LondonHouse Rooftop",
    category: "Bar",
    type: "bar",
    price: "$$$",
    neighborhood: "River North",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/London%20House%20Rooftop%2C%20Chicago.jpg?width=500",
    description: "An upscale rooftop bar with strong downtown and river views.",
    note: "Fancy, Scenic, Romantic"
  },
  {
    id: "small-cheval",
    name: "Small Cheval",
    category: "Food",
    type: "food",
    price: "$$",
    neighborhood: "Wicker Park",
    image: "https://images.squarespace-cdn.com/content/v1/664b756924d01f2bafa19992/bfae2152-f1c0-4280-80f5-11ea7e0860db/new-shots-outdoor-2.jpeg",
    description: "A casual burger spot with a simple menu and relaxed Chicago neighborhood feel.",
    note: "Casual, Quick, Tasty"
  },
  {
    id: "violet-hour",
    name: "The Violet Hour",
    category: "Bar",
    type: "bar",
    price: "$$$",
    neighborhood: "Wicker Park",
    image: "https://images.squarespace-cdn.com/content/v1/5689f7a2c21b8690d5c16c46/1626115529676-3NAZ1D98F1VN338QGJW4/tvh7.jpeg",
    description: "A moody cocktail bar for quiet drinks and a polished night out.",
    note: "Hidden, Cocktails, Date"
  },
  {
    id: "millennium",
    name: "Millennium Park",
    category: "Landmark",
    type: "free",
    price: "Free",
    neighborhood: "Downtown",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Millennium%20park%2Cchicago.JPG?width=500",
    description: "A classic downtown landmark known for Cloud Gate, public art, and skyline views.",
    note: "Touristy, Scenic, Photo Friendly"
  },
  {
    id: "cindy",
    name: "Cindy's Rooftop",
    category: "Food",
    type: "food",
    price: "$$$",
    neighborhood: "Loop",
    image: "https://cdn.prod.website-files.com/692deee1433d0acae210e525/6930b2963bc306834dd9c99c_Daniel%20Kelleghan%20Photography-2024-03-25%20Cindys57247-HDR.avif",
    description: "A lively rooftop restaurant overlooking Millennium Park and Lake Michigan.",
    note: "Views, Brunch, Groups"
  }
];

const outings = [
  {
    id: "thrifting",
    title: "Thrifting Adventure",
    filter: "adventure",
    location: "Logan Square",
    duration: "Could use more members?",
    time: "May 16, 2026 - 1:00 PM - 5:00 PM",
    images: [places[5].image, places[2].image, places[4].image]
  },
  {
    id: "date-night",
    title: "Date Night",
    filter: "date",
    location: "Loop",
    duration: "Add new members?",
    time: "May 28, 2026 - 3:00 PM - 10:00 PM",
    images: [places[1].image, places[3].image, places[7].image]
  },
  {
    id: "birthday",
    title: "Birthday Bar Crawl",
    filter: "birthday",
    location: "River North",
    duration: "Add new members?",
    time: "May 30, 2026 - 10:30 PM - 2:00 AM",
    images: [places[3].image, places[5].image, places[2].image]
  },
  {
    id: "museum-day",
    title: "Museum Day",
    filter: "adventure",
    location: "Downtown",
    duration: "Quiet afternoon plan",
    time: "Jun 4, 2026 - 11:00 AM - 4:00 PM",
    images: [places[0].image, places[6].image, places[1].image]
  }
];

let activeCollectionFilter = "all";
let activeOutingFilter = "all";
let playbookPlaces = loadPlaybookPlaces();

function loadPlaybookPlaces() {
  try {
    const savedIds = JSON.parse(localStorage.getItem(playbookStorageKey) || "null");
    if (!Array.isArray(savedIds)) return [places[2], places[5]];

    return savedIds
      .map((placeId) => places.find((place) => place.id === placeId))
      .filter(Boolean);
  } catch (error) {
    return [places[2], places[5]];
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
  return `
    <article class="spot-tile" draggable="true" data-place-id="${escapeHtml(place.id)}">
      <span class="pill">${escapeHtml(place.category)} | ${escapeHtml(place.price)}</span>
      <h4>${escapeHtml(place.name)}</h4>
      <img src="${escapeHtml(place.image)}" alt="${escapeHtml(place.name)}" />
      <p>${escapeHtml(place.description)}</p>
      <div class="spot-meta">${escapeHtml(place.note)}</div>
    </article>
  `;
}

function playbookCard(place, index) {
  return `
    <article class="playbook-card" data-playbook-index="${index}">
      <span class="pill">${escapeHtml(place.category)} | ${escapeHtml(place.price)}</span>
      <h4>${escapeHtml(place.name)}</h4>
      <img src="${escapeHtml(place.image)}" alt="${escapeHtml(place.name)}" />
      <p>${escapeHtml(place.neighborhood)}</p>
      <p>${escapeHtml(place.note)}</p>
      <button class="remove-stop" type="button" aria-label="Remove ${escapeHtml(place.name)}">Remove</button>
    </article>
  `;
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

  collectionGrid.innerHTML = filteredPlaces.length
    ? filteredPlaces.map(placeTile).join("")
    : `<p class="drop-hint">No collection matches.</p>`;
}

function renderOutings() {
  const query = outingSearch.value;
  const filteredOutings = outings.filter((outing) => {
    const filterMatch = activeOutingFilter === "all" || outing.filter === activeOutingFilter;
    return filterMatch && matchesSearch(outing, query);
  });

  outingGrid.innerHTML = filteredOutings.length
    ? filteredOutings.slice(0, 3).map(outingCard).join("")
    : `<p class="drop-hint">No outing matches.</p>`;
}

function renderPlaybook() {
  const isEmpty = playbookPlaces.length === 0;
  playbookList.classList.toggle("is-empty", isEmpty);
  addBlankStopBtn.classList.toggle("is-hidden", !isEmpty);
  playbookList.innerHTML = playbookPlaces.length
    ? playbookPlaces.map(playbookCard).join("")
    : `<p class="drop-hint">Drag places here</p>`;
}

function addPlaceToPlaybook(placeId) {
  const place = places.find((item) => item.id === placeId);
  if (!place) return;
  if (playbookPlaces.some((selectedPlace) => selectedPlace.id === place.id)) return;

  updatePlaybookPlaces([...playbookPlaces, place]);
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

collectionGrid.addEventListener("dragstart", (event) => {
  const tile = event.target.closest(".spot-tile");
  if (!tile) return;

  event.dataTransfer.setData("text/plain", tile.dataset.placeId);
  event.dataTransfer.effectAllowed = "copy";
});

playbookList.addEventListener("dragover", (event) => {
  event.preventDefault();
  playbookList.classList.add("drag-over");
});

playbookList.addEventListener("dragleave", () => {
  playbookList.classList.remove("drag-over");
});

playbookList.addEventListener("drop", (event) => {
  event.preventDefault();
  playbookList.classList.remove("drag-over");

  addPlaceToPlaybook(event.dataTransfer.getData("text/plain"));
});

addBlankStopBtn.addEventListener("dragover", (event) => {
  event.preventDefault();
  addBlankStopBtn.classList.add("drag-over");
});

addBlankStopBtn.addEventListener("dragleave", () => {
  addBlankStopBtn.classList.remove("drag-over");
});

addBlankStopBtn.addEventListener("drop", (event) => {
  event.preventDefault();
  addBlankStopBtn.classList.remove("drag-over");

  addPlaceToPlaybook(event.dataTransfer.getData("text/plain"));
});

playbookList.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-stop");
  if (!removeButton) return;

  const card = removeButton.closest(".playbook-card");
  const index = Number(card.dataset.playbookIndex);
  updatePlaybookPlaces(playbookPlaces.filter((_, itemIndex) => itemIndex !== index));
});

addBlankStopBtn.addEventListener("click", () => {
  const nextPlace = places.find((place) => !playbookPlaces.some((selected) => selected.id === place.id)) || places[0];
  updatePlaybookPlaces([...playbookPlaces, nextPlace]);
});

createOutingBtn.addEventListener("click", () => {
  window.location.href = "Outings_Creations_Page.html";
});

document.addEventListener("click", closeMenus);

setActiveMenuButton(collectionFilterMenu, activeCollectionFilter);
setActiveMenuButton(outingFilterMenu, activeOutingFilter);
renderCollections();
renderOutings();
renderPlaybook();
