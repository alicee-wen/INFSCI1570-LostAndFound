// init project
require('dotenv').config();
const express = require('express');
const app = express();
app.use(express.json());
const path = require("path");
app.use("/uploads", express.static("uploads"));

// allow form submissions (required for login/signup)
app.use(express.urlencoded({ extended: true }));



app.use(express.static(path.join(__dirname, 'public')));

// session + EJS support
const session = require("express-session");
const MongoStore = require("connect-mongo");
app.set("view engine", "ejs");
app.set("views", __dirname + "/views/");

const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Import Mongoose models
const User = require('./models/user');
const Post = require('./models/post');
const Counter = require('./models/counter');
const Comment = require('./models/comment');

// --- MongoDB connection using variables from the .env file ---
const mongoUri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.HOST}/${process.env.DATABASE}?retryWrites=true&w=majority`;

mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Session middleware
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


// make userId available in all EJS templates
app.use((req, res, next) => {
  res.locals.userId = req.session.userId || null;
  next();
});

// Root route
// app.get('/', (req, res) => {
//   // res.json({ message: "Please see the README.md for documentation" });
//   res.render('home', {
//     userId: req.session.userId || null
//   });
// });

// app.get("/ping", (req, res) => {
//   console.log("GET /ping hit");
//   res.send("ping");
// });

// Frontend routes
const frontendRouter = require("./routes/frontend");


// --- Import and mount MVC/auth routes ---
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const postRoutes = require("./routes/postRoutes");



// frontend pages
app.use("/", frontendRouter);

app.use("/posts", postRoutes); // MVC post system
app.use("/", authRoutes);
app.use("/users", userRoutes); // MVC user system (profile, etc.)

// Use PORT from .env, default to 3000
const PORT = process.env.PORT || 3001;

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

async function generateCommentId() {
  const counter = await Counter.findByIdAndUpdate(
    'comment',
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `comment${counter.seq}`;
}


// ------------------ API ROUTES ------------------ 
const apiRouter = express.Router();
app.use("/api", apiRouter);

// GET all users
apiRouter.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single user by ID
apiRouter.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: `User '${req.params.id}' was not found.` });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST new user
apiRouter.post('/users', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const password_hash = await bcrypt.hash(password, 12);
    const _id = await generateUserId();
    const newUser = new User({
      _id,
      username,
      email,
      password_hash,
      date_created: new Date().toISOString()
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: "Failed to create user." });
  }
});

// PUT update user
apiRouter.put('/users/:id', async (req, res) => {
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
apiRouter.delete('/users/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: `User '${req.params.id}' not found.` });

    res.json({ message: `User '${req.params.id}' deleted successfully.`, user: deletedUser });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------ POST ROUTES ------------------
apiRouter.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

apiRouter.get('/posts/:id', async (req, res) => {
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

apiRouter.post('/posts', async (req, res) => {
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

apiRouter.put('/posts/:id', async (req, res) => {
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

apiRouter.delete('/posts/:id', async (req, res) => {
  try {
    const deletedPost = await Post.findByIdAndDelete(req.params.id);
    if (!deletedPost) return res.status(404).json({ error: `Post '${req.params.id}' not found.` });

    res.json({ message: `Post '${req.params.id}' deleted successfully.`, post: deletedPost });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------ COMMENT ROUTES ------------------

// GET a single comment by ID
apiRouter.get('/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: `Comment '${req.params.id}' not found.` });
    }

    // Fetch author info. If the author was soft-deleted, gives placeholder info.
    let authorInfo;
    if (comment.author_id === "Deleted User") {
      authorInfo = { _id: null, username: "Deleted User", email: null };
    } else {
      const author = await User.findById(comment.author_id);
      authorInfo = author
        ? { _id: author._id, username: author.username, email: author.email }
        : { _id: null, username: "Deleted User", email: null };
    }

    // Return comment + author info
    res.json({
      ...comment.toObject(),
      author: authorInfo
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all descendants of a specific comment (Displayed as a tree)
apiRouter.get('/comments/:id/replies', async (req, res) => {
  try {
    // Verify the parent comment exists
    const parentComment = await Comment.findById(req.params.id);
    if (!parentComment) return res.status(404).json({ error: `Comment '${req.params.id}' not found.` });

    // Fetch all comments under the same post
    const allComments = await Comment.find({ post_id: parentComment.post_id });

    // Map comments by their _id for easy lookup and initialize children
    const commentMap = {};
    allComments.forEach(comment => {
      commentMap[comment._id] = { ...comment.toObject(), children: [] };
    });

    // Build the tree
    allComments.forEach(comment => {
      if (comment.parent_id && commentMap[comment.parent_id]) {
        commentMap[comment.parent_id].children.push(commentMap[comment._id]);
      }
    });

    // Collect all unique author IDs (excluding soft-deleted authors)
    const authorIds = [...new Set(allComments
      .map(c => c.author_id)
      .filter(id => id !== "Deleted User"))];

    // Fetch all authors in a single query
    const authors = await User.find({ _id: { $in: authorIds } });
    const authorMap = authors.reduce((map, author) => {
      map[author._id] = { _id: author._id, username: author.username, email: author.email };
      return map;
    }, {});

    // Recursive function to attach author info
    function attachAuthorInfo(comment) {
      comment.author = comment.author_id === "Deleted User"
        ? { _id: null, username: "Deleted User", email: null }
        : authorMap[comment.author_id] || { _id: null, username: "Deleted User", email: null };

      comment.children.forEach(attachAuthorInfo);
      return comment;
    }

    // The root of the tree is the requested parent comment
    const root = attachAuthorInfo(commentMap[parentComment._id]);

    // Return the enriched tree starting at the parent
    res.json(root.children);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});



// POSTing a comment
apiRouter.post('/comments', async (req, res) => {
  const { author_id, content, parent_type, parent_id } = req.body;

  // Basic field validation
  if (!author_id || !content || !parent_type || !parent_id) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  if (!['post', 'comment'].includes(parent_type)) {
    return res.status(400).json({ error: "parent_type must be 'post' or 'comment'." });
  }

  try {
    // Verify author exists
    const author = await User.findById(author_id);
    if (!author) {
      return res.status(400).json({ error: `Author '${author_id}' does not exist.` });
    }

    let post_id;

    // If replying directly to a post...
    if (parent_type === "post") {
      const post = await Post.findById(parent_id);
      if (!post) {
        return res.status(400).json({ error: `Post '${parent_id}' does not exist.` });
      }

      // ...then we can just take the post_id directly from that post's _id.
      post_id = parent_id;
    }

    // If replying to another comment...
    if (parent_type === "comment") {
      const parentComment = await Comment.findById(parent_id);
      if (!parentComment) {
        return res.status(400).json({ error: `Comment '${parent_id}' does not exist.` });
      }

      // ...then we can inherit the post_id from the parent comment's stored post_id.
      post_id = parentComment.post_id;
    }

    // Generate the new comment ID
    const _id = await generateCommentId();

    // Create and save the comment
    const newComment = new Comment({
      _id, //This comment's unique id. 
      author_id, //Foreign key to the user that made it.
      content, //Whatever text the user decided to comment. 
      date_created: new Date().toISOString(), //Current date & time.
      post_id, //Foreign key to the post that this comment is a descendant of.
      parent_type, //Whether the parent is a post or a comment. 
      parent_id //Foreign key to the post or comment that this comment is a child of.
    });

    await newComment.save();

    //Return created comment
    res.status(201).json(newComment);

  } catch (err) {
    res.status(500).json({ error: "Failed to create comment." });
  }
});

// Use PUT to update a comment
apiRouter.put('/comments/:id', async (req, res) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Missing required field: content." });
  }

  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: `Comment '${req.params.id}' not found.` });
    }

    // Only content is editable. Parent relationships, author_id, date created, and the comment's own _id are all immutable.
    comment.content = content;

    await comment.save();
    res.json(comment);

  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Soft-delete a comment. This isn't a true delete so that comment chains aren't messed up, but the content and author_id are still removed.
apiRouter.delete('/comments/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ error: `Comment '${req.params.id}' not found.` });
    }

    // Soft delete: anonymize author and replace content
    comment.content = "[deleted]";
    comment.author_id = "Deleted User";

    await comment.save();

    res.json({
      message: `Comment '${req.params.id}' soft-deleted successfully.`,
      comment
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


// ------------------ MIXED ROUTES ------------------

// GET all comments for a specific post (Displayed flat [not a tree] for now.)
// Tell me if you guys want this to be converted into a tree like the /comments/:id/replies is. I wasn't sure what you wanted. 
apiRouter.get('/posts/:id/comments', async (req, res) => {
  try {
    // Verify the post exists
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: `Post '${req.params.id}' not found.` });

    // Fetch all comments for this post
    const comments = await Comment.find({ post_id: req.params.id });
    if (!comments.length) return res.json([]); // No comments, return empty array

    // Collect unique author IDs, ignoring soft-deleted ones
    const authorIds = [...new Set(
      comments
        .filter(c => c.author_id !== "Deleted User")
        .map(c => c.author_id)
    )];

    // Fetch all authors in a single query
    const authors = await User.find({ _id: { $in: authorIds } });

    // Build a lookup map of authors by ID
    const authorMap = authors.reduce((map, author) => {
      map[author._id] = { _id: author._id, username: author.username, email: author.email };
      return map;
    }, {});

    // Attach author info to each comment
    const commentsWithAuthors = comments.map(comment => {
      const authorInfo = comment.author_id === "Deleted User"
        ? { _id: null, username: "Deleted User", email: null }
        : authorMap[comment.author_id] || { _id: null, username: "Deleted User", email: null };

      return { ...comment.toObject(), author: authorInfo };
    });

    // Return the enriched comments
    res.json(commentsWithAuthors);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

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
  console.log('Your app is listening on port ' + PORT);
});
