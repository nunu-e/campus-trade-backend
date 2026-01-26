const axios = require("axios");

async function testEndpoints() {
  const baseURL = "https://campus-trade-backend.onrender.com";

  console.log("Testing CampusTrade Backend...\n");

  const tests = [
    { url: "/", method: "GET", name: "Root endpoint" },
    { url: "/api/health", method: "GET", name: "Health check" },
    { url: "/api/test/cors-test", method: "GET", name: "CORS test" },
    { url: "/api/test/db-test", method: "GET", name: "Database test" },
  ];

  for (const test of tests) {
    try {
      console.log(`Testing ${test.name}...`);
      const response = await axios({
        method: test.method,
        url: baseURL + test.url,
        headers: {
          Origin: "https://campus-trade-frontend.netlify.app",
        },
      });

      console.log(
        `✅ ${test.name}:`,
        response.status,
        response.data.message || "OK",
      );
      console.log("Headers:", JSON.stringify(response.headers, null, 2));
    } catch (error) {
      console.error(`❌ ${test.name} failed:`);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
        console.error("Headers:", error.response.headers);
      } else {
        console.error("Error:", error.message);
      }
    }
    console.log("---\n");
  }
}

testEndpoints();
