const User = require("../models/user");
const Post = require("../models/post");
const bcrypt = require("bcrypt"); 

module.exports.profile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        const posts = await Post.find({ author_id: req.session.userId }).sort({ date_created: -1 });
        if (!user) {
            return res.redirect("/login");
        }

        res.render("users/profile", { user, posts, });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
};



module.exports.profile = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect("/login");

    const user = await User.findById(req.session.userId);
    const posts = await Post.find({ author_id: req.session.userId }).sort({date_created: -1,});

    res.render("users/profile", { user, posts });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading profile");
  }
};

module.exports.editProfileForm = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect("/login");

    const user = await User.findById(req.session.userId);
    res.render("users/editProfile", { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading edit profile form");
  }
};

module.exports.editProfileSubmit = async (req, res) => {
  try {
    if (!req.session.userId) return res.redirect("/login");

    const { username, email, password } = req.body;
    const user = await User.findById(req.session.userId);

    user.username = username;
    user.email = email;

    if (password && password.trim() !== "") {
      user.password_hash = await bcrypt.hash(password, 12);
    }

    await user.save();
    res.redirect("/users/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating profile");
  }
};
