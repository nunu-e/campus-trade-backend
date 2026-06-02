const Listing = require("../models/Listing");
const Transaction = require("../models/Transaction");
const User = require("../models/User");

const mapFrontendCategory = (category) => {
  const map = {
    Sell: "Goods",
    Rent: "Rentals",
    Service: "Services",
  };
  return map[category] || category;
};

// @desc    Create a new listing
// @route   POST /api/listings
// @access  Private/Verified
const createListing = async (req, res) => {
  try {
    console.log("Creating listing with data:", req.body);
    console.log("User ID:", req.user._id);

    let {
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

    // --- Category mapping (frontend -> backend) ---
    const normalizedCategory = mapFrontendCategory(category);
    if (!["Goods", "Services", "Rentals"].includes(normalizedCategory)) {
      return res.status(400).json({
        message: "Invalid category. Allowed: 'Sell', 'Rent', 'Service'.",
      });
    }

    // Validate required fields
    if (!title || !description || !price || !subcategory || !location) {
      return res.status(400).json({
        message:
          "Missing required fields: title, description, price, subcategory, location",
      });
    }

    if (!images || images.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    // Build listing object
    const listingData = {
      title,
      description,
      price: parseFloat(price),
      category: normalizedCategory,
      subcategory,
      images: Array.isArray(images) ? images : [images],
      location,
      specificLocation: specificLocation || undefined,
      sellerId: req.user._id,
    };

    // Add category-specific fields
    if (normalizedCategory === "Goods") {
      if (!condition) {
        return res
          .status(400)
          .json({ message: "Condition is required for goods" });
      }
      listingData.condition = condition;
    } else if (normalizedCategory === "Services") {
      if (!serviceType) {
        return res
          .status(400)
          .json({ message: "Service type is required for services" });
      }
      listingData.serviceType = serviceType;
    } else if (normalizedCategory === "Rentals") {
      if (!rentalPeriod || !rentalPeriod.duration || !rentalPeriod.unit) {
        return res
          .status(400)
          .json({ message: "Rental duration and unit are required" });
      }
      if (!["Day", "Week", "Month"].includes(rentalPeriod.unit)) {
        return res
          .status(400)
          .json({ message: "Rental unit must be Day, Week, or Month" });
      }
      listingData.rentalPeriod = {
        duration: parseInt(rentalPeriod.duration),
        unit: rentalPeriod.unit,
      };
    }

    const listing = await Listing.create(listingData);
    console.log("Listing created successfully:", listing._id);
    res.status(201).json(listing);
  } catch (error) {
    console.error("Error creating listing:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ message: "Validation error", errors: messages });
    }
    res.status(500).json({
      message: "Server error creating listing",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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
    res.status(500).json({ message: "Server error fetching listings" });
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
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.json(listing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error fetching listing" });
  }
};

// @desc    Update listing
// @route   PUT /api/listings/:id
// @access  Private/Verified
const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this listing" });
    }
    if (listing.status !== "Available") {
      return res
        .status(400)
        .json({ message: "Cannot update a reserved or sold listing" });
    }

    let updateData = { ...req.body };
    // Normalize category if provided
    if (updateData.category) {
      updateData.category = mapFrontendCategory(updateData.category);
    }
    // Handle rentalPeriod if category is Rentals
    if (updateData.rentalPeriod && listing.category === "Rentals") {
      if (!updateData.rentalPeriod.duration || !updateData.rentalPeriod.unit) {
        return res
          .status(400)
          .json({ message: "Rental duration and unit required" });
      }
      updateData.rentalPeriod = {
        duration: parseInt(updateData.rentalPeriod.duration),
        unit: updateData.rentalPeriod.unit,
      };
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );
    res.json(updatedListing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error updating listing" });
  }
};

// @desc    Delete listing
// @route   DELETE /api/listings/:id
// @access  Private/Verified
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.sellerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this listing" });
    }
    const activeTransaction = await Transaction.findOne({
      listingId: listing._id,
      status: { $in: ["Initiated", "Reserved"] },
    });
    if (activeTransaction) {
      return res
        .status(400)
        .json({ message: "Cannot delete listing with active transactions" });
    }
    await listing.deleteOne();
    res.json({ message: "Listing removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error deleting listing" });
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
    res.status(500).json({ message: "Server error fetching user listings" });
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
    if (q) query.$text = { $search: q };
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
    res.status(500).json({ message: "Server error searching listings" });
  }
};

// @desc    Reserve a listing
// @route   POST /api/listings/:id/reserve
// @access  Private/Verified
const reserveListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.status !== "Available")
      return res.status(400).json({ message: "Listing is not available" });
    if (listing.sellerId.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "Cannot reserve your own listing" });
    }
    const transaction = await Transaction.create({
      buyerId: req.user._id,
      sellerId: listing.sellerId,
      listingId: listing._id,
      amount: listing.price,
      status: "Initiated",
    });
    listing.status = "Reserved";
    await listing.save();
    res.json({
      message: "Listing reserved successfully",
      transaction,
      listing,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error reserving listing" });
  }
};

module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getUserListings,
  searchListings,
  reserveListing,
};
