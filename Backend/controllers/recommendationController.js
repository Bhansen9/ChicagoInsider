const { recommendPlaces } = require("../services/recommendationService");
const { parseUserRequest } = require("../services/openaiService");

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

    const recommendations = recommendPlaces(combinedFilters);

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
