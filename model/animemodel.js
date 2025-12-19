import mongoose from "mongoose";

const episodeSchema = new mongoose.Schema(
  {
    episodeNumber: { type: Number, required: true },
    title: { type: String },
    videoUrl: { type: String },   // future: video / stream url
    duration: { type: String },   // eg: "23 min"
  },
  { _id: false }
);

const animeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,

    genres: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Genre" }
    ],

    poster: {
      type: String,
      required: true,
    },

    rating: {
      type: Number,
      default: 0,
    },

    episodes: [episodeSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Anime", animeSchema);
