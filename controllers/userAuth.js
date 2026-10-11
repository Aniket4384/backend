const User = require("../models/user")
const validate = require("../utils/validator")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');
const redisClient = require("../config/redis");
const Submission = require("../models/submission");


const register = async (req, res) => {
    try {
        validate(req.body);

        const { firstName, emailId, password } = req.body;

        const existingUser = await User.findOne({ emailId });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists with this email"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            emailId,
            password: hashedPassword,
            role: "user"
        });

        const token = jwt.sign(
            {
                _id: user._id,
                emailId: user.emailId,
                role: user.role
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "1h"
            }
        );

        const reply = {
            _id: user._id,
            firstName: user.firstName,
            emailId: user.emailId
        };

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 60 * 60 * 1000,
            path: "/"
        });

        return res.status(201).json({
            user: reply,
            message: "Registered successfully"
        });

    } catch (err) {
        console.error("Registration error:", err);

        return res.status(400).json({
            message: err.message || "Something went wrong"
        });
    }
};

const login = async (req, res) => {
    try {
        const { emailId, password } = req.body;

        if (!emailId || !password) {
            throw new Error("Invalid credentials");
        }

        const user = await User.findOne({ emailId });

        if (!user) {
            throw new Error("Invalid credentials");
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            throw new Error("Invalid credentials");
        }

        const reply = {
            _id: user._id,
            firstName: user.firstName,
            emailId: user.emailId,
            role : user.role
        };

        const token = jwt.sign(
            {
                _id: user._id,
                emailId: user.emailId,
                role: user.role
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "1h"
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 1000
        });

        return res.status(200).json({
            user: reply,
            message: "Login successful"
        });

    } catch (err) {
        console.log("Login Error:", err.message);

        return res.status(401).json({
            message: err.message || "Invalid credentials"
        });
    }
};



const logout = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(400).json({
                message: "Already logged out"
            });
        }

        const decoded = jwt.decode(token);

        const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);

        if (remainingTime > 0) {
            await redisClient.set(
                `token:${token}`,
                "true",
                {
                    EX: remainingTime
                }
            );
        }

        res.clearCookie("token");

        return res.status(200).json({
            message: "Logout successful"
        });

    } catch (err) {
        return res.status(500).json({
            message: "Logout failed"
        });
    }
};

const adminRegister = async (req, res) => {
    try {
        validate(req.body);

        const { firstName, emailId, password } = req.body;

        const existingUser = await User.findOne({ emailId });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            emailId,
            password: hashedPassword,
            role: "admin"
        });

        return res.status(201).json({
            message: "Admin registered successfully",
            user: {
                _id: user._id,
                firstName: user.firstName,
                emailId: user.emailId,
                role: user.role
            }
        });

    } catch (err) {
        console.log("Admin registration error:", err.message);

        return res.status(400).json({
            message: err.message || "Something went wrong"
        });
    }
};

const deleteProfile = async (req, res) => {
    try {
        const userId = req.result._id;

        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await Submission.deleteMany({
            userId: userId
        });

        res.status(200).json({
            success: true,
            message: "Profile deleted successfully"
        });

    } catch (err) {
        console.error("Delete Profile Error:", err);

        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
module.exports = {register,login,logout,adminRegister,deleteProfile}
