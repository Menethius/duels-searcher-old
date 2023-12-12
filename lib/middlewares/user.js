const { User } = require("../models");

const userMiddleware = async (req, res, next) => {
    if (!req.headers.authorization || !(req.headers.authorization.split(" ").length === 2)) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = req.headers.authorization.split(" ")[1];
    const u = await User.findByJWT(token);
    if (!u) return res.status(401).json({ message: "Unauthorized" });
    req.user = u;
    next();
}

module.exports = userMiddleware;