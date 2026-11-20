import { Router } from "express";
import { verifyToken } from "../middleware/auth";
import { users } from "../config/db";


const router = Router();

router.get('/me', verifyToken, async (req, res) => {
    const user = await users.findOne({email: req.user.email})

    if(!user) return res.status(404).send({ message: "User not found" });

    res.send(user)
})

router.patch('/me', verifyToken, async (req, res) => {
    const {name, phone, bio, image} = req.body

    if (!name) return res.status(400).send({ message: "Name is required" });

    await users.updateOne(
        {email: req.user.email},
        {$set: {name, phone: phone || "", bio: bio || "", image: image || ""}},
    )
    res.send({ message: "Profile updated" });
})

export default router;