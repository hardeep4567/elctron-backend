import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // security
    },

    age: {
      type: Number,
    },

    avatar: {
      type: String, // Cloudinary image URL
      default: "",
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    /* ---------- ANIME FEATURES ---------- */

    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Anime",
      },
    ],

    watchHistory: [
      {
        animeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Anime",
        },
        episodeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Episode",
        },
        progress: {
          type: Number, // seconds watched
          default: 0,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    /* ---------- AUTH / VERIFICATION ---------- */

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
    },

    otpExpiresAt: {
      type: Date,
    },

    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,

    verificationToken: String,
    verificationTokenExpiresAt: Date,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
