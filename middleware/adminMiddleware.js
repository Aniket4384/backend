const jwt = require("jsonwebtoken")
const User = require("../models/user");
const redisClient = require("../config/redis");

const adminMiddleware = async (req, res, next) => {
    try {
        const { token } = req.cookies;
       

        if (!token) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET_KEY
        );

        if (!payload._id) {
            return res.status(401).json({
                message: "Invalid token"
            });
        }

        const isBlocked = await redisClient.exists(
            `token:${token}`
        );

        if (isBlocked) {
            return res.status(401).json({
                message: "Token has been invalidated"
            });
        }

        const user = await User.findById(payload._id);

        if (!user) {
            return res.status(404).json({
                message: "User does not exist"
            });
        }

        if (user.role !== "admin") {
            return res.status(403).json({
                message: "Access denied. Admin only."
            });
        }

        req.result = user;
 
        next();

    } catch (err) {
        console.log("Admin middleware error:", err.message);

        return res.status(401).json({
            message: err.message || "Invalid token"
        });
    }
};

module.exports = adminMiddleware;

module.exports = adminMiddleware