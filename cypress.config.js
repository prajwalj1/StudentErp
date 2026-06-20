const { defineConfig } = require("cypress");
const { encode } = require("next-auth/jwt");
const fs = require("fs");
const path = require("path");

// Manually load .env to get NEXTAUTH_SECRET
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

module.exports = defineConfig({
  projectId: "x9v5as",

  e2e: {
    baseUrl: "http://localhost:3000",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    setupNodeEvents(on, config) {
      on("task", {
        async createSessionToken({ role, name, email, extra }) {
          const secret = process.env.NEXTAUTH_SECRET;
          if (!secret) throw new Error("NEXTAUTH_SECRET not set");
          const token = await encode({
            secret,
            token: {
              name: name || role.charAt(0) + role.slice(1).toLowerCase(),
              email: email || `${role.toLowerCase()}@school.com`,
              sub: `${role.toLowerCase()}-1`,
              role,
              ...extra,
            },
            maxAge: 30 * 24 * 60 * 60,
          });
          return token;
        },
      });
    },
  },

  component: {
    devServer: {
      framework: "next",
      bundler: "webpack",
    },
  },
});
