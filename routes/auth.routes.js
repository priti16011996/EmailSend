const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");
const otpRateLimiter = require("../middleware/otpRateLimiting.middleware");

router.post("/register", authController.register);

router.post("/verify-otp", authController.verifyOTP);

router.post("/login", authController.login);

router.post("/resend-otp", otpRateLimiter, authController.resendOTP);

module.exports = router;
