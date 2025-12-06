// init project
require('dotenv').config();
const express = require('express');
const app = express();

// allow express to read JSON
app.use(express.json());

// allow express to read form body data (for login/signup)
app.use(express.urlencoded({ extended: true }));

// session + EJS support
const session = require("express-session");
const MongoStore = require("connect-mongo");
app.set("view engine", "ejs");

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Import models
const User = require('./models/user');
const Post = require('./models/post');
const Counter = require('./models/counter');

// MongoDB connection
const mongoUri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.HOST}/${process.env.DATABASE}?retryWrites=true&w=majority`;

mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Session middleware (must come after DB connection setup)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: mongoUri
    })
  })
);

// --- Import and mount MVC/auth routes ---
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

app.use("/", authRoutes);      // /login, /signup, /logout
app.use("/users", userRoutes); // /users/profile (MVC page)

// Root route
app.get('/', (req, res) => {
  res.json({ message: "See README.md for documentation" });
});

// Use PORT from .env, default to 3000
const PORT = process.env.PORT || 3000;

// ------------------ Helper Functions for ID Generation ------------------

async function generateUserId() {
  const counter = await Counter.findByIdAndUpdate(
    'user',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `user${counter.seq}`;
}

async function generatePostId() {
  const counter = await Counter.findByIdAndUpdate(
    'post',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `post${counter.seq}`;
}

// ------------------ USER ROUTES (JSON API) ------------------

// GET all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: `User '${req.params.id}' not found.` });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST new user
app.post('/api/users', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const password_hash = await bcrypt.hash(password, 12);
    const _id = await generateUserId();
    const newUser = {
      _id,
      username,
      email,
      password_hash,
      date_created: new Date().toISOString()
    };

    const userDoc = new User(newUser);
    await userDoc.save();

    res.status(201).json(userDoc);
  } catch (err) {
    res.status(500).json({ error: "Failed to create user." });
  }
});

// PUT update user
app.put('/api/users/:id', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: `User '${req.params.id}' not found.` });

    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password_hash = await bcrypt.hash(password, 12);

    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: `User '${req.params.id}' not found.` });
    res.json({ message: `User '${req.params.id}' deleted`, user: deletedUser });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------ POST ROUTES (JSON API) ------------------

// GET all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single post w/author info
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: `Post '${req.params.id}' not found.` });

    const author = await User.findById(post.author_id);
    const authorInfo = author
      ? { _id: author._id, username: author.username, email: author.email }
      : { _id: null, username: "Deleted Author", email: null };

    res.json({ ...post.toObject(), author: authorInfo });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST new post
app.post('/api/posts', async (req, res) => {
  const { author_id, content } = req.body;
  if (!author_id || !content) return res.status(400).json({ error: "Missing required fields." });

  try {
    const author = await User.findById(author_id);
    if (!author) return res.status(400).json({ error: `Author '${author_id}' does not exist.` });

    const _id = await generatePostId();
    const newPost = new Post({
      _id,
      author_id,
      content,
      date_created: new Date().toISOString()
    });

    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update post
app.put('/api/posts/:id', async (req, res) => {
  const { content } = req.body;

  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: `Post '${req.params.id}' not found.` });

    if (content) post.content = content;

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ error: `Post '${req.params.id}' not found.` });

    res.json({ message: `Post '${req.params.id}' deleted`, post: deletedPost });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------ Start server ------------------
const listener = app.listen(PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
