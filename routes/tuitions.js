import { Router } from "express";
import { ObjectId } from "mongodb";
import { applications, tuitions, users } from "../config/db.js";
import { validateId } from "../middleware/validateId.js";

const router = Router();

const publicFilter = { approvalStatus: "approved", isActive: true };

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Adds `rating: { average, count }` to a list of tuition documents.
 * Reviews are stored on accepted applications, so the 4-collection
 * database design is preserved.
 */
async function attachRatings(list) {
  if (!list.length) return list;

  const ids = list.map((tuition) => tuition._id.toString());
  const stats = await applications
    .aggregate([
      { $match: { tuitionId: { $in: ids }, rating: { $gte: 1, $lte: 5 } } },
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

  return list.map((tuition) => {
    const item = byTuition.get(tuition._id.toString());
    return {
      ...tuition,
      rating: {
        average: item ? Math.round(item.average * 10) / 10 : 0,
        count: item?.count ?? 0,
      },
    };
  });
}

// GET /api/tuitions?search=&subject=&classLevel=&mode=&page=&limit=
router.get("/", async (req, res, next) => {
  try {
    const { search, subject, classLevel, mode } = req.query;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(24, Math.max(1, Number(req.query.limit) || 9));

    const conditions = [{ ...publicFilter }];

    if (search) {
      const text = escapeRegex(search.trim());
      conditions.push({
        $or: [
          { title: { $regex: text, $options: "i" } },
          { subject: { $regex: text, $options: "i" } },
          { tutorName: { $regex: text, $options: "i" } },
        ],
      });
    }

    if (subject) {
      conditions.push({ subject: { $regex: `^${escapeRegex(subject)}$`, $options: "i" } });
    }
    if (classLevel) {
      conditions.push({
        classLevel: { $regex: `^${escapeRegex(classLevel)}$`, $options: "i" },
      });
    }
    if (mode) {
      conditions.push({ mode: { $regex: `^${escapeRegex(mode)}$`, $options: "i" } });
    }

    const query = { $and: conditions };

    const total = await tuitions.countDocuments(query);
    const data = await tuitions
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.send({
      tuitions: await attachRatings(data),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/tuitions/latest - 6 newest approved & active tuitions for the home page
router.get("/latest", async (req, res, next) => {
  try {
    const data = await tuitions
      .find(publicFilter)
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();

    res.send(await attachRatings(data));
  } catch (error) {
    next(error);
  }
});

// GET /api/tuitions/reviews/featured - real student feedback for the home page
router.get("/reviews/featured", async (req, res, next) => {
  try {
    const reviews = await applications
      .find(
        {
          rating: { $gte: 4, $lte: 5 },
          feedback: { $nin: ["", null] },
        },
        {
          projection: {
            studentName: 1,
            tuitionTitle: 1,
            subject: 1,
            rating: 1,
            feedback: 1,
            reviewedAt: 1,
          },
        },
      )
      .sort({ reviewedAt: -1 })
      .limit(6)
      .toArray();

    res.send(reviews);
  } catch (error) {
    next(error);
  }
});

// GET /api/tuitions/:id
router.get("/:id", validateId, async (req, res, next) => {
  try {
    const tuition = await tuitions.findOne({
      _id: new ObjectId(req.params.id),
      approvalStatus: "approved",
    });

    if (!tuition) {
      return res.status(404).send({ message: "Tuition not found" });
    }

    const [tutor, reviews] = await Promise.all([
      users.findOne(
        { email: tuition.tutorEmail },
        {
          projection: {
            name: 1,
            image: 1,
            bio: 1,
            plan: 1,
            email: 1,
            phone: 1,
          },
        },
      ),
      applications
        .find(
          { tuitionId: req.params.id, rating: { $gte: 1, $lte: 5 } },
          {
            projection: {
              studentName: 1,
              rating: 1,
              feedback: 1,
              reviewedAt: 1,
            },
          },
        )
        .sort({ reviewedAt: -1 })
        .toArray(),
    ]);

    const average =
      reviews.length > 0
        ? Math.round(
            (reviews.reduce((sum, review) => sum + review.rating, 0) /
              reviews.length) *
              10,
          ) / 10
        : 0;

    res.send({
      ...tuition,
      tutor,
      reviews,
      rating: { average, count: reviews.length },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
