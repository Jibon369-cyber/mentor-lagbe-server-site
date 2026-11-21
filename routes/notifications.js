import { Router } from "express";
import { ObjectId } from "mongodb";
import { notifications, users } from "../config/db.js";
import { verifyToken } from "../middleware/auth.js";
import { validateId } from "../middleware/validateId.js";

const router = Router();

router.use(verifyToken, async (req, res, next) => {
  try {
    const user = await users.findOne({ email: req.user.email });
    if (!user) {
      return res.status(401).send({ message: "User account not found" });
    }
    req.notificationRecipient = {
      recipientId: user._id.toString(),
      recipientRole: user.role,
    };
    next();
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const data = await notifications
      .find(req.notificationRecipient)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();
    res.send(data);
  } catch (error) {
    next(error);
  }
});

router.get("/count", async (req, res, next) => {
  try {
    const count = await notifications.countDocuments({
      ...req.notificationRecipient,
      isRead: false,
    });
    res.send({ count });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/read", validateId, async (req, res, next) => {
  try {
    const result = await notifications.updateOne(
      {
        _id: new ObjectId(req.params.id),
        ...req.notificationRecipient,
      },
      { $set: { isRead: true, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Notification not found" });
    }

    res.send({ message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
});

export default router;
