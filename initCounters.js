require('dotenv').config();
const mongoose = require('mongoose');
const Counter = require('./models/counter');
const User = require('./models/user');
const Post = require('./models/post');
const Comment = require('./models/comment');

async function initializeCounters() {
  try {
    const mongoUri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.HOST}/${process.env.DATABASE}?retryWrites=true&w=majority`;
    await mongoose.connect(mongoUri);

    const lastUser = await User.find().sort({ _id: -1 }).limit(1);
    const lastPost = await Post.find().sort({ _id: -1 }).limit(1);
    const lastComment = await Comment.find().sort({ _id: -1 }).limit(1);

    const userSeq = lastUser.length ? parseInt(lastUser[0]._id.replace('user', '')) : 0;
    const postSeq = lastPost.length ? parseInt(lastPost[0]._id.replace('post', '')) : 0;
    const commentSeq = lastComment.length ? parseInt(lastComment[0]._id.replace('comment', '')) : 0;

    await Counter.findByIdAndUpdate('user', { seq: userSeq }, { upsert: true });
    await Counter.findByIdAndUpdate('post', { seq: postSeq }, { upsert: true });

    console.log(`Counters initialized: user=${userSeq}, post=${postSeq}`);
  } catch (err) {
    console.error('Error initializing counters:', err);
  } finally {
    mongoose.disconnect();
  }
}

initializeCounters();


//This is a script that can be run to set the counters to their appropriate numbers. 
//You guys shouldn't need to worry about this. 
//But just in case, you can run it with this command in the terminal: 
//node initCounters.js
