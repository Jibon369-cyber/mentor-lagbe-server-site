import jwt from "jsonwebtoken";
import { users } from "../config/db.js";

/**
 * Verifies the JWT sent as `Authorization: Bearer <token>`.
 * The token is issued by /api/jwt after a valid BetterAuth session.
 */
export const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized: token missing" });
  }

  try {
    const token = header.slice("Bearer ".length).trim();
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).send({ message: "Unauthorized: invalid token" });
  }
};

const verifyRole = (role) => async (req, res, next) => {
  try {
    if (!req.user?.email) {
      return res.status(401).send({ message: "Unauthorized" });
    }

    const dbUser = await users.findOne({ email: req.user.email });

    if (!dbUser) {
      return res.status(401).send({ message: "User account not found" });
    }
    if (dbUser.role !== role) {
      return res.status(403).send({ message: "Forbidden: access denied" });
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    next(error);
  }
};

export const verifyStudent = verifyRole("student");
export const verifyTutor = verifyRole("tutor");
export const verifyAdmin = verifyRole("admin");
