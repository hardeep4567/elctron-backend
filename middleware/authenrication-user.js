import jwt from "jsonwebtoken";
import User from "../model/usemodel.js";

export const authMiddleware = async (req, res, next) => {
  try {
    console.log("AUTH HEADER:", req.headers.authorization);

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing",
      });
    }

    const token = authHeader.split(" ")[1];
    console.log("🔑 TOKEN:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🧩 DECODED:", decoded);

    // ✅ ✅ ✅ FIX HERE
    const user = await User.findById(decoded.userId).select("-password");
    console.log("👤 USER FROM DB:", user);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user; // now available in controllers
    next();
  } catch (error) {
    console.error("🔥 AUTH MIDDLEWARE ERROR:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
