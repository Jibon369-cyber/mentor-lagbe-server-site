import { Router } from "express";
import { users } from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.get("/me", verifyToken, async (req, res, next) => {
  try {
    const user = await users.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send({
      ...user,
      savedTuitions: user.savedTuitions ?? [],
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/me", verifyToken, async (req, res, next) => {
  try {
    const { name, phone, bio, image } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).send({ message: "Name is required" });
    }
    if (String(name).trim().length > 80) {
      return res
        .status(400)
        .send({ message: "Name cannot be longer than 80 characters" });
    }
    if (phone && String(phone).length > 30) {
      return res.status(400).send({ message: "Phone number is too long" });
    }
    if (bio && String(bio).length > 600) {
      return res
        .status(400)
        .send({ message: "Bio cannot be longer than 600 characters" });
    }

    const result = await users.updateOne(
      { email: req.user.email },
      {
        $set: {
          name: String(name).trim(),
          phone: phone ? String(phone).trim() : "",
          bio: bio ? String(bio).trim() : "",
          image: image ? String(image).trim() : "",
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    const updated = await users.findOne({ email: req.user.email });

    res.send({
      message: "Profile updated",
      user: {
        ...updated,
        savedTuitions: updated?.savedTuitions ?? [],
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
