module.exports = {
  templates: {
    verification: {
      subject: "Verify Your CampusTrade Account",
      text: (name, link) => {
        return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
    .button { display: inline-block; padding: 12px 30px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    .code { background-color: #e9ecef; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CampusTrade</h1>
    </div>
    <div class="content">
      <h2>Welcome, ${name}!</h2>
      <p>Thank you for registering with CampusTrade. To complete your registration and start using all features, please verify your email address.</p>
      
      <p><strong>Click the button below to verify your account:</strong></p>
      <div style="text-align: center;">
        <a href="${link}" class="button">Verify Email Address</a>
      </div>
      
      <p>Or copy and paste this link into your browser:</p>
      <div class="code">${link}</div>
      
      <p><strong>Important:</strong> This verification link will expire in 24 hours. If you didn't create an account with CampusTrade, please ignore this email.</p>
      
      <p>If the button doesn't work, you can also verify by visiting your profile page and entering the verification code.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} CampusTrade - Addis Ababa University</p>
      <p>This is an automated email. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
        `;
      },
    },
    welcome: {
      subject: "Welcome to CampusTrade!",
      text: (name) => {
        return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to CampusTrade!</h1>
    </div>
    <div class="content">
      <h2>Hello, ${name}!</h2>
      <p>Your email has been successfully verified. Your CampusTrade account is now fully active!</p>
      
      <p>You can now:</p>
      <ul>
        <li>Create and manage listings</li>
        <li>Message other students</li>
        <li>Reserve items</li>
        <li>Complete transactions</li>
        <li>Leave reviews</li>
      </ul>
      
      <p>Get started by browsing the <a href="${process.env.APP_URL || "http://localhost:3000"}/marketplace">marketplace</a> or creating your first listing!</p>
      
      <p>Happy trading!</p>
      <p><strong>The CampusTrade Team</strong></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} CampusTrade - Addis Ababa University</p>
    </div>
  </div>
</body>
</html>
        `;
      },
    },
  },
};
