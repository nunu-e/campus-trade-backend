const express = require("express");
const router = express.Router();
const { protect, verified } = require("../middleware/authMiddleware");
const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getUserListings,
  searchListings,
  reserveListing,
} = require("../controllers/listingController"); // CHECK THIS LINE

router.route("/").get(getListings).post(protect, verified, createListing); // LINE 11 - This is where the error occurs

router.get("/search", searchListings);
router.get("/my-listings", protect, verified, getUserListings);
router.post("/:id/reserve", protect, verified, reserveListing);

router
  .route("/:id")
  .get(getListingById)
  .put(protect, verified, updateListing)
  .delete(protect, verified, deleteListing);

module.exports = router;
