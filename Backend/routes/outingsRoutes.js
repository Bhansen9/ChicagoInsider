const express = require("express");
const outingController = require("../controllers/outingController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.post("/", outingController.create);
router.get("/", outingController.index);
router.post("/:outingId/contributors", outingController.addContributor);
router.patch("/:outingId/contributors/:userId", outingController.updateContributor);
router.delete("/:outingId/contributors/:userId", outingController.deleteContributor);

module.exports = router;
