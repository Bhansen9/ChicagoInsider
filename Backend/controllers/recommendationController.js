const { searchChicagoPlaces } = require("../services/googlePlacesService");
const { parseUserRequest } = require("../services/openaiService");

const HOME_RECOMMENDATION_LIMIT = 20;

async function getRecommendations(req, res, next) {
  try {
    const filters = req.body || {};
    const parsedPrompt = await parseUserRequest(filters.prompt || "");
    const combinedFilters = { ...parsedPrompt };

    ["budget", "price", "neighborhood", "category", "vibe"].forEach((key) => {
      if (filters[key]) {
        combinedFilters[key] = filters[key];
      }
    });

    const recommendations = await searchChicagoPlaces(
      { ...combinedFilters, prompt: filters.prompt },
      { limit: HOME_RECOMMENDATION_LIMIT }
    );

    res.json({
      parsedFilters: combinedFilters,
      recommendations
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRecommendations
};
