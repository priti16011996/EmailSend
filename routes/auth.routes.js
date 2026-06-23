const express = require("express");

const router = express.Router();

const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);

router.post("/verify-otp", authController.verifyOTP);

router.post("/login", authController.login);

module.exports = router;
