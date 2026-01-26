// campus-trade-backend/routes/listingRoutes.js
const express = require("express");
const router = express.Router();
const { protect, verified } = require("../middleware/authMiddleware");
const listingController = require("../controllers/listingController");

// Make sure all these functions exist in listingController
router
  .route("/")
  .get(listingController.getListings) // Must exist
  .post(protect, verified, listingController.createListing); // This is line 15 with error

router.get("/search", listingController.searchListings);
router.get(
  "/my-listings",
  protect,
  verified,
  listingController.getUserListings,
);
router.post(
  "/:id/reserve",
  protect,
  verified,
  listingController.reserveListing,
);

router
  .route("/:id")
  .get(listingController.getListingById)
  .put(protect, verified, listingController.updateListing)
  .delete(protect, verified, listingController.deleteListing);

module.exports = router;
