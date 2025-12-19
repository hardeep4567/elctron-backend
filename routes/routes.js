import express from "express";

// =============== CONTROLLER IMPORTS ===============
// User Controllers
import {
  addToMyList,
  changePassword,
  getAllUsers,
  getMyDetail,
  getWatchlist,
  sendOtpEmail,
  userLogin,
  userSignup,
  verifyOtp,
} from "../controller/userController.js";

// Product Controllers
import {
  getCategory,
  DeleteProduct,
  productdata,
  update,
  searchProduct,
  getproducts,
  getProductsByCategoryId,
} from "../controller/ProductController.js";

// Anime Controller
import { addAnime, addEpisode, getAnime, getAnimeById, getTopRatedAnime, searchAnime } from "../controller/animeController.js";

// =============== MIDDLEWARE IMPORTS ===============
import upload from "../middleware/upload-multer.js"; // Multer for file uploads
import { authMiddleware } from "../middleware/authenrication-user.js"; // Authentication/Authorization check
import { createGenre, getGenere } from "../controller/genrecontroller.js";
import { adminOnly } from "../middleware/adminOnly.js";

const router = express.Router();

// -------------------------------------------------------------------

/* ================= 👤 USER AUTH ================= */
router.post("/signup", userSignup);
router.post("/login", userLogin);
router.post("/send-otp", sendOtpEmail);
router.post("/verify-otp", verifyOtp);

// -------------------------------------------------------------------

/* ================= ⚙️ USER (Requires Auth) ================= */
router.post("/change-password", authMiddleware, changePassword);
router.get("/users", authMiddleware, getAllUsers);

// -------------------------------------------------------------------

/* ================= 🛍️ PRODUCT ================= */
router.post("/product", productdata);
router.get("/product", getproducts);
router.delete("/product/:id", DeleteProduct);
router.patch("/product/:id", update);
router.get("/product-category", getCategory);
router.get("/product-category/:id", getProductsByCategoryId);
router.get("/product-search", searchProduct);

// -------------------------------------------------------------------

/* ================= 🖼️ ANIME ================= */
router.post(
  "/add-anime",
   authMiddleware,
   adminOnly, 
  upload.single("poster"),
  addAnime 
);
router.post("/add-episode",upload.single("video"),addEpisode)
router.get("/getanime", getAnime);
router.post("/create-genre",createGenre)

router.get("/getanime/:id", getAnimeById);
router.get("/getgenre", getGenere);
router.get("/me",authMiddleware,getMyDetail);
router.get("/search-anime",searchAnime)
router.get("/top-rated",getTopRatedAnime)
router.post("/add-watchlist",authMiddleware,addToMyList)
router.get("/get-list",authMiddleware,getWatchlist)









// -------------------------------------------------------------------

export default router;