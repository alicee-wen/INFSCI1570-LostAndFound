const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { requireLogin } = require("../middleware/auth");

router.get("/profile", requireLogin, userController.profile);


router.get("/editProfile", userController.editProfileForm);


router.post("/editProfile", userController.editProfileSubmit);

module.exports = router;
