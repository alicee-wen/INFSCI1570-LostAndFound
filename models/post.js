const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  _id: String, // Keeps my "post1", "post2" id format, rather than letting Mongo run wild with making its own IDs.
  author_id: { type: String, required: true }, // This is a foreign key. It should match a user's id.
  content: { type: String, required: true },
  date_created: { type: String, required: true }
});

module.exports = mongoose.model('Post', PostSchema);
