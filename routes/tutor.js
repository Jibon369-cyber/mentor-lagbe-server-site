import { Router } from "express";
import { ObjectId } from "mongodb";
import { applications, tuitions, users } from "../config/db.js";
import { verifyToken, verifyTutor } from "../middleware/auth.js";
import { validateId } from "../middleware/validateId.js";

const router = Router();

router.use(verifyToken, verifyTutor);

const FIELDS = [
  "title",
  "subject",
  "classLevel",
  "mode",
  "location",
  "monthlyFee",
  "daysPerWeek",
  "bannerImage",
  "description",
];

function getTuitionData(body) {
  const data = {};
  for (const field of FIELDS) {
    const value = body[field];
    data[field] =
      typeof value === "string" ? value.trim() : value;
  }
  data.monthlyFee = Number(data.monthlyFee);
  data.daysPerWeek = Number(data.daysPerWeek);
  return data;
}

function isValid(data) {
  return Boolean(
    data.title &&
      data.subject &&
      data.classLevel &&
      data.location &&
      data.description &&
      data.bannerImage &&
      ["Online", "Offline"].includes(data.mode) &&
      Number.isFinite(data.monthlyFee) &&
      data.monthlyFee > 0 &&
      Number.isInteger(data.daysPerWeek) &&
      data.daysPerWeek > 0 &&
      data.daysPerWeek <= 7,
  );
}

router.get("/stats", async (req, res, next) => {
  try {
    const email = req.dbUser.email;
    const [
      totalTuitions,
      approvedTuitions,
      totalApplicants,
      pendingApplicants,
      acceptedApplicants,
    ] = await Promise.all([
      tuitions.countDocuments({ tutorEmail: email }),
      tuitions.countDocuments({
        tutorEmail: email,
        approvalStatus: "approved",
        isActive: true,
      }),
      applications.countDocuments({ tutorEmail: email }),
      applications.countDocuments({ tutorEmail: email, status: "pending" }),
      applications.countDocuments({ tutorEmail: email, status: "accepted" }),
    ]);

    res.send({
      totalTuitions,
      approvedTuitions,
      totalApplicants,
      pendingApplicants,
      acceptedApplicants,
      plan: req.dbUser.plan,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/tuitions", async (req, res, next) => {
  try {
    const data = getTuitionData(req.body);
    if (!isValid(data)) {
      return res
        .status(400)
        .send({ message: "Please fill all required fields correctly" });
    }

    // Free plan = max 2 tuitions. Pro = unlimited.
    const count = await tuitions.countDocuments({ tutorEmail: req.dbUser.email });
    if (req.dbUser.plan !== "pro" && count >= 2) {
      return res.status(403).send({
        message: "Free plan limit reached. Upgrade to Pro to post more.",
      });
    }

    const result = await tuitions.insertOne({
      ...data,
      tutorName: req.dbUser.name,
      tutorEmail: req.dbUser.email,
      approvalStatus: "pending",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).send({
      message: "Tuition posted, waiting for admin approval",
      id: result.insertedId,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/tuitions", async (req, res, next) => {
  try {
    const data = await tuitions
      .find({ tutorEmail: req.dbUser.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.send(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/tuitions/:id", validateId, async (req, res, next) => {
  try {
    const data = getTuitionData(req.body);
    if (!isValid(data)) {
      return res
        .status(400)
        .send({ message: "Please fill all required fields correctly" });
    }

    // Edited content must be reviewed again by an admin.
    const result = await tuitions.updateOne(
      { _id: new ObjectId(req.params.id), tutorEmail: req.dbUser.email },
      {
        $set: {
          ...data,
          approvalStatus: "pending",
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Tuition not found" });
    }

    res.send({ message: "Tuition updated and sent for re-approval" });
  } catch (error) {
    next(error);
  }
});

router.patch("/tuitions/:id/toggle", validateId, async (req, res, next) => {
  try {
    const filter = {
      _id: new ObjectId(req.params.id),
      tutorEmail: req.dbUser.email,
    };
    const tuition = await tuitions.findOne(filter);
    if (!tuition) {
      return res.status(404).send({ message: "Tuition not found" });
    }

    const isActive = !tuition.isActive;
    await tuitions.updateOne(filter, {
      $set: { isActive, updatedAt: new Date() },
    });

    res.send({
      message: isActive ? "Tuition reopened" : "Tuition closed",
      isActive,
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/tuitions/:id", validateId, async (req, res, next) => {
  try {
    const result = await tuitions.deleteOne({
      _id: new ObjectId(req.params.id),
      tutorEmail: req.dbUser.email,
    });

    if (result.deletedCount === 0) {
      return res.status(404).send({ message: "Tuition not found" });
    }

    await Promise.all([
      applications.deleteMany({ tuitionId: req.params.id }),
      users.updateMany(
        { savedTuitions: req.params.id },
        { $pull: { savedTuitions: req.params.id } },
      ),
    ]);

    res.send({ message: "Tuition deleted" });
  } catch (error) {
    next(error);
  }
});

router.get("/applications", async (req, res, next) => {
  try {
    const data = await applications
      .find({ tutorEmail: req.dbUser.email })
      .sort({ appliedAt: -1 })
      .toArray();

    res.send(data);
  } catch (error) {
    next(error);
  }
});

router.patch("/applications/:id", validateId, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["accepted", "rejected"].includes(status)) {
      return res
        .status(400)
        .send({ message: "Status must be accepted or rejected" });
    }

    const result = await applications.updateOne(
      { _id: new ObjectId(req.params.id), tutorEmail: req.dbUser.email },
      { $set: { status, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({ message: "Application not found" });
    }

    res.send({ message: `Application ${status}` });
  } catch (error) {
    next(error);
  }
});

export default router;
