import express from "express";

import {
    protect,
    admin
} from "../middleware/auth.js";

import {
    requestBookingOtp,
    bookevent,
    getmybookings,
    getallbookings,
    cancelbooking
} from "../controllers/booking.controller.js";

const router = express.Router();


// ==========================================
// SEND BOOKING OTP
// ==========================================

router.post(
    "/send-otp",
    protect,
    requestBookingOtp
);


// ==========================================
// CREATE BOOKING
// ==========================================

router.post(
    "/book",
    protect,
    bookevent
);


// ==========================================
// GET USER'S BOOKINGS
// ==========================================

router.get(
    "/my",
    protect,
    getmybookings
);


// ==========================================
// GET ALL BOOKINGS - ADMIN ONLY
// ==========================================

router.get(
    "/all",
    protect,
    admin,
    getallbookings
);


// ==========================================
// CANCEL BOOKING
// ==========================================

router.delete(
    "/:id",
    protect,
    cancelbooking
);


export default router;