const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const config = require("./config/environment");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");

// Error handler
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Security middleware
// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  }),
);

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  }),
);

app.use(
  session({
    name: "captcha-session",
    secret: "captcha-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false, // true in HTTPS
      sameSite: "lax", // ✅ REQUIRED
      maxAge: 5 * 60 * 1000,
    },
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW * 60 * 1000,
  max: 1000000,
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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
