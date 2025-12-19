import Genre from "../model/genremodel.js";

export const createGenre = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Genre name is required" });
    }

    const existingGenre = await Genre.findOne({ name });
    if (existingGenre) {
      return res.status(409).json({ message: "Genre already exists" });
    }
    const newGenre = await Genre.create({ name });
    res.status(201).json({
      success: true,
      data: newGenre,
      message: "Genre created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create genre" });
  }
};

export const getGenere = async (req, res) => {
  try {
    const genres = await Genre.find().select("-__v");

    res.status(200).json({
      success: true,
      count: genres.length,
      data: genres,
    });
  } catch (error) {
    console.error("Get Genre Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch genres",
    });
  }
};
