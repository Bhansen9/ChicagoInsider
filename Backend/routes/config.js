const express = require("express");

const router = express.Router();

router.get("/maps", (req, res) => {
  res.json({
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ""
  });
});

module.exports = router;
