
const express = require("express");
const router = express.Router();
const Post = require("../models/post");
const Counter = require("../models/counter");
const multer = require("multer");
const path = require("path");

// multer storage
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

// list all posts (Posts home page)
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ date_created: -1 });

    res.render("posts/main", {
      posts,
      userId: req.session.userId || null,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error loading posts.");
  }
});

//  create post form
router.get("/new", (req, res) => {
  res.render("posts/createPost", {
    userId: req.session.userId || null,
  });
});

// create new post submission
router.post("/new", upload.single("photo"), async (req, res) => {
  try {
    const { title, description, category, location, status, photo_url } =
      req.body;

    if (!title || !description) {
      return res.status(400).send("Title and description required.");
    }
    const _id = await generatePostId();

    const newPost = new Post({
      _id,
      title,
      description,
      category,
      location_found: location,
      status: status || "lost",
      author_id: req.session.userId || "guest",
      date_created: new Date().toISOString(),
    });

    if (req.file) {
      newPost.photo_url = `/uploads/${req.file.filename}`;
    }

    await newPost.save();
    res.redirect("/posts");
  } catch (err) {
    console.log(err);
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
      userId: req.session.userId || null,
    });
  } catch (err) {
    console.log(err);
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
      userId: req.session.userId || null,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error loading edit form.");
  }
});

// edit post
router.post("/:id/edit", upload.single("photo"), async (req, res) => {
  try {
    const { title, description, category, location, status, photo_url } =
      req.body;

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send("Post not found.");

    post.title = title;
    post.description = description;
    post.category = category;
    post.location_found = location;
    post.status = status || "lost";

    if (req.file) {
      post.photo_url = `/uploads/${req.file.filename}`;
    }

    await post.save();
    res.redirect(`/posts/${post._id}`);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error editing post.");
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

// helper

async function generatePostId() {
  const counter = await Counter.findByIdAndUpdate(
    "post",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `post${counter.seq}`;
}
