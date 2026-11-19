import { ObjectId } from "mongodb"

export const validateId = (req, res, next) => {
    if (!ObjectId.isValid(req.params.id)) {
        return res.status(400).send({message: 'Invalid id'})
    }
    next
}