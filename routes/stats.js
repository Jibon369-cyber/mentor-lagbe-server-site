import { Router } from "express";
import { applications, tuitions, users } from "../config/db.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const [
      tutors,
      students,
      totalUsers,
      approvedTuitions,
      totalReviews,
    ] = await Promise.all([
      users.countDocuments({ role: "tutor" }),
      users.countDocuments({ role: "student" }),
      users.countDocuments(),
      tuitions.countDocuments({ approvalStatus: "approved", isActive: true }),
      applications.countDocuments({ rating: { $gte: 1 } }),
    ]);

    res.send({
      tutors,
      students,
      totalUsers,
      approvedTuitions,
      totalReviews,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
