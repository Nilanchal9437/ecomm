import express from "express";
const router = express.Router();

router.get("/", (req, res) => res.send("Welcome to Headford ecommerce Server"));

export default router;
