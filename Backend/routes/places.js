const express = require("express");
const { getPlaces, getFilterOptions } = require("../controllers/placesController");

const router = express.Router();

router.get("/", getPlaces);
router.get("/filters", getFilterOptions);

module.exports = router;
