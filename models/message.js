// models/message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  _id: String, // "message1", "message2", etc.
  sender_id: { type: String, required: true },   // user1, user2, etc.
  recipient_id: { type: String, required: true }, // userX receiving the message.
  content: { type: String, required: true },
  date_created: { type: String, required: true },
  is_read: { type: Boolean, default: false }, // For future inbox UI. You guys can ignore this if you don't want to use it.
  edited: { type: Boolean, default: false }, // Default false, change to true only if the message is edited. 
  date_edited: { type: String, default: null }

});

module.exports = mongoose.model("Message", MessageSchema);
