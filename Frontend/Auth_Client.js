(function () {
  const API_BASE_URL = window.ChicagoInsiderApiBaseUrl ?? "http://localhost:3000";
  const SESSION_KEY = "chicagoInsider.authSession";
  const PROFILE_KEY = "chicagoInsider.authProfile";
  const USER_STATE_KEYS = [
    "chicagoInsider.playbookPlaces",
    "chicagoInsider.savedOutings",
    "chicagoInsider.workspacePlaces",
    "chicagoInsider.contributors",
    "chicagoInsider.profilePreferences"
  ];

  function readJson(key, fallback = null) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getSession() {
    return readJson(SESSION_KEY);
  }

  function getProfile() {
    return readJson(PROFILE_KEY);
  }

  function saveAuthState(payload = {}) {
    if (payload.session) writeJson(SESSION_KEY, payload.session);
    if (payload.profile) writeJson(PROFILE_KEY, payload.profile);
    applyAuthUi();
  }

  function clearAuthState({ clearUserState = false } = {}) {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(PROFILE_KEY);
    if (clearUserState) USER_STATE_KEYS.forEach((key) => localStorage.removeItem(key));
    applyAuthUi();
  }

  function authRedirect() {
    return `Login_Page.html?redirect=${encodeURIComponent(window.location.pathname.split("/").pop() || "Home_Page.html")}`;
  }

  function sessionNeedsRefresh(session) {
    const expiresAtMs = Number(session?.expires_at || 0) * 1000;
    return Boolean(session?.refresh_token && expiresAtMs && expiresAtMs - Date.now() < 60000);
  }

  async function refreshSession() {
    const current = getSession();
    if (!current?.refresh_token) return null;

    const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: current.refresh_token })
    });

    if (!response.ok) {
      clearAuthState({ clearUserState: true });
      return null;
    }

    const data = await response.json();
    if (data.session) writeJson(SESSION_KEY, data.session);
    return data.session || null;
  }

  async function activeSession() {
    const session = getSession();
    if (!session) return null;
    if (sessionNeedsRefresh(session)) return refreshSession();
    return session;
  }

  async function apiFetch(path, options = {}, { auth = true, retry = true } = {}) {
    const headers = {
      ...(options.headers || {})
    };

    if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    if (auth) {
      const session = await activeSession();
      if (!session?.access_token) {
        window.location.href = authRedirect();
        throw new Error("Authentication required.");
      }
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });

    if (response.status === 401 && auth && retry && await refreshSession()) {
      return apiFetch(path, options, { auth, retry: false });
    }

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const error = new Error(errorPayload.error || "Request failed.");
      error.status = response.status;
      error.code = errorPayload.code;
      throw error;
    }

    return response.status === 204 ? null : response.json();
  }

  async function signup(payload) {
    const data = await apiFetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        redirectTo: `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, "Login_Page.html")}`
      })
    }, { auth: false });
    saveAuthState(data);
    return data;
  }

  async function resendConfirmation(email) {
    return apiFetch("/api/auth/resend-confirmation", {
      method: "POST",
      body: JSON.stringify({
        email,
        redirectTo: `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, "Login_Page.html")}`
      })
    }, { auth: false });
  }

  async function login(payload) {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }, { auth: false });
    saveAuthState(data);
    return data;
  }

  async function logout() {
    try {
      if (getSession()) {
        await apiFetch("/api/auth/logout", { method: "POST" });
      }
    } catch (error) {
      console.warn(error);
    } finally {
      clearAuthState({ clearUserState: true });
      window.location.href = "Login_Page.html";
    }
  }

  async function forgotPassword(email) {
    return apiFetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email,
        redirectTo: `${window.location.origin}${window.location.pathname.replace(/[^/]+$/, "Reset_Password_Page.html")}`
      })
    }, { auth: false });
  }

  async function resetPassword(password) {
    return apiFetch("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ password })
    });
  }

  async function getMe() {
    const data = await apiFetch("/api/auth/me");
    if (data.profile) writeJson(PROFILE_KEY, data.profile);
    applyAuthUi();
    return data;
  }

  async function updateProfile(payload) {
    const data = await apiFetch("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(payload)
    });
    if (data.profile) writeJson(PROFILE_KEY, data.profile);
    applyAuthUi();
    return data.profile;
  }

  async function requireAuth() {
    const session = await activeSession();
    if (!session?.access_token) {
      window.location.href = authRedirect();
      return null;
    }
    return session;
  }

  async function redirectIfAuthenticated(defaultTarget = "Home_Page.html") {
    const session = await activeSession();
    if (session?.access_token) {
      const target = new URLSearchParams(window.location.search).get("redirect") || defaultTarget;
      window.location.href = target;
    }
  }

  function placePayload(place = {}) {
    return {
      place: {
        id: place.id,
        placeId: place.placeId || place.id,
        googlePlaceId: place.googlePlaceId || place.google_place_id || place.place_id || "",
        name: place.name,
        category: place.category,
        type: place.type,
        price: place.price,
        neighborhood: place.neighborhood,
        description: place.description,
        image: place.image || place.imageUrl,
        imageUrl: place.imageUrl || place.image,
        note: place.note || (place.vibes || []).join(", "),
        coordinates: place.coordinates,
        website: place.website || place.websiteUri,
        googleMapsUri: place.googleMapsUri || place.reviewUrl,
        photoName: place.photoName
      }
    };
  }

  async function saveSpot(place, notes = "") {
    return apiFetch("/api/saved-spots", {
      method: "POST",
      body: JSON.stringify({ ...placePayload(place), notes })
    });
  }

  async function getSavedSpots() {
    const data = await apiFetch("/api/saved-spots");
    return data.savedSpots || [];
  }

  async function deleteSavedSpot(savedSpotId) {
    return apiFetch(`/api/saved-spots/${encodeURIComponent(savedSpotId)}`, {
      method: "DELETE"
    });
  }

  async function getOrCreateDefaultPlaybook() {
    const data = await apiFetch("/api/playbooks");
    const existing = (data.playbooks || []).find((playbook) => playbook.title === "My Playbook");
    if (existing) return existing;

    const created = await apiFetch("/api/playbooks", {
      method: "POST",
      body: JSON.stringify({ title: "My Playbook", visibility: "private" })
    });
    return created.playbook;
  }

  async function addPlaceToDefaultPlaybook(place) {
    const playbook = await getOrCreateDefaultPlaybook();
    const data = await apiFetch(`/api/playbooks/${encodeURIComponent(playbook.id)}/places`, {
      method: "POST",
      body: JSON.stringify(placePayload(place))
    });
    return data.playbookPlace;
  }

  async function deletePlaceFromDefaultPlaybook(supabasePlaceId) {
    const playbook = await getOrCreateDefaultPlaybook();
    return apiFetch(
      `/api/playbooks/${encodeURIComponent(playbook.id)}/places/${encodeURIComponent(supabasePlaceId)}`,
      { method: "DELETE" }
    );
  }

  async function getDefaultPlaybookPlaces() {
    const playbook = await getOrCreateDefaultPlaybook();
    return (playbook.playbook_places || []).map((entry) => ({
      ...entry.place,
      playbookPlaceId: entry.id,
      supabasePlaceId: entry.place_id
    }));
  }

  async function createOuting(payload) {
    const data = await apiFetch("/api/outings", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return data.outing;
  }

  async function getOutings() {
    const data = await apiFetch("/api/outings");
    return data.outings || [];
  }

  async function addOutingContributor(outingId, payload) {
    const data = await apiFetch(`/api/outings/${encodeURIComponent(outingId)}/contributors`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return data.contributor;
  }

  function initials(profile) {
    const username = profile?.username || "User";
    return username.slice(0, 1).toUpperCase();
  }

  function applyAuthUi() {
    const profile = getProfile();
    document.querySelectorAll("[data-auth-username]").forEach((node) => {
      node.textContent = profile?.username || "Profile";
    });
    document.querySelectorAll("[data-auth-avatar]").forEach((node) => {
      if (profile?.profile_photo) {
        node.innerHTML = `<img src="${profile.profile_photo}" alt="${profile.username || "Profile"}" />`;
      } else {
        node.textContent = initials(profile);
      }
    });
    document.querySelectorAll("[data-logout-button]").forEach((button) => {
      button.hidden = !getSession();
      if (!button.dataset.authBound) {
        button.addEventListener("click", logout);
        button.dataset.authBound = "true";
      }
    });
  }

  window.ChicagoInsiderAuth = {
    addPlaceToDefaultPlaybook,
    apiFetch,
    applyAuthUi,
    clearAuthState,
    createOuting,
    deleteSavedSpot,
    deletePlaceFromDefaultPlaybook,
    forgotPassword,
    getDefaultPlaybookPlaces,
    getMe,
    getOrCreateDefaultPlaybook,
    getOutings,
    getProfile,
    getSavedSpots,
    getSession,
    login,
    logout,
    placePayload,
    redirectIfAuthenticated,
    resendConfirmation,
    requireAuth,
    resetPassword,
    saveSpot,
    saveAuthState,
    addOutingContributor,
    signup,
    updateProfile
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyAuthUi);
  } else {
    applyAuthUi();
  }
}());
