const { body } = require("express-validator");

const registerValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email")
    .custom((value) => {
      if (!value.endsWith("@aau.edu.et")) {
        throw new Error("Please use your AAU email address (@aau.edu.et)");
      }
      return true;
    }),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
    .withMessage("Password must contain at least one letter and one number"),

  body("department").trim().notEmpty().withMessage("Department is required"),

  body("studentID").trim().notEmpty().withMessage("Student ID is required"),
];

const loginValidator = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email"),

  body("password").notEmpty().withMessage("Password is required"),
];

const listingValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 1000 })
    .withMessage("Description cannot exceed 1000 characters"),

  body("price")
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn(["Goods", "Services", "Rentals"])
    .withMessage("Invalid category"),

  body("subcategory").trim().notEmpty().withMessage("Subcategory is required"),

  body("location")
    .notEmpty()
    .withMessage("Location is required")
    .isIn([
      "Main Campus",
      "Engineering Campus",
      "Science Campus",
      "Medical Campus",
      "Other",
    ])
    .withMessage("Invalid campus location"),

  body("condition")
    .if(body("category").equals("Goods"))
    .notEmpty()
    .withMessage("Condition is required for goods")
    .isIn(["New", "Like New", "Good", "Fair", "Poor"])
    .withMessage("Invalid condition"),

  body("serviceType")
    .if(body("category").equals("Services"))
    .notEmpty()
    .withMessage("Service type is required for services"),

  body("rentalPeriod.start")
    .if(body("category").equals("Rentals"))
    .notEmpty()
    .withMessage("Rental start date is required"),

  body("rentalPeriod.end")
    .if(body("category").equals("Rentals"))
    .notEmpty()
    .withMessage("Rental end date is required"),
];

const messageValidator = [
  body("receiverId").notEmpty().withMessage("Receiver ID is required"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Message content is required")
    .isLength({ max: 1000 })
    .withMessage("Message cannot exceed 1000 characters"),
];

const reviewValidator = [
  body("rating")
    .notEmpty()
    .withMessage("Rating is required")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("transactionId").notEmpty().withMessage("Transaction ID is required"),

  body("type")
    .notEmpty()
    .withMessage("Review type is required")
    .isIn(["BuyerToSeller", "SellerToBuyer"])
    .withMessage("Invalid review type"),
];

module.exports = {
  registerValidator,
  loginValidator,
  listingValidator,
  messageValidator,
  reviewValidator,
};
