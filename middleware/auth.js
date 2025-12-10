const User = require("../models/user");

async function attachUser(req, res, next) {
    try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      req.user = user || null;
      res.locals.user = user || null; 
    } else {
      req.user = null;
      res.locals.user = null;
    }
  } catch (err) {
    console.error("attachUser error:", err);
    req.user = null;
    res.locals.user = null;
  }
  next();
}

function requireLogin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.redirect("/login");
    }
    next();
}



function requireAdmin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).send("Unauthorized: Please log in.");
    }
    next();
}

module.exports = {attachUser, requireLogin, requireAdmin,};