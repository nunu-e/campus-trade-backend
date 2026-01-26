const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    trim: true,
    minlength: 3,
    maxlength: 100,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
    maxlength: 1000,
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: 0,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: ["Goods", "Services", "Rentals"],
  },
  subcategory: {
    type: String,
    required: [true, "Subcategory is required"],
  },
  images: [
    {
      type: String,
      required: [true, "At least one image is required"],
    },
  ],
  location: {
    type: String,
    required: [true, "Location is required"],
    enum: [
      "Main Campus",
      "Engineering Campus",
      "Science Campus",
      "Medical Campus",
      "Other",
    ],
  },
  specificLocation: {
    type: String,
    trim: true,
  },
  condition: {
    type: String,
    enum: ["New", "Like New", "Good", "Fair", "Poor"],
    required: function () {
      return this.category === "Goods";
    },
  },
  rentalPeriod: {
    start: {
      type: Date,
      required: function () {
        return this.category === "Rentals";
      },
    },
    end: {
      type: Date,
      required: function () {
        return this.category === "Rentals";
      },
    },
  },
  serviceType: {
    type: String,
    required: function () {
      return this.category === "Services";
    },
  },
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["Available", "Reserved", "Sold"],
    default: "Available",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt on save
listingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Text index for search
listingSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Listing", listingSchema);
