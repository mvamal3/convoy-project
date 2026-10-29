
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const config = require("./config/environment");
const cookieParser = require("cookie-parser");
// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

// Error handler
const errorHandler = require("./middleware/errorHandler");
const rejectUnsafeInput = require("./middleware/rejectUnsafeInput");

const app = express();

// Behind a reverse proxy (Apache), trust its X-Forwarded-* headers so rate
// limits apply per client IP and secure cookies work over HTTPS.
if (config.TRUST_PROXY) {
  app.set("trust proxy", config.TRUST_PROXY);
}

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

// CORS: configure explicit frontend origins in environment
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  throw new Error("ALLOWED_ORIGINS must be configured");
}

// Only allow the HTTP methods the API uses. OPTIONS is answered only as a
// genuine CORS preflight from an allowed origin; any other OPTIONS (or
// TRACE, PATCH, ...) request gets 405 without advertising allowed methods.
const ALLOWED_METHODS = ["GET", "HEAD", "POST", "PUT", "DELETE"];

app.use((req, res, next) => {
  const isAllowedPreflight =
    req.method === "OPTIONS" &&
    allowedOrigins.includes(req.headers.origin) &&
    Boolean(req.headers["access-control-request-method"]);

  if (!ALLOWED_METHODS.includes(req.method) && !isAllowedPreflight) {
    return res.status(405).end();
  }

  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

// With COOKIE_SECURE the API is only reachable through the HTTPS reverse
// proxy, so tell express-session the connection is secure. Without this it
// refuses to send Secure cookies unless the proxy forwards X-Forwarded-Proto.
if (config.COOKIE_SECURE) {
  app.use((req, res, next) => {
    req.headers["x-forwarded-proto"] = "https";
    next();
  });
}

// CAPTCHA session
app.use(
  session({
    name: "captcha-session",
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: config.COOKIE_SECURE,
    cookie: {
      httpOnly: true,
      secure: config.COOKIE_SECURE,
      sameSite: "lax",
      maxAge: 5 * 60 * 1000,
    },
  }),
);



// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000,
  max: 300, // Review this limit and choose an appropriate value.
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API responses carry personal data; never let browsers or proxies cache them
app.use("/api/", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate");
  res.set("Pragma", "no-cache");
  next();
});

// Baseline input validation for every API route
app.use("/api/", rejectUnsafeInput);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
