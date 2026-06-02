// services/emailService.js
const Brevo = require("@getbrevo/brevo");

let apiInstance = null;

const initBrevo = () => {
  if (!process.env.BREVO_API_KEY) {
    console.error("❌ BREVO_API_KEY not set. Email sending disabled.");
    return null;
  }
  const defaultClient = Brevo.ApiClient.instance;
  const apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = process.env.BREVO_API_KEY;
  return new Brevo.TransactionalEmailsApi();
};

class EmailService {
  constructor() {
    if (process.env.ENABLE_EMAILS === "true") {
      apiInstance = initBrevo();
      if (apiInstance) {
        console.log("✅ Brevo HTTP API ready (HTTPS)");
      } else {
        console.error("❌ Brevo API initialization failed");
      }
    } else {
      console.log("⚠️ Emails disabled (ENABLE_EMAILS != true)");
    }
  }

  // Helper to send a transactional email
  async _sendEmail(toEmail, toName, subject, htmlContent, textContent) {
    if (process.env.ENABLE_EMAILS !== "true") {
      console.log(`[DEV MODE] Would send email to ${toEmail}: ${subject}`);
      return { success: true, devMode: true };
    }

    if (!apiInstance) {
      console.error("❌ Brevo API not initialized");
      return { success: false, error: "Email service not configured" };
    }

    const sender = {
      email: process.env.SENDER_EMAIL || "noreply@campustrade.com",
      name: process.env.SENDER_NAME || "CampusTrade",
    };
    const recipients = { to: [{ email: toEmail, name: toName }] };

    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.sender = sender;
    sendSmtpEmail.to = recipients.to;
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;

    try {
      const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
      console.log(
        `✅ Email sent to ${toEmail}, messageId: ${result.messageId}`,
      );
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("❌ Brevo API error:", error);
      return { success: false, error: error.message || "Failed to send email" };
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
