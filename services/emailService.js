// services/emailService.js
const nodemailer = require("nodemailer");
const { templates } = require("../config/emailConfig");

class EmailService {
  constructor() {
    if (process.env.ENABLE_EMAILS === "true") {
      // Only initialize transporter when credentials are present
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error(
          "❌ EMAIL_USER or EMAIL_PASS not provided. Email disabled.",
        );
        this.transporter = null;
        return;
      }

      // Create transporter for real email sending
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Verify connection (log once)
      this.transporter.verify((err, success) => {
        if (err) {
          console.error(
            "❌ Email transporter verification failed:",
            err.message || err,
          );
        } else {
          console.log("✅ Email transporter ready to send messages");
        }
      });
    }
  }

  async sendVerificationEmail(email, name, verificationCode) {
    try {
      const verificationLink = `${process.env.APP_URL || "http://localhost:3000"}/verify/${verificationCode}`;

      if (process.env.ENABLE_EMAILS !== "true") {
        console.log("DEV MODE - Verification link:", verificationLink);
        return {
          success: true,
          link: verificationLink,
          code: verificationCode,
        };
      }

      const mailOptions = {
        from: `"CampusTrade" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: templates.verification.subject,
        html: `<p>${templates.verification.text(name, verificationLink)}</p>`,
      };

      await this.transporter.sendMail(mailOptions);
      console.log("✅ Verification email sent to:", email);

      return { success: true, link: verificationLink, code: verificationCode };
    } catch (error) {
      console.error("❌ Failed to send verification email:", error.message);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(email, name) {
    try {
      if (process.env.ENABLE_EMAILS !== "true") {
        console.log("DEV MODE - Welcome email to:", email);
        return { success: true };
      }

      const mailOptions = {
        from: `"CampusTrade" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: templates.welcome.subject,
        html: `<p>${templates.welcome.text(name)}</p>`,
      };

      await this.transporter.sendMail(mailOptions);
      console.log("✅ Welcome email sent to:", email);
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to send welcome email:", error.message);
      return { success: false, error: error.message };
    }
  }

  async sendNotificationEmail(email, subject, message) {
    try {
      if (process.env.ENABLE_EMAILS !== "true") {
        console.log("DEV MODE - Notification email to:", email);
        return { success: true };
      }

      const mailOptions = {
        from: `"CampusTrade" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: `<p>${message}</p>`,
      };

      await this.transporter.sendMail(mailOptions);
      console.log("✅ Notification email sent to:", email);
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to send notification email:", error.message);
      return { success: false, error: error.message };
    }
  }

  async sendResetPasswordEmail(email, name, resetLink) {
    try {
      if (process.env.ENABLE_EMAILS !== "true") {
        console.log("DEV MODE - Reset link:", resetLink);
        return { success: true, link: resetLink };
      }

      if (!this.transporter) {
        console.error("Email transporter not configured");
        return { success: false, error: "transporter not configured" };
      }

      const mailOptions = {
        from: `"CampusTrade" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Reset your CampusTrade password",
        html: `<p>Dear ${name},</p><p>Use the link below to reset your password (valid for 1 hour):</p><p><a href="${resetLink}">${resetLink}</a></p>`,
      };

      await this.transporter.sendMail(mailOptions);
      console.log("✅ Reset password email sent to:", email);
      return { success: true };
    } catch (error) {
      console.error("❌ Failed to send reset email:", error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
