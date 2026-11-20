import { Router } from "express";
import { ObjectId } from "mongodb";
import { tuitions, applications } from "../config/db.js";
import { verifyToken, verifyStudent } from "../middleware/auth.js";
import { validateId } from "../middleware/validateId.js";


const router = Router();

router.use(verifyToken, verifyStudent);

router.get('/stats', async (req, res) => {
    const email = req.dbUser.email

    res.send({
        totalApplied: await applications.countDocuments({studentEmail: email}),
        accepted: await applications.countDocuments({studentEmail: email, status: 'pending'}),
        pending: await applications.countDocuments({studentEmail: email, status: 'pending'}),
        plan: req.dbUser.plan,
    })
})


router.post('/applications', async (req, res) => {
    const {tuitionId, phone, preferredSchedule, note} = req.body;

    if (!ObjectId.isValid(tuitionId) || !phone || !preferredSchedule) {
        return res
          .status(400)
          .send({ message: "Phone and preferred schedule are required" });
    }

    const tuition = await tuitions.findOne({
        _id: new ObjectId(tuitionId),
        approvalStatus: 'approved',
        isActive: true,
    })

    if (!tuition) return res.status(404).send({ message: "Tuition not available" });

    const alreadyApplied = await applications.findOne({
        tuitionId,
        studentEmail: req.dbUser.email,
    })

    if (alreadyApplied) return res
      .status(409)
      .send({ message: "You already applied for this tuition" });

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
})


router.get('/applications', async (req, res) => {
    const data = await applications.find({
        studentEmail: req.dbUser.email
    }).sort({appliedAt: -1}).toArray();

    res.send(data);
});

router.delete('/applications/:id', validateId, async (req, res) => {
    const result = await applications.deleteOne({
        _id: new ObjectId(req.params.id),
        studentEmail: req.dbUser.email,
        status: 'pending',
    })

    if (result.deletedCount === 0) {
        return res.status(400).send({ message: "Only pending applications can be cancelled" });
    }
    res.send({ message: "Application cancelled" })
})

export default router;