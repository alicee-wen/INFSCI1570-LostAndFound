const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// pages
router.get("/signup", authController.showSignup);
router.get("/login", authController.showLogin);

// actions
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

module.exports = router;
