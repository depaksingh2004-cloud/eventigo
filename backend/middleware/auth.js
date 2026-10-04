import jwt from "jsonwebtoken";
import User from "../models/user.js";

// ===============================
// USER AUTHENTICATION MIDDLEWARE
// ===============================
const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    const token =
        authHeader &&
        authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.split(" ")[1]
            : null;

    if (!token) {
        return res.status(401).json({
            message: "Not authorized, no token",
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = await User.findById(decoded.id).select(
            "-password"
        );

        if (!req.user) {
            return res.status(401).json({
                message: "Not authorized, user not found",
            });
        }

        next();
    } catch (error) {
        console.error("Auth error:", error.message);

        return res.status(401).json({
            message: "Not authorized, token failed",
        });
    }
};


// ===============================
// ADMIN AUTHORIZATION MIDDLEWARE
// ===============================
const admin = (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            message: "Not authorized, user not found",
        });
    }

    // Your project uses role: "admin"
    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Not authorized, admin access required",
        });
    }

    next();
};


export { protect, admin };

export default {
    protect,
    admin,
};