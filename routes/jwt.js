import { Router } from "express";
import jwt from "jsonwebtoken";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).send({ message: "Not logged in" });
    }

    const token = jwt.sign(
      { email: session.user.email, sub: session.user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.send({ token });
  } catch (error) {
    next(error);
  }
});

export default router;
