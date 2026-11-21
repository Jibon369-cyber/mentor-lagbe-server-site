import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectToMongoDB } from "./config/db.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./config/auth.js";

import jwtRoutes from "./routes/jwt.js";
import statsRoutes from "./routes/stats.js";
import tuitionRoutes from "./routes/tuitions.js";
import userRoutes from "./routes/users.js";
import studentRoutes from "./routes/student.js";
import tutorRoutes from "./routes/tutor.js";
import adminRoutes from "./routes/admin.js";
import paymentRoutes from "./routes/payments.js";



const app = express();
const port = process.env.PORT || 5000;

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));



app.get("/", (req, res) => res.send({ message: "MentorLagbe server is running" }));


app.use("/api/jwt", jwtRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/tuitions", tuitionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);


app.use((req, res) => res.status(404).send({ message: "Route not found" }));


app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ message: err.message || "Server error" });
});


async function startServer() {
  try {
    await connectToMongoDB();
    app.listen(port, () => {
      console.log(`app is running on ${port}`);
    });
  } catch (err) {
    console.error("Server not started because MongoDB connection failed.");
    process.exit(1);
  }
}

startServer();

export default app;
