import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import Otp from "../models/otp.js";
import { sendotpemail } from "../utils/email.js";

const normalizeEmail = (email) =>
  typeof email === "string" ? email.trim().toLowerCase() : "";

const generateToken = (id, role) => {
  const secret = process.env.JWT_SECRET || process.env.jwt_SECRET;

  if (!secret) {
    throw new Error("JWT secret is not configured");
  }

  return jwt.sign({ id, role }, secret, { expiresIn: "7d" });
};

// register user
export const registeruser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const normalizedEmail = normalizeEmail(email);

    if (
      typeof name !== "string" ||
      !name.trim() ||
      !normalizedEmail ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ error: "user already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      isverified: false,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.deleteMany({ email: normalizedEmail, action: "account_verification" });
    await Otp.create({ email: normalizedEmail, otp, action: "account_verification" });
    await sendotpemail(normalizedEmail, otp, "account_verification");

    return res.status(201).json({
      message:
        "User registered successfully. Please check your email for the OTP to verify your account.",
      email: user.email,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// login user
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ error: "Invalid credential please sign up first" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.isverified && user.role === "user") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await Otp.deleteMany({ email: normalizedEmail, action: "account_verification" });
      await Otp.create({ email: normalizedEmail, otp, action: "account_verification" });
      await sendotpemail(normalizedEmail, otp, "account_verification");

      return res.status(400).json({
        error: "Account not verified. A new OTP has been sent to your email.",
        needsverification: true,
        email: normalizedEmail,
      });
    }

    const token = generateToken(user._id, user.role);

    return res.json({
      message: "login successful",
      _id: user._id,
      name: user.name,
      role: user.role,
      token,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// verify otp
export const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      otp,
      action: "account_verification",
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const verifiedUser = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { isverified: true },
      { new: true }
    );

    if (!verifiedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    await Otp.deleteMany({
      email: normalizedEmail,
      action: "account_verification",
    });

    return res.json({
      message: "Account verified successfully. You can now login.",
      id: verifiedUser._id,
      name: verifiedUser.name,
      email: verifiedUser.email,
      token: generateToken(verifiedUser._id, verifiedUser.role),
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};