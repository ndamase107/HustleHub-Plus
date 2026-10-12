
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");

const connectDB = require("./config/db");
const createHttpsServer = require("./utils/https");

const authRoutes = require("./routes/authRoutes");
const gigRoutes = require("./routes/gigRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

// =====================================
// SECURITY CONFIGURATION
// =====================================

// Add permitted frontend addresses
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174"
];

// Allow a separately configured production frontend
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// HTTP security headers
app.use(helmet());

// Restrict browser access to trusted origins
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header,
      // such as Postman and automated API tests.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Log HTTP requests
app.use(morgan("dev"));

// Limit incoming JSON request size
app.use(express.json({ limit: "100kb" }));

// =====================================
// API ROUTES
// =====================================

app.use("/api/auth", authRoutes);
app.use("/api/gigs", gigRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/transactions", transactionRoutes);

// Centralized error handling
app.use(errorMiddleware);

// =====================================
// HTTPS SERVER
// =====================================

async function startServer() {
  try {
    await connectDB();

 const PORT = process.env.PORT || 5000;

// Render handles HTTPS automatically in production.
// Keep HTTPS for local development.
const server =
  process.env.NODE_ENV === "production"
    ? app
    : createHttpsServer(app);

server.listen(PORT, () => {
  console.log(`HustleHub+ backend running on port ${PORT}`);
  console.log("HustleHub+ backend is ready!");
});
    server.on("error", (error) => {
      console.error("HTTPS server error:", error.message);
    });

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

// Start the server only when executed directly
if (require.main === module) {
  startServer();
}

// Export for Jest and Supertest
module.exports = app;
