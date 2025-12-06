const User = require("../models/user");

module.exports.profile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);

        if (!user) {
            return res.redirect("/login");
        }

        res.render("users/profile", { user });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server error");
    }
};
