import { Router } from "express";
import { tuitions, users } from "../config/db.js";
import { validateId } from "../middleware/validateId.js";
import { ObjectId } from "mongodb";


const router = Router();

const publicFilter = {approvalStatus: 'approved', isActive: true}

router.get('/', async (req, res) => {
    const {search, subject, classLevel, mode} = req.query;

    const page = Number(req.query.page) || 1

    const limit = Number(req.query.limit) || 9

    const query = {...publicFilter}

    if (search) {
        const text = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        query.$or = [
            {title: {$regex: text, $options: 'i'}},
            {subject: {$regex: text, $options: 'i'}},
        ]
    }

    if (subject) query.subject = subject

    if (classLevel) query.classLevel = classLevel

    if (mode) query.mode = mode

    const total = await tuitions.countDocuments(query)

    const data = await tuitions
    .find(query)
    .sort({createdAt: -1})
    .skip((page - 1) * limit)
    .limit(limit)
    .toArray()

    res.send({tuitions: data, total, page, totalPages: Math.ceil(total / limit)})
})

router.get('/letest', async (req, res) => {
    const data = await tuitions.find(publicFilter).sort({createdAt: -1}).limit(6).toArray()

    res.send(data)
})

router.get('/:id', validateId, async (req, res) => {
    const tuition = await tuition.findOne({
        _id: new ObjectId(req.params.id),
        approvalStatus: 'approved',
    })

    if (!tuition) return res.status(404).send({message: 'Tuition not found'})

    const tutor = await users.findOne(
        {email: tuition.tutorEmail},
        {projection: {name: 1, image: 1, bio: 1, plan: 1, email: 1}}
    )

    res.send({...tuition, tutor})
})

export default router;