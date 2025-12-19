import mongoose from "mongoose";

const episodeSchema = new mongoose.Schema(
  {
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Anime",
      required: true,
    },

    episodeNumber: {
      type: Number,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    videoUrl: {
      type: String, // Cloudinary video URL
      required: true,
    },

    duration: {
      type: Number, // seconds
      required: true,
    },
  },
  { timestamps: true }
);

/* one anime → unique episode number */
episodeSchema.index({ animeId: 1, episodeNumber: 1 }, { unique: true });

export default mongoose.model("Episode", episodeSchema);
