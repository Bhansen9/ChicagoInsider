const express = require("express");

const router = express.Router();

const googleMapsKeyBySurface = {
  home: "GOOGLE_MAPS_API_KEY",
  creations: "GOOGLE_MAPS_API_KEY"
};

router.get("/maps", (req, res) => {
  const surface = String(req.query.surface || "").toLowerCase();
  const surfaceEnvName = googleMapsKeyBySurface[surface];
  const googleMapsApiKey = (
    (surfaceEnvName && process.env[surfaceEnvName]) ||
    process.env.GOOGLE_MAPS_BROWSER_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    ""
  );

  res.json({
    googleMapsApiKey
  });
});

module.exports = router;
