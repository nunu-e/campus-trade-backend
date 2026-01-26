// campus-trade-backend/test-controllers.js
const authController = require("./controllers/authController");
const listingController = require("./controllers/listingController");
const userController = require("./controllers/userController");
const transactionController = require("./controllers/transactionController");
const messageController = require("./controllers/messageController");
const reviewController = require("./controllers/reviewController");
const adminController = require("./controllers/adminController");
const reportController = require("./controllers/reportController");

console.log("Testing controller exports...");
console.log("=============================");

console.log("1. authController exports:", Object.keys(authController));
console.log("2. listingController exports:", Object.keys(listingController));
console.log("3. userController exports:", Object.keys(userController));
console.log(
  "4. transactionController exports:",
  Object.keys(transactionController),
);
console.log("5. messageController exports:", Object.keys(messageController));
console.log("6. reviewController exports:", Object.keys(reviewController));
console.log("7. adminController exports:", Object.keys(adminController));
console.log("8. reportController exports:", Object.keys(reportController));

// Check if createListing exists
if (!listingController.createListing) {
  console.error("❌ ERROR: listingController.createListing is undefined!");
  console.error("Check the export in controllers/listingController.js");
}
