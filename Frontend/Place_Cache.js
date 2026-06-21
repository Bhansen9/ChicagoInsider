(function () {
  const isCacheBackendOrigin = ["localhost:3000", "127.0.0.1:3000"].includes(window.location.host);
  const apiBaseUrl = isCacheBackendOrigin ? "" : "http://localhost:3000";

  function googlePlaceIdFor(place) {
    return String(
      place?.place_id ||
      place?.google_place_id ||
      place?.googlePlaceId ||
      ""
    ).trim();
  }

  async function cachePlace(googlePlaceId) {
    const response = await fetch(`${apiBaseUrl}/api/places/cache`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ googlePlaceId })
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Place cache failed with status ${response.status}`);
    }

    return response.json();
  }

  async function cacheDisplayedPlaces(places = []) {
    const googlePlaceIds = [...new Set(places.map(googlePlaceIdFor).filter(Boolean))];
    if (!googlePlaceIds.length) return [];

    const results = await Promise.allSettled(googlePlaceIds.map(cachePlace));
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Could not cache Google place ${googlePlaceIds[index]}`, result.reason);
      }
    });

    return results
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);
  }

  window.ChicagoInsiderApiBaseUrl = apiBaseUrl;
  window.ChicagoInsiderPlaceCache = {
    cacheDisplayedPlaces,
    googlePlaceIdFor
  };
  window.cacheDisplayedPlaces = cacheDisplayedPlaces;
})();
