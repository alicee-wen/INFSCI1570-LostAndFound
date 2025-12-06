const bcrypt = require("bcrypt");
const User = require("../models/user");
const Counter = require("../models/counter");

// Helper: generate sequential user IDs
async function generateUserId() {
    const counter = await Counter.findByIdAndUpdate(
        "user",
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return `user${counter.seq}`;
}

module.exports.showSignup = (req, res) => {
    res.render("auth/signup");
};

module.exports.showLogin = (req, res) => {
    res.render("auth/login");
};

module.exports.signup = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).send("All fields are required.");
        }

        const password_hash = await bcrypt.hash(password, 12);
        const _id = await generateUserId(); // custom ID generator

        const user = new User({
            _id,
            username,
            email,
            password_hash,
            date_created: new Date().toISOString()
        });

        await user.save();

        req.session.userId = user._id;
        res.redirect("/users/profile");
    } catch (err) {
        console.log(err);
        res.status(400).send("Signup failed. Email or username may already exist.");
    }
};

module.exports.login = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("Invalid email or password.");

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).send("Invalid email or password.");

    req.session.userId = user._id;
    res.redirect("/users/profile");
};

module.exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
};
