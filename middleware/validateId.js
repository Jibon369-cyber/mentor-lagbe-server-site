import { ObjectId } from "mongodb";

/**
 * Express middleware that validates an ObjectId route parameter.
 * Usage: router.get("/:id", validateId, handler)
 *        router.post("/bookmarks/:tuitionId", validateObjectId("tuitionId"), handler)
 */
export const validateObjectId =
  (paramName = "id") =>
  (req, res, next) => {
    if (!ObjectId.isValid(req.params[paramName])) {
      return res.status(400).send({ message: "Invalid id" });
    }
    next();
  };

export const validateId = validateObjectId("id");
