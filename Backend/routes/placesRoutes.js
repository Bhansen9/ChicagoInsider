const express = require("express");
const {
  cachePlace,
  getPlaces,
  getFilterOptions,
  getPlaceByGooglePlaceId,
  getPlacePhoto,
  handlePlaceCacheError
} = require("../controllers/placesController");

const router = express.Router();

router.get("/", getPlaces);
router.get("/filters", getFilterOptions);
router.get("/photo", getPlacePhoto);
router.post("/cache", cachePlace);
router.get("/:googlePlaceId", getPlaceByGooglePlaceId);

router.use(handlePlaceCacheError);

module.exports = router;
