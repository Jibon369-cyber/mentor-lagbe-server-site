import { Router } from "express";
import { tuitions, users } from "../config/db";


const router = Router();

router.get('/', async (req, res) => {
    const tutors = await users.coutDocuments({role: 'tutor'})

    const students = await users.coutDocuments({ role: "student" });

    const approvedTuitions = await tuitions.coutDocuments({approvalStatus: 'approved'})

    res.send({tutors, students, approvedTuitions})
})

export default router;