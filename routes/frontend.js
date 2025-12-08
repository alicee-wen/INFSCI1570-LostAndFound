// routes/frontend.js
const express = require("express");
const router = express.Router();


const Post = require("../models/post");

// home page
router.get("/", async (req, res) => {
  try {
    //fetch posts 
    const posts = await Post.find().sort({ date_created: -1 }).limit(10);

    res.render("home", {
      userId: req.session.userId || null,
        posts, 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading home page");
  }
});

module.exports = router;
