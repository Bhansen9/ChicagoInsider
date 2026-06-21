const express = require("express");
const playbookController = require("../controllers/playbookController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", playbookController.create);
router.get("/", playbookController.index);
router.post("/:playbookId/places", playbookController.addPlace);
router.delete("/:playbookId/places/:placeId", playbookController.deletePlace);

module.exports = router;
