const { defineConfig } = require("cypress");
const { encode } = require("next-auth/jwt");
const fs = require("fs");
const path = require("path");
const http = require("http");

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

const WARMUP_ROUTES = [
  "/api/auth/csrf",
  "/api/auth/session",
  "/api/auth/providers",
  "/api/contact",
  "/api/subscribe",
  "/api/system-health",
  "/login",
  "/owner/dashboard",
  "/owner/teachers",
  "/owner/students",
  "/owner/classes",
  "/owner/attendance",
  "/owner/marks",
  "/owner/fees",
  "/owner/exams",
  "/owner/results",
  "/owner/reports",
  "/owner/notices",
  "/owner/passout",
  "/teacher/dashboard",
  "/teacher/classes",
  "/teacher/students",
  "/teacher/attendance",
  "/teacher/exams",
  "/teacher/assignments",
  "/teacher/marks",
  "/teacher/notices",
  "/student/dashboard",
  "/student/assignments",
  "/student/marksheet",
  "/student/fees",
  "/student/routine",
];

function warmupRoute(url, pathname) {
  return new Promise((resolve) => {
    const req = http.get(`${url}${pathname}`, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ path: pathname, status: res.statusCode }));
    });
    req.on("error", (err) => resolve({ path: pathname, error: err.message }));
    req.setTimeout(15000, () => { req.destroy(); resolve({ path: pathname, error: "timeout" }); });
  });
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
        async warmupRoutes() {
          const baseUrl = "http://localhost:3000";
          const results = await Promise.all(WARMUP_ROUTES.map((r) => warmupRoute(baseUrl, r)));
          const failed = results.filter((r) => r.status !== 200 && r.status !== 308 && r.status !== 401);
          if (failed.length > 0) {
            console.warn("Warm-up non-200 responses:", JSON.stringify(failed));
          }
          return { total: results.length, failed: failed.length };
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
