// services/emailService.js
const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    if (process.env.ENABLE_EMAILS === "true") {
      if (
        !process.env.SMTP_HOST ||
        !process.env.SMTP_USER ||
        !process.env.SMTP_PASS
      ) {
        console.error("❌ SMTP credentials missing. Email disabled.");
        this.transporter = null;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
      });

      // Verify connection
      this.transporter.verify((err, success) => {
        if (err) {
          console.error("❌ Email transporter verification failed:", err);
        } else {
          console.log("✅ Email transporter ready (Brevo SMTP)");
        }
      });
    } else {
      this.transporter = null;
      console.log("⚠️ Emails disabled (ENABLE_EMAILS != true)");
    }
  }

  async sendOTPEmail(email, name, otp) {
    if (process.env.ENABLE_EMAILS !== "true") {
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
      return { success: true, devMode: true, otp };
    }

    if (!this.transporter) {
      console.error("❌ Email transporter not configured");
      return { success: false, error: "Email service not configured" };
    }

    const mailOptions = {
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "CampusTrade Email Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>Email Verification</h2>
          <p>Hello ${name},</p>
          <p>Your verification code is:</p>
          <div style="font-size: 32px; font-weight: bold; padding: 10px; background: #f0f0f0; text-align: center;">
            ${otp}
          </div>
          <p>This code expires in <strong>10 minutes</strong>.</p>
          <p>If you did not request this, please ignore this email.</p>
          <p>Best regards,<br/>CampusTrade Team</p>
        </div>
      `,
      text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(
        `✅ OTP email sent to ${email}, messageId: ${info.messageId}`,
      );
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Failed to send OTP email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendWelcomeEmail(email, name) {
    if (process.env.ENABLE_EMAILS !== "true") {
      console.log("DEV MODE - Welcome email to:", email);
      return { success: true };
    }
    const mailOptions = {
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Welcome to CampusTrade!",
      html: `<p>Hello ${name},</p><p>Thank you for joining CampusTrade!</p>`,
    };
    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendNotificationEmail(email, subject, message) {
    if (process.env.ENABLE_EMAILS !== "true") {
      console.log("DEV MODE - Notification to:", email);
      return { success: true };
    }
    const mailOptions = {
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject,
      html: `<p>${message}</p>`,
    };
    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendResetPasswordEmail(email, name, resetLink) {
    if (process.env.ENABLE_EMAILS !== "true") {
      console.log("DEV MODE - Reset link:", resetLink);
      return { success: true, link: resetLink };
    }
    const mailOptions = {
      from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Reset your CampusTrade password",
      html: `<p>Dear ${name},</p><p>Use the link below to reset your password (valid for 1 hour):</p><p><a href="${resetLink}">${resetLink}</a></p>`,
    };
    try {
      await this.transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
