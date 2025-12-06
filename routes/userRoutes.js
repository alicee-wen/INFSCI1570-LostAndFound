const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { requireLogin } = require("../middleware/auth");

router.get("/profile", requireLogin, userController.profile);

module.exports = router;
