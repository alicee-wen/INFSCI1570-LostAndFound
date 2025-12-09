const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  _id: String, // Keeps my "user1", "user2" id format, rather than letting Mongo run wild with making its own IDs.
  username: { type: String, required: true },
  email: { type: String, required: true },
  password_hash: { type: String, required: true },
  date_created: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },

  isAdmin: { type: Boolean, default: false },
});

module.exports = mongoose.model('User', UserSchema);
