import { Router } from "express";
import { ObjectId } from "mongodb";
import { users, tuitions, payments } from "../config/db.js";
import { verifyToken, verifyAdmin } from "../middleware/auth.js";
import { validateId } from "../middleware/validateId.js";

const router = Router();

router.use(verifyToken, verifyAdmin);

router.get("/stats", async (req, res) => {
  const revenue = await payments
    .aggregate([{ $group: { _id: null, total: { $sum: "$amount" } } }])
    .toArray();

  res.send({
    totalUsers: await users.countDocuments(),
    totalTutors: await users.countDocuments({ role: "tutor" }),
    pendingTuitions: await tuitions.countDocuments({
      approvalStatus: "pending",
    }),
    approvedTuitions: await tuitions.countDocuments({
      approvalStatus: "approved",
    }),
    totalRevenue: revenue[0]?.total || 0,
  });
});

router.get("/users", async (req, res) => {
  const data = await users.find().sort({ createdAt: -1 }).toArray();
  res.send(data);
});

router.patch("/users/:id/role", validateId, async (req, res) => {
  const { role } = req.body;
  if (!["student", "tutor", "admin"].includes(role)) {
    return res.status(400).send({ message: "Invalid role" });
  }
  if (req.params.id === req.dbUser._id.toString()) {
    return res.status(400).send({ message: "You cannot change your own role" });
  }

  await users.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { role } },
  );
  res.send({ message: "Role updated" });
});

router.get("/tuitions", async (req, res) => {
  const data = await tuitions.find().sort({ createdAt: -1 }).toArray();
  res.send(data);
});

router.patch("/tuitions/:id/status", validateId, async (req, res) => {
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).send({ message: "Invalid status" });
  }

  await tuitions.updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { approvalStatus: status } },
  );
  res.send({ message: `Tuition ${status}` });
});

// GET /api/admin/payments
router.get("/payments", async (req, res) => {
  const data = await payments.find().sort({ paidAt: -1 }).toArray();
  res.send(data);
});

export default router;