require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");

const PORT = process.env.PORT || 5000;

// ─── Start Server ─────────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Connect to Redis
    connectRedis();

    // Start Express
    const server = app.listen(PORT, () => {
      console.log(`\n🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log(`📡 API base: http://localhost:${PORT}/api/v1`);
      console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err) => {
      console.error("Unhandled Rejection:", err.message);
      server.close(() => process.exit(1));
    });

    // Handle SIGTERM (e.g. from Docker/Kubernetes)
    process.on("SIGTERM", () => {
      console.log("SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        console.log("Process terminated.");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
