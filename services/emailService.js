// services/emailService.js
const axios = require("axios");

class EmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.senderEmail = process.env.SENDER_EMAIL;
    this.senderName = process.env.SENDER_NAME || "CampusTrade";
    this.enabled = process.env.ENABLE_EMAILS === "true";

    if (this.enabled && !this.apiKey) {
      console.error("❌ BREVO_API_KEY missing. Email disabled.");
      this.enabled = false;
    }
    if (this.enabled) {
      console.log("✅ Brevo HTTP API ready (HTTPS)");
    } else {
      console.log(
        "⚠️ Emails disabled (ENABLE_EMAILS != true or missing API key)",
      );
    }
  }

  async _sendEmail(toEmail, toName, subject, htmlContent, textContent) {
    if (!this.enabled) {
      console.log(`[DEV MODE] Would send email to ${toEmail}: ${subject}`);
      return { success: true, devMode: true };
    }

    const url = "https://api.brevo.com/v3/smtp/email";
    const payload = {
      sender: { email: this.senderEmail, name: this.senderName },
      to: [{ email: toEmail, name: toName }],
      subject: subject,
      htmlContent: htmlContent,
      textContent: textContent,
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 10000,
      });
      console.log(
        `✅ Email sent to ${toEmail}, messageId: ${response.data.messageId}`,
      );
      return { success: true, messageId: response.data.messageId };
    } catch (error) {
      console.error(
        "❌ Brevo API error:",
        error.response?.data || error.message,
      );
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async sendOTPEmail(email, name, otp) {
    const subject = "CampusTrade Email Verification Code";
    const htmlContent = `
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
    `;
    const textContent = `Your verification code is: ${otp}. It expires in 10 minutes.`;
    return this._sendEmail(email, name, subject, htmlContent, textContent);
  }

  async sendWelcomeEmail(email, name) {
    const subject = "Welcome to CampusTrade!";
    const htmlContent = `<p>Hello ${name},</p><p>Thank you for joining CampusTrade!</p>`;
    const textContent = `Hello ${name},\n\nThank you for joining CampusTrade!`;
    return this._sendEmail(email, name, subject, htmlContent, textContent);
  }

  async sendNotificationEmail(email, subject, message) {
    const htmlContent = `<p>${message}</p>`;
    const textContent = message;
    return this._sendEmail(email, "", subject, htmlContent, textContent);
  }

  async sendResetPasswordEmail(email, name, resetLink) {
    const subject = "Reset your CampusTrade password";
    const htmlContent = `<p>Dear ${name},</p><p>Use the link below to reset your password (valid for 1 hour):</p><p><a href="${resetLink}">${resetLink}</a></p>`;
    const textContent = `Dear ${name},\n\nUse the following link to reset your password (valid for 1 hour):\n${resetLink}`;
    return this._sendEmail(email, name, subject, htmlContent, textContent);
  }
}

module.exports = new EmailService();
