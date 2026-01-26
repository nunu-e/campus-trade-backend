const Listing = require("../models/Listing");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

// @desc    Create a new listing
// @route   POST /api/listings
// @access  Private/Verified
const createListing = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      category,
      subcategory,
      images,
      location,
      specificLocation,
      condition,
      rentalPeriod,
      serviceType,
    } = req.body;

    const listing = await Listing.create({
      title,
      description,
      price,
      category,
      subcategory,
      images,
      location,
      specificLocation,
      condition,
      rentalPeriod,
      serviceType,
      sellerId: req.user._id,
    });

    res.status(201).json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get all listings
// @route   GET /api/listings
// @access  Public
const getListings = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      location,
      status = "Available",
      page = 1,
      limit = 20,
      sort = "-createdAt",
    } = req.query;

    let query = { status };

    // Apply filters
    if (category) query.category = category;
    if (location) query.location = location;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const listings = await Listing.find(query)
      .populate("sellerId", "name email rating")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Listing.countDocuments(query);

    res.json({
      listings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single listing
// @route   GET /api/listings/:id
// @access  Public
const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      "sellerId",
      "name email phoneNumber department rating totalReviews",
    );

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update listing
// @route   PUT /api/listings/:id
// @access  Private/Verified
const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Check ownership
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this listing" });
    }

    // Cannot update if reserved or sold
    if (listing.status !== "Available") {
      return res
        .status(400)
        .json({ message: "Cannot update a reserved or sold listing" });
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    res.json(updatedListing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete listing
// @route   DELETE /api/listings/:id
// @access  Private/Verified
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    // Check ownership
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this listing" });
    }

    // Check if there are active transactions
    const activeTransaction = await Transaction.findOne({
      listingId: listing._id,
      status: { $in: ["Initiated", "Reserved"] },
    });

    if (activeTransaction) {
      return res.status(400).json({
        message: "Cannot delete listing with active transactions",
      });
    }

    await listing.remove();
    res.json({ message: "Listing removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user's listings
// @route   GET /api/listings/my-listings
// @access  Private/Verified
const getUserListings = async (req, res) => {
  try {
    const listings = await Listing.find({ sellerId: req.user._id }).sort(
      "-createdAt",
    );

    res.json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Search listings
// @route   GET /api/listings/search
// @access  Public
const searchListings = async (req, res) => {
  try {
    const {
      q,
      category,
      location,
      minPrice,
      maxPrice,
      sort = "-createdAt",
    } = req.query;

    let query = { status: "Available" };

    if (q) {
      query.$text = { $search: q };
    }
    if (category) query.category = category;
    if (location) query.location = location;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const listings = await Listing.find(query)
      .populate("sellerId", "name rating")
      .sort(sort)
      .limit(50);

    res.json(listings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Reserve a listing
// @route   POST /api/listings/:id/reserve
// @access  Private/Verified
const reserveListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.status !== "Available") {
      return res.status(400).json({ message: "Listing is not available" });
    }

    if (listing.sellerId.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot reserve your own listing" });
    }

    // Update listing status
    listing.status = "Reserved";
    await listing.save();

    // Create transaction record
    const transaction = await Transaction.create({
      buyerId: req.user._id,
      sellerId: listing.sellerId,
      listingId: listing._id,
      amount: listing.price,
      status: "Reserved",
    });

    res.json({
      message: "Listing reserved successfully",
      transaction,
      listing,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// campus-trade-backend/controllers/listingController.js

// Add this at the END of the file:
module.exports = {
  createListing, // MUST be exported
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getUserListings,
  searchListings,
  reserveListing,
};
