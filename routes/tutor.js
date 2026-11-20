import { Router } from "express";
import { ObjectId } from "mongodb";
import { tuitions, applications } from "../config/db.js";
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
  for (const field of FIELDS) data[field] = body[field];
  data.monthlyFee = Number(data.monthlyFee);
  data.daysPerWeek = Number(data.daysPerWeek);
  return data;
}

function isValid(d) {
  return (
    d.title &&
    d.subject &&
    d.classLevel &&
    d.location &&
    d.description &&
    ["Online", "Offline"].includes(d.mode) &&
    d.monthlyFee > 0 &&
    d.daysPerWeek > 0
  );
}

router.get("/stats", async (req, res) => {
  const email = req.dbUser.email;
  res.send({
    totalTuitions: await tuitions.countDocuments({ tutorEmail: email }),
    approvedTuitions: await tuitions.countDocuments({
      tutorEmail: email,
      approvalStatus: "approved",
    }),
    totalApplicants: await applications.countDocuments({ tutorEmail: email }),
    plan: req.dbUser.plan,
  });
});

router.post("/tuitions", async (req, res) => {
  const data = getTuitionData(req.body);
  if (!isValid(data))
    return res.status(400).send({ message: "Please fill all required fields" });

  // Free plan = max 2 tuitions
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
  });

  res.status(201).send({
    message: "Tuition posted, waiting for admin approval",
    id: result.insertedId,
  });
});

router.get("/tuitions", async (req, res) => {
  const data = await tuitions
    .find({ tutorEmail: req.dbUser.email })
    .sort({ createdAt: -1 })
    .toArray();
  res.send(data);
});

router.patch("/tuitions/:id", validateId, async (req, res) => {
  const data = getTuitionData(req.body);
  if (!isValid(data))
    return res.status(400).send({ message: "Please fill all required fields" });

  const result = await tuitions.updateOne(
    { _id: new ObjectId(req.params.id), tutorEmail: req.dbUser.email },
    { $set: data },
  );
  if (result.matchedCount === 0)
    return res.status(404).send({ message: "Tuition not found" });

  res.send({ message: "Tuition updated" });
});

router.patch("/tuitions/:id/toggle", validateId, async (req, res) => {
  const filter = {
    _id: new ObjectId(req.params.id),
    tutorEmail: req.dbUser.email,
  };
  const tuition = await tuitions.findOne(filter);
  if (!tuition) return res.status(404).send({ message: "Tuition not found" });

  await tuitions.updateOne(filter, { $set: { isActive: !tuition.isActive } });
  res.send({ message: "Status changed", isActive: !tuition.isActive });
});

router.delete("/tuitions/:id", validateId, async (req, res) => {
  const result = await tuitions.deleteOne({
    _id: new ObjectId(req.params.id),
    tutorEmail: req.dbUser.email,
  });
  if (result.deletedCount === 0)
    return res.status(404).send({ message: "Tuition not found" });

  await applications.deleteMany({ tuitionId: req.params.id });
  res.send({ message: "Tuition deleted" });
});

router.get("/applications", async (req, res) => {
  const data = await applications
    .find({ tutorEmail: req.dbUser.email })
    .sort({ appliedAt: -1 })
    .toArray();
  res.send(data);
});

router.patch("/applications/:id", validateId, async (req, res) => {
  const { status } = req.body;
  if (!["accepted", "rejected"].includes(status)) {
    return res
      .status(400)
      .send({ message: "Status must be accepted or rejected" });
  }

  const result = await applications.updateOne(
    { _id: new ObjectId(req.params.id), tutorEmail: req.dbUser.email },
    { $set: { status } },
  );
  if (result.matchedCount === 0)
    return res.status(404).send({ message: "Application not found" });

  res.send({ message: `Application ${status}` });
});

export default router;