import express from "express";
import cors from "cors";
import "dotenv/config";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";
import { connectToMongoDB } from "./config/db.js";
import { handleStripeWebhook } from "./routes/payments.js";

import jwtRoutes from "./routes/jwt.js";
import statsRoutes from "./routes/stats.js";
import tuitionRoutes from "./routes/tuitions.js";
import userRoutes from "./routes/users.js";
import studentRoutes from "./routes/student.js";
import tutorRoutes from "./routes/tutor.js";
import adminRoutes from "./routes/admin.js";
import paymentRoutes from "./routes/payments.js";
import notificationRoutes from "./routes/notifications.js";

const app = express();
const port = process.env.PORT || 5000;

app.set("trust proxy", 1);
app.disable("x-powered-by");

const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin header (curl, server-to-server) are allowed.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Stripe needs the raw body for signature verification. This route must be
// registered before express.json().
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

// BetterAuth also reads the raw request body, so it must come before express.json().
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) =>
  res.send({ message: "MentorLagbe server is running", status: "ok" }),
);

app.get("/api/health", (req, res) =>
  res.send({ status: "ok", uptime: process.uptime() }),
);

app.use("/api/jwt", jwtRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/tuitions", tuitionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payments", paymentRoutes);

app.use((req, res) => res.status(404).send({ message: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).send({ message: "Origin is not allowed" });
  }

  res.status(500).send({
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong on the server"
        : err.message || "Server error",
  });
});

async function startServer() {
  try {
    await connectToMongoDB();
    const server = app.listen(port, () => {
      console.log(`MentorLagbe API is running on port ${port}`);
    });

    const shutdown = () => {
      server.close(() => process.exit(0));
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Server not started because MongoDB connection failed.");
    process.exit(1);
  }
}

startServer();

export default app;
