import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));



app.get("/", (req, res) => res.send("MentorLagbe server is running"));



app.listen(() => {
    console.log(`app is running on ${port}`);
})
