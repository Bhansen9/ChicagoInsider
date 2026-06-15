const express = require("express");
const { env, getGoogleMapsBrowserKey } = require("../config/environment");

const router = express.Router();

const googleMapsKeyBySurface = {
  home: "GOOGLE_MAPS_HOME_API_KEY",
  creations: "GOOGLE_MAPS_CREATIONS_API_KEY"
};

router.get("/maps", (req, res) => {
  const surface = String(req.query.surface || "").toLowerCase();
  const surfaceEnvName = googleMapsKeyBySurface[surface];
  const googleMapsApiKey = (surfaceEnvName && env(surfaceEnvName)) || getGoogleMapsBrowserKey();

  res.json({
    googleMapsApiKey,
    isConfigured: Boolean(googleMapsApiKey)
  });
});

module.exports = router;
