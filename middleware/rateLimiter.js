const redisClient = require("../config/redis")
const submitRateLimiter = async (req, res, next) => {
    try {
        const userId = req.result._id.toString();

        const key = `submit-cooldown:${userId}`;

        const ttl = await redisClient.ttl(key);

        if (ttl > 0) {
            return res.status(429).json({
                success: false,
                message: "Please wait before submitting again",
                retryAfter: ttl
            });
        }

        await redisClient.set(key, "1", {
            EX: 10
        });

        next();

    } catch (err) {
        console.error("Rate limiter error:", err);

        return res.status(500).json({
            success: false,
            message: "Rate limiter error"
        });
    }
};


const runRateLimiter = async (req, res, next) => {
    try {
        const userId = req.result._id.toString();

        const key = `run-cooldown:${userId}`;

        const ttl = await redisClient.ttl(key);

        if (ttl > 0) {
            return res.status(429).json({
                success: false,
                message: "Please wait before running code again",
                retryAfter: ttl
            });
        }

        await redisClient.set(key, "1", {
            EX: 2
        });

        next();

    } catch (err) {
        console.error("Run rate limiter error:", err);

        return res.status(500).json({
            success: false,
            message: "Rate limiter error"
        });
    }
};


module.exports = {submitRateLimiter,runRateLimiter}