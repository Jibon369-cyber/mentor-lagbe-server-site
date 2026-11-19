const { Router } = require("express");
const { auth } = require("../config/auth");
const { fromNodeHeaders } = require("better-auth/node");
const { jwt } = require("better-auth");


const router = Router();

router.get('/', async (req, res) => {
    const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
    })

    if (!session) {
        return res.status(401).send({message: 'Not logged in'});
    }

    const token = jwt.sign({email: session.user.email}, 
        process.env.JWT_SECRET, {
            expriresIn: 60 * 60 * 24 * 7,
        }
    )

    res.send({token})
})

export default router;