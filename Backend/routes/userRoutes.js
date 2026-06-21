const express = require("express");
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.put("/profile", authMiddleware, userController.updateProfile);

module.exports = router;
