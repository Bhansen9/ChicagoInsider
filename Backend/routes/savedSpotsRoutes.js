const express = require("express");
const savedSpotsController = require("../controllers/savedSpotsController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", savedSpotsController.create);
router.get("/", savedSpotsController.index);
router.delete("/:id", savedSpotsController.destroy);

module.exports = router;
