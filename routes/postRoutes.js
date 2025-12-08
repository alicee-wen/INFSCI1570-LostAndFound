// routes/postRoutes.js
const express = require("express");
const router = express.Router();
const Post = require("../models/post");

// list all posts (Posts home page)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ date_created: -1 });

    res.render("posts/main", {
      posts,                  // pass list of posts to the template
      userId: req.session.userId || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading posts.");
  }
});

// display create post form
router.get("/new", (req, res) => {
  res.render("posts/createPost", {
    userId: req.session.userId || null
  });
});

// create new post submission
router.post("/new", async (req, res) => {
  try {
    const { title, description, category, location, status } = req.body;

    const newPost = new Post({
      title,
      description,
      category,
      location,
      status, // e.g. "lost" or "found"
      author_id: req.session.userId || null,  
      date_created: new Date().toISOString()
    });

    await newPost.save();
    res.redirect("/posts");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error creating post.");
  }
});

// view a post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found.");

    res.render("posts/showPost", {
      post,
      userId: req.session.userId || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading post.");
  }
});

// display edit form
router.get("/:id/edit", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found.");

    res.render("posts/editPost", {
      post,
      userId: req.session.userId || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading edit form.");
  }
});

// edit form submission
router.post("/:id/edit", async (req, res) => {
  try {
    const { title, description, category, location, status } = req.body;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found.");

    post.title = title;
    post.description = description;
    post.category = category;
    post.location = location;
    post.status = status;

    await post.save();
    res.redirect(`/posts/${post._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating post.");
  }
});

// delete post
router.post("/:id/delete", async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.redirect("/posts");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting post.");
  }
});

module.exports = router;
