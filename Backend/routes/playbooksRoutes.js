const express = require("express");
const playbookController = require("../controllers/playbookController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", playbookController.create);
router.get("/", playbookController.index);
router.get("/default", playbookController.showDefault);
router.post("/default/places", playbookController.addDefaultPlace);
router.delete("/default/places/:placeId", playbookController.deleteDefaultPlace);
router.post("/:playbookId/places", playbookController.addPlace);
router.delete("/:playbookId/places/:placeId", playbookController.deletePlace);

module.exports = router;
