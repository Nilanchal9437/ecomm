import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import config from "#@/config/config.js";
import viewAsync from "#@/mongo-qury/viewOne.js";

const { RESPONSE, COLLECTION, JWT_SECRET } = config;

const ensureAuthorisedAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({
        status: false,
        message: RESPONSE.USER_TOKEN_NOT_FOUND,
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const { status, result } = await viewAsync(
      { email: decoded.email, status: true },
      COLLECTION.USER,
    );

    if (status && (result.user_type === "SA" || result.user_type === "A")) {
      req.userId = result._id; // result._id is already an ObjectId from MongoDB
      next();
    } else {
      res.json({ status: false, message: RESPONSE.ACCESS_DENIED });
    }
  } catch (error) {
    console.log(error);
    res.json({ status: false, message: RESPONSE.INVALID_USER });
  }
};

export default ensureAuthorisedAdmin;
