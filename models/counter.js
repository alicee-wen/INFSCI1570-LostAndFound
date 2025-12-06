const mongoose = require('mongoose');

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },  // sequence name, e.g., "user" or "post"
  seq: { type: Number, required: true }   // last used number
});

module.exports = mongoose.model('Counter', CounterSchema);


/* 
This model exists solely to ensure that the IDs for the other 2 models do not repeat. 
That way, a new user can't inherit a deleted user's id. 
If a new user was able to inherit an old user's id, that would allow them to inherit that deleted user's posts.
*/