const places = require("../data/chicagoPlacesSeed.json");

const knownValues = {
  neighborhoods: [...new Set(places.map((place) => place.neighborhood))],
  categories: [...new Set(places.map((place) => place.category))],
  vibes: [...new Set(places.flatMap((place) => place.vibes))]
};

function includesPhrase(text, phrase) {
  return text.includes(phrase.toLowerCase());
}

function parseWithHeuristics(prompt) {
  const text = String(prompt || "").toLowerCase();
  if (!text.trim()) return {};

  const parsed = {};

  if (/\b(cheap|low cost|budget)\b/.test(text)) parsed.budget = "cheap";
  if (/\b(free)\b/.test(text)) parsed.budget = "free";
  if (/\b(moderate|mid range|not too expensive)\b/.test(text)) parsed.budget = "moderate";
  if (/\b(expensive|upscale|luxury|splurge)\b/.test(text)) parsed.budget = "expensive";

  const neighborhood = knownValues.neighborhoods.find((value) => includesPhrase(text, value));
  if (neighborhood) parsed.neighborhood = neighborhood;

  if (/\b(bar|bars|cocktail|drinks|rooftop)\b/.test(text)) parsed.category = "Bar";
  if (/\b(food|restaurant|restaurants|eat|dinner|lunch|brunch|burger|pizza)\b/.test(text)) parsed.category = "Food";
  if (/\b(landmark|sightseeing|tourist|touristy)\b/.test(text)) parsed.category = "Landmark";
  if (/\b(activity|activities|walk|walking|zoo|museum|day)\b/.test(text)) parsed.category = "Activity";

  const vibe = knownValues.vibes.find((value) => includesPhrase(text, value.replace("-", " ")) || includesPhrase(text, value));
  if (vibe) parsed.vibe = vibe;

  return parsed;
}

async function parseWithOpenAI(prompt) {
  if (!process.env.OPENAI_API_KEY || !prompt) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "Extract Chicago recommendation filters from the user request. Return only compact JSON with optional keys: budget, neighborhood, category, vibe. Do not invent places."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI parsing failed with status ${response.status}`);
  }

  const data = await response.json();
  const text = data.output_text || "";
  return JSON.parse(text);
}

async function parseUserRequest(prompt) {
  try {
    return (await parseWithOpenAI(prompt)) || parseWithHeuristics(prompt);
  } catch (error) {
    console.warn("Falling back to local prompt parsing:", error.message);
    return parseWithHeuristics(prompt);
  }
}

module.exports = {
  parseUserRequest
};
