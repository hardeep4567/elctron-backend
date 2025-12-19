import Anime from "../model/animemodel.js";
import cloudinary from "../config/cloudinary.js";
import Genre from "../model/genremodel.js";

/* ================= ADD ANIME ================= */
export const addAnime = async (req, res) => {
  try {
    const { title, description, genres } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Anime image required" });
    }

    /* ===== GENRE TRANSFORMATION ===== */
    let genreArray = [];

    if (genres) {
      if (Array.isArray(genres)) {
        genreArray = genres;
      } else if (typeof genres === "string") {
        genreArray = genres.split(",").map((id) => id.trim());
      }
    }

    /* ===== UPLOAD TO CLOUDINARY ===== */
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "anime-posters",
    });

    /* ===== CREATE ANIME ===== */
    const anime = await Anime.create({
      title,
      description,
      poster: result.secure_url,
      genres: genreArray,
    });

    res.status(201).json({
      success: true,
      message: "Anime added successfully",
      data: anime,
    });
  } catch (error) {
    console.error("Add Anime Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add anime",
    });
  }
};

/* ================= GET ALL ANIME ================= */
export const getAnime = async (req, res) => {
  try {
    const allAnime = await Anime.find()
      .populate("genres", "name")
      .select("-__v");

    if (!allAnime || allAnime.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No anime found in the database",
      });
    }

    res.status(200).json({
      success: true,
      count: allAnime.length,
      data: allAnime,
    });
  } catch (error) {
    console.error("Get Anime Error:", error);
    res.status(500).json({
      success: false,
      message: "Server failed to fetch anime list",
    });
  }
};

/* ================= GET ANIME BY ID ================= */
export const getAnimeById = async (req, res) => {
  try {
    const { id } = req.params;

    const anime = await Anime.findById(id)
      .populate("genres", "name")
      .select("-__v");

    if (!anime) {
      return res.status(404).json({
        success: false,
        message: "Anime not found",
      });
    }

    res.status(200).json({
      success: true,
      data: anime,
    });
  } catch (error) {
    console.error("Get Anime By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Invalid anime ID",
    });
  }
};



export const addEpisode = async (req, res) => {
  try {
    const { animeId, episodeNumber, title, duration } = req.body;

    if (!animeId) {
      return res.status(400).json({ message: "Anime ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Episode video required" });
    }

    const anime = await Anime.findById(animeId);
    if (!anime) {
      return res.status(404).json({ message: "Anime not found" });
    }

    /* ===== UPLOAD VIDEO TO CLOUDINARY ===== */
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video",
      folder: "anime-episodes",
    });

    anime.episodes.push({
      episodeNumber,
      title,
      videoUrl: result.secure_url, // ✅ AUTO LINK
      duration,
    });

    await anime.save();

    res.status(200).json({
      success: true,
      message: "Episode added successfully",
      data: anime,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add episode" });
  }
};



export const searchAnime = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === "") {
      return res.status(200).json({
        success: true,
        total: 0,
        data: [],
      });
    }

    const regex = new RegExp(q, "i");
    const anime = await Anime.aggregate([
      {
        $lookup: {
          from: "genres",
          localField: "genres",
          foreignField: "_id",
          as: "genres",
        },

      },
      {
        $match:{
         $or: [
            { title: { $regex: regex } },
            { "genres.name": { $regex: regex } },
          ],

        }
      }
      ,{ $limit:20 }
    ]);

    res.status(200).json({
      success: true,
      total: anime.length,
      data: anime,
    });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      success: false,
      message: "Search failed",
    });
  }
};

export const getTopRatedAnime = async (req, res) => {
  try {
     res.set("Cache-Control", "no-store");
    const anime = await Anime.find()
      .sort({ rating: -1 })   // 🔥 highest rating first
      .limit(2);             // top 20 anime

    res.status(200).json({
      success: true,
      total: anime.length,
      data: anime,
    });
    console.log(anime)
  } catch (error) {
    console.error("Top rated error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top rated anime",
    });
  }
};

