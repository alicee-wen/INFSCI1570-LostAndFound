// routes/commentRoutes.js
const express = require("express");
const router = express.Router();
const Comment = require("../models/comment");
const User = require("../models/user");
const Post = require("../models/post");
const Counter = require("../models/counter");

// GET /comments/:id - Get a specific comment with author info
router.get("/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    // Fetch author information
    let author = { username: "[deleted]", email: "[deleted]" };
    if (comment.author_id) {
      const user = await User.findById(comment.author_id, "username email");
      if (user) {
        author = { username: user.username, email: user.email };
      }
    }

    res.json({
      _id: comment._id,
      author_id: comment.author_id,
      content: comment.content,
      date_created: comment.date_created,
      post_id: comment.post_id,
      parent_type: comment.parent_type,
      parent_id: comment.parent_id,
      author
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error loading comment." });
  }
});

// GET /comments/:id/replies - Get comment tree (descendants)
router.get("/:id/replies", async (req, res) => {
  try {
    const rootComment = await Comment.findById(req.params.id);
    
    if (!rootComment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    // Build the comment tree starting from direct children
    const commentTree = await buildCommentTree(req.params.id);

    res.json(commentTree);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error loading comment replies." });
  }
});

// POST /comments - Create a new comment
router.post("/", async (req, res) => {
  try {
    const { author_id, content, parent_type, parent_id } = req.body;

    // Validate required fields
    if (!author_id || !content || !parent_type || !parent_id) {
      return res.status(400).json({ 
        error: "author_id, content, parent_type, and parent_id are required." 
      });
    }

    // Validate parent_type
    if (!["post", "comment"].includes(parent_type)) {
      return res.status(400).json({ 
        error: "parent_type must be 'post' or 'comment'." 
      });
    }

    // Determine the post_id
    let post_id;
    if (parent_type === "post") {
      // Verify the post exists
      const post = await Post.findById(parent_id);
      if (!post) {
        return res.status(404).json({ error: "Parent post not found." });
      }
      post_id = parent_id;
    } else {
      // parent_type is "comment"
      const parentComment = await Comment.findById(parent_id);
      if (!parentComment) {
        return res.status(404).json({ error: "Parent comment not found." });
      }
      post_id = parentComment.post_id;
    }

    // Verify author exists
    const author = await User.findById(author_id);
    if (!author) {
      return res.status(404).json({ error: "Author not found." });
    }

    // Generate new comment ID
    const _id = await generateCommentId();

    // Create the comment
    const newComment = new Comment({
      _id,
      author_id,
      content,
      date_created: new Date().toISOString(),
      post_id,
      parent_type,
      parent_id
    });

    await newComment.save();

    res.status(201).json(newComment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating comment." });
  }
});

// PUT /comments/:id - Update comment content
router.put("/:id", async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required." });
    }

    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    // Only update the content field
    comment.content = content;
    await comment.save();

    res.json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating comment." });
  }
});

// DELETE /comments/:id - Soft delete a comment
router.delete("/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: "Comment not found." });
    }

    // Soft delete: remove content and author_id, but keep the comment structure
    comment.content = "[deleted]";
    comment.author_id = null;
    await comment.save();

    res.json({ 
      message: "Comment soft-deleted successfully.",
      comment
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error deleting comment." });
  }
});

// GET /posts/:id/comments - Get all comments under a specific post
router.get("/posts/:id/comments", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    // Find all comments that belong to this post
    const comments = await Comment.find({ post_id: req.params.id });

    // Enrich each comment with author info
    const enrichedComments = await Promise.all(
      comments.map(async (comment) => {
        let author = { username: "[deleted]", email: "[deleted]" };
        if (comment.author_id) {
          const user = await User.findById(comment.author_id, "username email");
          if (user) {
            author = { username: user.username, email: user.email };
          }
        }
        return {
          _id: comment._id,
          author_id: comment.author_id,
          content: comment.content,
          date_created: comment.date_created,
          post_id: comment.post_id,
          parent_type: comment.parent_type,
          parent_id: comment.parent_id,
          author
        };
      })
    );

    res.json(enrichedComments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error loading post comments." });
  }
});

module.exports = router;

// Helper functions

// Generate unique comment ID using counter
async function generateCommentId() {
  const counter = await Counter.findByIdAndUpdate(
    "comment",
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `comment${counter.seq}`;
}

// Recursively build comment tree
async function buildCommentTree(parentId) {
  // Find all direct children of this comment
  const children = await Comment.find({ 
    parent_type: "comment", 
    parent_id: parentId 
  });

  // Recursively get children for each child comment
  const enrichedChildren = await Promise.all(
    children.map(async (child) => {
      // Get author info
      let author = { username: "[deleted]", email: "[deleted]" };
      if (child.author_id) {
        const user = await User.findById(child.author_id, "username email");
        if (user) {
          author = { username: user.username, email: user.email };
        }
      }

      // Get this child's replies
      const replies = await buildCommentTree(child._id);

      return {
        _id: child._id,
        author_id: child.author_id,
        content: child.content,
        date_created: child.date_created,
        post_id: child.post_id,
        parent_type: child.parent_type,
        parent_id: child.parent_id,
        author,
        replies: replies.length > 0 ? replies : undefined
      };
    })
  );

  return enrichedChildren;
}
