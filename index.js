import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectToMongoDB } from "./config/db.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

app.get("/", (req, res) => res.send({ message: "MentorLagbe server is running" }));

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
