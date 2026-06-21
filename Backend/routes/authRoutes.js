const express = require("express");
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/forgot-password", authController.forgotPassword);
router.post("/resend-confirmation", authController.resendConfirmation);
router.post("/logout", authMiddleware, authController.logout);
router.post("/reset-password", authMiddleware, authController.resetPassword);
router.get("/me", authMiddleware, authController.me);

module.exports = router;
