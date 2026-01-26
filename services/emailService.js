const emailConfig = require("../config/emailConfig");
// services/emailService.js - Simplified version
class EmailService {
  async sendVerificationEmail(email, name, verificationCode) {
    // In development, just log the verification link
    const verificationLink = `${process.env.APP_URL || "http://localhost:3000"}/verify/${verificationCode}`;

    console.log("=== Email Verification (Development Mode) ===");
    console.log(`To: ${email}`);
    console.log(`Subject: Verify Your CampusTrade Account`);
    console.log(
      `Message: Dear ${name}, please verify your email by clicking: ${verificationLink}`,
    );
    console.log("=============================================");

    return {
      success: true,
      link: verificationLink,
      code: verificationCode, // Return code for manual verification
    };
  }

  async sendWelcomeEmail(email, name) {
    console.log("=== Welcome Email (Development Mode) ===");
    console.log(`To: ${email}`);
    console.log(`Subject: Welcome to CampusTrade!`);
    console.log(
      `Message: Dear ${name}, your account has been verified and you can now use CampusTrade.`,
    );
    console.log("========================================");

    return { success: true };
  }

  async sendNotificationEmail(email, subject, message) {
    console.log("=== Notification Email (Development Mode) ===");
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    console.log("=============================================");

    return { success: true };
  }
}

module.exports = new EmailService();
