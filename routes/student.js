import { Router } from "express";
import { ObjectId } from "mongodb";
import { applications, tuitions, users } from "../config/db.js";
import { verifyToken, verifyStudent } from "../middleware/auth.js";
import {
  validateId,
  validateObjectId,
} from "../middleware/validateId.js";

const router = Router();

router.use(verifyToken, verifyStudent);

router.get("/stats", async (req, res, next) => {
  try {
    const email = req.dbUser.email;

    const [totalApplied, accepted, pending] = await Promise.all([
      applications.countDocuments({ studentEmail: email }),
      applications.countDocuments({ studentEmail: email, status: "accepted" }),
      applications.countDocuments({ studentEmail: email, status: "pending" }),
    ]);

    res.send({
      totalApplied,
      accepted,
      pending,
      plan: req.dbUser.plan,
      savedCount: req.dbUser.savedTuitions?.length ?? 0,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/applications", async (req, res, next) => {
  try {
    const data = await applications
      .find({ studentEmail: req.dbUser.email })
      .sort({ appliedAt: -1 })
      .toArray();

    res.send(data);
  } catch (error) {
    next(error);
  }
});

router.post("/applications", async (req, res, next) => {
  try {
    const { tuitionId, phone, preferredSchedule, note } = req.body;

    if (!ObjectId.isValid(tuitionId) || !phone || !preferredSchedule) {
      return res
        .status(400)
        .send({ message: "Phone and preferred schedule are required" });
    }

    const tuition = await tuitions.findOne({
      _id: new ObjectId(tuitionId),
      approvalStatus: "approved",
      isActive: true,
    });

    if (!tuition) {
      return res.status(404).send({ message: "Tuition not available" });
    }

    const alreadyApplied = await applications.findOne({
      tuitionId,
      studentEmail: req.dbUser.email,
    });

    if (alreadyApplied) {
      return res
        .status(409)
        .send({ message: "You already applied for this tuition" });
    }

    await applications.insertOne({
      tuitionId,
      tuitionTitle: tuition.title,
      subject: tuition.subject,
      monthlyFee: tuition.monthlyFee,
      tutorName: tuition.tutorName,
      tutorEmail: tuition.tutorEmail,
      studentName: req.dbUser.name,
      studentEmail: req.dbUser.email,
      studentPhone: phone,
      preferredSchedule,
      studentNote: note || "",
      status: "pending",
      appliedAt: new Date(),
    });

    res.status(201).send({ message: "Application submitted" });
  } catch (error) {
    next(error);
  }
});

router.delete("/applications/:id", validateId, async (req, res, next) => {
  try {
    const result = await applications.deleteOne({
      _id: new ObjectId(req.params.id),
      studentEmail: req.dbUser.email,
      status: "pending",
    });

    if (result.deletedCount === 0) {
      return res
        .status(400)
        .send({ message: "Only pending applications can be cancelled" });
    }

    res.send({ message: "Application cancelled" });
  } catch (error) {
    next(error);
  }
});

/**
 * Review & rating (optional requirement 5).
 * A student can review only an accepted application, once per application.
 * The review is embedded in the application document to keep the DB at 4 collections.
 */
router.post("/reviews", async (req, res, next) => {
  try {
    const { applicationId, rating, feedback } = req.body;
    const numericRating = Number(rating);

    if (!ObjectId.isValid(applicationId)) {
      return res.status(400).send({ message: "Invalid application id" });
    }
    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res
        .status(400)
        .send({ message: "Rating must be a whole number from 1 to 5" });
    }
    if (feedback && String(feedback).length > 1000) {
      return res
        .status(400)
        .send({ message: "Feedback cannot be longer than 1000 characters" });
    }

    const application = await applications.findOne({
      _id: new ObjectId(applicationId),
      studentEmail: req.dbUser.email,
      status: "accepted",
    });

    if (!application) {
      return res.status(403).send({
        message: "You can review only an accepted application",
      });
    }

    await applications.updateOne(
      { _id: application._id },
      {
        $set: {
          rating: numericRating,
          feedback: String(feedback || "").trim(),
          reviewedAt: new Date(),
        },
      },
    );

    res.send({ message: "Thank you for your review" });
  } catch (error) {
    next(error);
  }
});

/**
 * Bookmark / saved tuitions (optional requirement 3).
 * Saved ids live on the user document, so no extra collection is needed.
 */
router.get("/bookmarks", async (req, res, next) => {
  try {
    const savedIds = (req.dbUser.savedTuitions || []).filter((id) =>
      ObjectId.isValid(id),
    );

    if (savedIds.length === 0) return res.send([]);

    const data = await tuitions
      .find({
        _id: { $in: savedIds.map((id) => new ObjectId(id)) },
        approvalStatus: "approved",
        isActive: true,
      })
      .sort({ createdAt: -1 })
      .toArray();

    const stats = await applications
      .aggregate([
        {
          $match: {
            tuitionId: { $in: savedIds },
            rating: { $gte: 1, $lte: 5 },
          },
        },
        {
          $group: {
            _id: "$tuitionId",
            average: { $avg: "$rating" },
            count: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const byTuition = new Map(stats.map((item) => [item._id, item]));

    res.send(
      data.map((tuition) => {
        const item = byTuition.get(tuition._id.toString());
        return {
          ...tuition,
          rating: {
            average: item ? Math.round(item.average * 10) / 10 : 0,
            count: item?.count ?? 0,
          },
        };
      }),
    );
  } catch (error) {
    next(error);
  }
});

router.post(
  "/bookmarks/:tuitionId",
  validateObjectId("tuitionId"),
  async (req, res, next) => {
    try {
      const tuition = await tuitions.findOne({
        _id: new ObjectId(req.params.tuitionId),
        approvalStatus: "approved",
        isActive: true,
      });

      if (!tuition) {
        return res.status(404).send({ message: "Tuition not found" });
      }

      await users.updateOne(
        { _id: req.dbUser._id },
        { $addToSet: { savedTuitions: req.params.tuitionId } },
      );

      const updated = await users.findOne(
        { _id: req.dbUser._id },
        { projection: { savedTuitions: 1 } },
      );

      res.send({
        message: "Saved to your bookmarks",
        savedTuitions: updated?.savedTuitions ?? [],
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/bookmarks/:tuitionId",
  validateObjectId("tuitionId"),
  async (req, res, next) => {
    try {
      await users.updateOne(
        { _id: req.dbUser._id },
        { $pull: { savedTuitions: req.params.tuitionId } },
      );

      const updated = await users.findOne(
        { _id: req.dbUser._id },
        { projection: { savedTuitions: 1 } },
      );

      res.send({
        message: "Removed from bookmarks",
        savedTuitions: updated?.savedTuitions ?? [],
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
