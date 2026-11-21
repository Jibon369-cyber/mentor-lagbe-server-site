import { Router } from "express";
import jwt from "jsonwebtoken";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../config/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session) {
    return res.status(401).send({ message: "Not logged in" });
  }

  const token = jwt.sign(
    { email: session.user.email },
    process.env.JWT_SECRET,
    {
      expriresIn: 60 * 60 * 24 * 7,
    },
  );

  res.send({ token });
});

export default router;
