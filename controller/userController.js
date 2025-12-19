import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../model/usemodel.js";
import Anime from "../model/animemodel.js";
import Episode from "../model/episodemodel.js";

/* =====================================================
   SIGNUP → ACCOUNT CREATE + TOKEN (UNVERIFIED)
===================================================== */
export const userSignup = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullname,
      email,
      password: hashedPassword,
      isVerified: false, // 👈 not verified yet
    });

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        isVerified: false,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        isVerified: false,
      },
    });
    console.log(token)
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =====================================================
   LOGIN → PASSWORD CHECK + OTP GENERATE
===================================================== */
export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔐 2. Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // 🔢 3. Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    user.otp = otp;
    user.otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    await user.save();

    // 📤 4. Send response (NO TOKEN HERE)
    res.status(200).json({
      success: true,
      message: "OTP sent to email",
      email: user.email,
    });

    // 📧 (Optional) send OTP via email here
  } catch (error) {
    console.error("🔥 Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/* =====================================================
   SEND OTP EMAIL
===================================================== */
export const sendOtpEmail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.otp) {
      return res.status(404).json({ message: "OTP not found" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Anime App OTP Verification",
      html: `<h2>Your OTP is <b>${user.otp}</b></h2>`,
    });

    res.status(200).json({ message: "OTP email sent" });
  } catch (error) {
    console.error("OTP email error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Debugging ke liye console log
    console.log(`Verifying OTP for ${email}: Received ${otp}`);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Dono ko String mein convert karke compare karein
    const isOtpValid = String(user.otp) === String(otp);
    const isNotExpired = user.otpExpiresAt && user.otpExpiresAt > Date.now();

    if (!isOtpValid || !isNotExpired) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // ✅ Clear OTP
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    // 🔐 GENERATE TOKEN
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "OTP Verified Successfully",
      token, // Frontend ko token bhejna zaroori hai
    });
  } catch (error) {
    console.error("🔥 Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export const getMyDetail = (req, res) => {
  try {
    console.log("📥 req.user:", req.user);

    // 🔴 EXTRA SAFETY (VERY IMPORTANT)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found in request",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        fullname: req.user.fullname,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("🔥 getMyDetail ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findById(req.user._id).select("+password");

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong current password" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const users = await User.find().select(
      "-password -otp -otpExpiresAt -resetPasswordToken -resetPasswordExpiresAt"
    );

    res.status(200).json({
      success: true,
      total: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        name: user.fullname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// POST /user/watch-history
export const addToMyList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { animeId } = req.body;

    if (!animeId) {
      return res.status(400).json({
        success: false,
        message: "Anime ID required",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $addToSet: { favorites: animeId }, // ✅ duplicate avoid
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Anime added to My List",
      favorites: user.favorites,
    });
  } catch (err) {
    console.error("Add to My List error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// GET /user/watch-history
// GET /user/get-list
export const getWatchlist = async (req, res) => {
  try {
    // 1. User ko dhundo aur favorites ko explicitly Anime model se populate karo
    const user = await User.findById(req.user.id).populate({
      path: "favorites",
      model: "Anime", // 👈 Agar ye nahi likha toh data empty/ID hi rahega
      select: "title poster description genres" // Jo fields chahiye
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    console.log("✅ Populated Favorites:", user.favorites);

    // 2. Response bhejo
    res.status(200).json({
      success: true,
      data: user.favorites || [] 
    });

  } catch (error) {
    console.error("🔥 Get Watchlist Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};