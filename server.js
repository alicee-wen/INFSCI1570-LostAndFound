// init project
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json()); // allow express to read JSON body

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Import Mongoose models
const User = require('./models/user');
const Post = require('./models/post');
const Counter = require('./models/counter');

// --- MongoDB connection using variables from the .env file ---
const mongoUri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.HOST}/${process.env.DATABASE}?retryWrites=true&w=majority`;

mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Root route
app.get('/', (req, res) => {
  res.json({ message: "Please see the README.md for documentation" });
});

// Use PORT from .env, default to 3000
const PORT = process.env.PORT || 3000;

// ------------------ Helper Functions for ID Generation ------------------

// Generate a unique user ID using the counter collection
async function generateUserId() {
  const counter = await Counter.findByIdAndUpdate(
    'user',
    { $inc: { seq: 1 } },
    { new: true, upsert: true } // creates a counter in the counter collection if one for users is missing
  );
  return `user${counter.seq}`;
}

// Generate a unique post ID using the counter collection
async function generatePostId() {
  const counter = await Counter.findByIdAndUpdate(
    'post',
    { $inc: { seq: 1 } },
    { new: true, upsert: true } // creates a counter in the counter collection if one for posts is missing
  );
  return `post${counter.seq}`;
}

// ------------------ USER ROUTES ------------------

// GET all users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single user by ID
app.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: `User '${req.params.id}' was not found.` });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST new user
app.post('/users', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const password_hash = await bcrypt.hash(password, 12);
    const _id = await generateUserId(); // generates counter-based ID
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
app.put('/users/:id', async (req, res) => {
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
app.delete('/users/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: `User '${req.params.id}' not found.` });
    res.json({ message: `User '${req.params.id}' deleted successfully.`, user: deletedUser });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------ POST ROUTES ------------------

// GET all posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single post with author info
app.get('/posts/:id', async (req, res) => {
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
app.post('/posts', async (req, res) => {
  const { author_id, content } = req.body;
  if (!author_id || !content) return res.status(400).json({ error: "Missing required fields." });

  try {
    const author = await User.findById(author_id);
    if (!author) return res.status(400).json({ error: `Author '${author_id}' does not exist.` });

    const _id = await generatePostId(); // generates counter-based ID
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
app.put('/posts/:id', async (req, res) => {
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
app.delete('/posts/:id', async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ error: `Post '${req.params.id}' not found.` });

    res.json({ message: `Post '${req.params.id}' deleted successfully.`, post: deletedPost });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------ MIXED ROUTES ------------------

// GET all posts for a specific user
app.get('/users/:id/posts', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: `User '${req.params.id}' not found.` });

    const userPosts = await Post.find({ author_id: req.params.id });
    res.json(userPosts);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------ Start server ------------------
const listener = app.listen(PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
