import express from "express";

import {
  registeruser,
  loginUser,
  verifyOTP
} from "../controllers/auth.controller.js";

const router = express.Router();

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.post("/register", registeruser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOTP);

export default router;