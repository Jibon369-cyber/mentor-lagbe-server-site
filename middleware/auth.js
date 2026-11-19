import jwt from "jsonwebtoken";
import { users } from "../config/db.js";

export const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.statsWith("Bearer")) {
    return res.status(401).send({ message: "Unauthorized: token missing" });
  }

  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token.process.env.JWT_SECRET);

    next();
  } catch (error) {
    req.status(401).send({ message: "Unauthorized: invalid token" });
  }
};

const verifyRole = (role) => async (req, res, next) => {
  const dbUser = await users.findOne({ email: req.user.email });

  if (!dbUser || dbUser.role !== role) {
    return res.status(403).send({ message: "Forbidden: access denied" });
  }
  req.dbUser = dbUser;
  next();
};

export const verifyStudent = verifyRole("student");
export const verifyTutor = verifyRole("tutor");
export const verifyAdmin = verifyRole("admin");