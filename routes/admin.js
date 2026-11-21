import { Router } from "express";
import { ObjectId } from "mongodb";
import { applications, payments, tuitions, users } from "../config/db.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";
import { validateId } from "../middleware/validateId.js";

const router = Router();

router.use(verifyToken, verifyAdmin);

router.get("/stats", async (req, res, next) => {
  try {
    const revenue = await payments
      .aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray();

    const [
      totalUsers,
      totalTutors,
      totalStudents,
      totalTuitions,
      pendingTuitions,
      approvedTuitions,
      totalApplications,
      totalPayments,
    ] = await Promise.all([
      users.countDocuments(),
      users.countDocuments({ role: "tutor" }),
      users.countDocuments({ role: "student" }),
      tuitions.countDocuments(),
      tuitions.countDocuments({ approvalStatus: "pending" }),
      tuitions.countDocuments({ approvalStatus: "approved" }),
      applications.countDocuments(),
      payments.countDocuments({ paymentStatus: "paid" }),
    ]);

    res.send({
      totalUsers,
      totalTutors,
      totalStudents,
      totalTuitions,
      pendingTuitions,
      approvedTuitions,
      totalApplications,
      totalPayments,
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const query = {};

    if (role && ["student", "tutor", "admin"].includes(role)) {
      query.role = role;
    }
    if (search) {
      const text = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { name: { $regex: text, $options: "i" } },
        { email: { $regex: text, $options: "i" } },
      ];
    }

    const data = await users
      .find(query, {
        projection: {
          name: 1,
          email: 1,
          image: 1,
          role: 1,
          plan: 1,
          phone: 1,
          bio: 1,
          createdAt: 1,
          savedTuitions: 1,
        },
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id/role", validateId, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["student", "tutor", "admin"].includes(role)) {
      return res.status(400).send({ message: "Invalid role" });
    }
    if (req.params.id === req.dbUser._id.toString()) {
      return res.status(400).send({ message: "You cannot change your own role" });
    }

    const result = await users.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { role, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "User not found" });
    }

    res.send({ message: "Role updated" });
  } catch (error) {
    next(error);
  }
});

router.get("/tuitions", async (req, res, next) => {
  try {
    const { status } = req.query;
    const query =
      status && ["pending", "approved", "rejected"].includes(status)
        ? { approvalStatus: status }
        : {};

    const data = await tuitions
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.send(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/tuitions/:id/status", validateId, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).send({ message: "Invalid status" });
    }

    const result = await tuitions.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { approvalStatus: status, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Tuition not found" });
    }

    res.send({ message: `Tuition ${status}` });
  } catch (error) {
    next(error);
  }
});

router.get("/payments", async (req, res, next) => {
  try {
    const data = await payments
      .find({ paymentStatus: "paid" })
      .sort({ paidAt: -1 })
      .toArray();

    res.send(data);
  } catch (error) {
    next(error);
  }
});

export default router;
