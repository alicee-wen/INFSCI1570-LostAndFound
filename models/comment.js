const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  _id: String, // Keeps my "comment1", "comment2" id format, rather than letting Mongo run wild with making its own IDs.
  author_id: { type: String, required: true }, // Foreign key to user. This should be a user's _id
  content: { type: String, required: true },
  date_created: { type: String, required: true },

  post_id: { type: String, required: true }, // Stores the _id of the post that this comment is under, REGARDLESS of if the comment is made directly on that post or is deep in a comment chain.

  // This section is for the thing the comment is replying to.
  parent_type: {
    type: String,
    enum: ['post', 'comment'], // Tells the system whether this comment is replying to another comment or to a post.
    required: true
  },
  parent_id: {
    type: String, //this should be the _id of the post or comment that is being replied to.
    required: true
  }
});

module.exports = mongoose.model('Comment', CommentSchema);
