const express = require("express");
const { getPlaces, getFilterOptions, getPlacePhoto } = require("../controllers/placesController");

const router = express.Router();

router.get("/", getPlaces);
router.get("/filters", getFilterOptions);
router.get("/photo", getPlacePhoto);

module.exports = router;
