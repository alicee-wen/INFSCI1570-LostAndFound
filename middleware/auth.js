const User = require("../models/user");

async function attachUser(req, res, next) {
    try {
    if (req.session && req.session.userId) {
      const user = await User.findById(req.session.userId);
      req.user = user || null;
      res.locals.user = user || null;  // <-- this is what EJS sees as `user`
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


// async function isAdmin(req, res, next) {
//     try {
//         if (!req.session.userId) {
//             return res.status(401).send("Unauthorized: Please log in.");
//         }

//         const user = await User.findById(req.session.userId);
//         if (!user || !user.isAdmin) {
//             return res.status(403).send("Unauthorized: Admins only.");
//         }

//         req.currentUser = user;
//         next();
//     } catch (err) {
//         console.error(err);
//         res.status(500).send("Server error.");
//     }
// }


function requireAdmin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).send("Unauthorized: Please log in.");
    }
    next();
}

module.exports = {attachUser, requireLogin, requireAdmin,};