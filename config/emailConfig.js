module.exports = {
  // Simplified for development
  templates: {
    verification: {
      subject: "Verify Your CampusTrade Account",
      text: (name, link) =>
        `Dear ${name},\n\nPlease verify your email: ${link}\n\nCampusTrade Team`,
    },
    welcome: {
      subject: "Welcome to CampusTrade!",
      text: (name) =>
        `Dear ${name},\n\nWelcome to CampusTrade! Your account is now active.\n\nCampusTrade Team`,
    },
  },
};
