const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Post = require("../models/post");
const { requireLogin, requireAdmin } = require("../middleware/auth");
const { Cursor } = require("mongoose");
const { captureRejectionSymbol } = require("connect-mongo");

// GET admin/users - admin dashboard of all users on site
router.get("/users", requireLogin, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, "-password_hash");

    res.render("admin/users", { users, currentUser: req.currentUser });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server error: error loading users.");
  }
});
module.exports = router;
