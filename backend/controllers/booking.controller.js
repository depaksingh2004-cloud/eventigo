import crypto from "crypto";
import Razorpay from "razorpay";

import Otp from "../models/otp.js";
import Event from "../models/events.js";
import Booking from "../models/Bookings.js";
import User from "../models/user.js";

import {
    sendotpemail,
    sendbookingemail
} from "../utils/email.js";


// ==========================================
// RAZORPAY INSTANCE
// ==========================================

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// ==========================================
// GENERATE 6 DIGIT OTP
// ==========================================

const generateOTP = () => {
    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
};


// ==========================================
// REQUEST BOOKING OTP
// ==========================================

export const requestBookingOtp = async (req, res) => {
    try {

        const otpCode = generateOTP();

        await Otp.findOneAndDelete({
            email: req.user.email,
            action: "event_booking"
        });

        await Otp.create({
            email: req.user.email,
            otp: otpCode,
            action: "event_booking"
        });

        await sendotpemail(
            req.user.email,
            otpCode,
            "event_booking"
        );

        console.log(
            "Booking OTP generated:",
            otpCode
        );

        console.log(
            "Booking OTP sent to:",
            req.user.email
        );

        res.json({
            message: "OTP sent to email"
        });

    } catch (error) {

        console.error(
            "Request Booking OTP Error:",
            error
        );

        res.status(500).json({
            error: "Unable to send booking OTP"
        });
    }
};


// ==========================================
// BOOK EVENT
// ==========================================

export const bookevent = async (req, res) => {
    try {

        const {
            eventid,
            otp: otpCode
        } = req.body;


        console.log("--------------------------------");
        console.log("BOOK EVENT REQUEST");

        console.log(
            "Logged-in email:",
            req.user.email
        );

        console.log(
            "OTP received from frontend:",
            otpCode
        );

        console.log(
            "Event ID:",
            eventid
        );


        // ======================================
        // VERIFY OTP
        // ======================================

        const otpRecord = await Otp.findOne({
            email: req.user.email,
            otp: String(otpCode).trim(),
            action: "event_booking"
        });


        console.log(
            "OTP record found:",
            otpRecord
        );


        if (!otpRecord) {

            console.log("❌ OTP NOT FOUND");

            return res.status(400).json({
                error: "Invalid or expired OTP"
            });
        }


        console.log("✅ OTP VERIFIED");


        // ======================================
        // FIND EVENT
        // ======================================

        const eventRecord =
            await Event.findById(eventid);


        if (!eventRecord) {

            return res.status(404).json({
                error: "Event not found"
            });
        }


        // ======================================
        // CHECK AVAILABLE SEATS
        // ======================================

        if (eventRecord.availableSeats <= 0) {

            return res.status(400).json({
                error: "No seats available"
            });
        }


        // ======================================
        // CREATE BOOKING
        // ======================================

        const eventBooking =
            await Booking.create({

                eventid: eventid,

                userid: req.user._id,

                amount: eventRecord.ticketPrice,

                paymentStatus: "non_paid",

                status: "pending"
            });


        console.log(
            "✅ Booking created:",
            eventBooking._id
        );


        // ======================================
        // DELETE USED OTP
        // ======================================

        await Otp.deleteMany({
            email: req.user.email,
            action: "event_booking"
        });


        // ======================================
        // SEND BOOKING EMAIL
        // ======================================

        await sendbookingemail(
            req.user.email,
            eventRecord.title,
            eventBooking._id
        );


        res.status(201).json({

            message:
                "Booking created. Please complete payment from your dashboard.",

            bookingId:
                eventBooking._id
        });


    } catch (error) {

        console.error(
            "Book Event Error:",
            error
        );

        res.status(500).json({
            error: "Unable to complete booking."
        });
    }
};


// ==========================================
// CREATE RAZORPAY PAYMENT ORDER
// ==========================================

export const createPaymentOrder = async (req, res) => {

    try {

        const bookingId =
            req.params.id;


        // ======================================
        // FIND BOOKING
        // ======================================

        const bookingRecord =
            await Booking.findById(
                bookingId
            );


        if (!bookingRecord) {

            return res.status(404).json({
                error: "Booking not found"
            });
        }


        // ======================================
        // CHECK OWNERSHIP
        // ======================================

        if (
            bookingRecord.userid.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                error:
                    "Not authorized for this booking"
            });
        }


        // ======================================
        // CHECK BOOKING STATUS
        // ======================================

        if (
            bookingRecord.status ===
            "cancelled"
        ) {

            return res.status(400).json({
                error:
                    "This booking has been cancelled"
            });
        }


        if (
            bookingRecord.paymentStatus ===
            "paid"
        ) {

            return res.status(400).json({
                error:
                    "Payment already completed"
            });
        }


        // ======================================
        // CHECK AMOUNT
        // ======================================

        if (
            typeof bookingRecord.amount !==
                "number" ||
            bookingRecord.amount <= 0
        ) {

            return res.status(400).json({
                error:
                    "Invalid booking amount"
            });
        }


        // ======================================
        // CREATE RAZORPAY ORDER
        // ======================================

        const amountInPaise =
            Math.round(
                bookingRecord.amount * 100
            );


        const razorpayOrder =
            await razorpay.orders.create({

                amount:
                    amountInPaise,

                currency:
                    "INR",

                receipt:
                    `booking_${bookingRecord._id}`,

                notes: {
                    bookingId:
                        bookingRecord._id.toString(),

                    userId:
                        req.user._id.toString()
                }
            });


        // ======================================
        // SAVE RAZORPAY ORDER ID
        // ======================================

        bookingRecord.razorpayOrderId =
            razorpayOrder.id;

        await bookingRecord.save();


        // ======================================
        // SEND ORDER DETAILS
        // ======================================

        res.json({

            message:
                "Payment order created",

            orderId:
                razorpayOrder.id,

            amount:
                razorpayOrder.amount,

            currency:
                razorpayOrder.currency,

            keyId:
                process.env.RAZORPAY_KEY_ID,

            bookingId:
                bookingRecord._id
        });


    } catch (error) {

        console.error(
            "Create Payment Order Error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to create payment order"
        });
    }
};


// ==========================================
// VERIFY RAZORPAY PAYMENT
// ==========================================

export const verifyPayment = async (req, res) => {

    try {

        const bookingId =
            req.params.id;

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;


        // ======================================
        // CHECK REQUIRED DATA
        // ======================================

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {

            return res.status(400).json({
                error:
                    "Payment verification data is missing"
            });
        }


        // ======================================
        // FIND BOOKING
        // ======================================

        const bookingRecord =
            await Booking.findById(
                bookingId
            );


        if (!bookingRecord) {

            return res.status(404).json({
                error:
                    "Booking not found"
            });
        }


        // ======================================
        // CHECK OWNERSHIP
        // ======================================

        if (
            bookingRecord.userid.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                error:
                    "Not authorized for this booking"
            });
        }


        // ======================================
        // CHECK RAZORPAY ORDER ID
        // ======================================

        if (
            bookingRecord.razorpayOrderId !==
            razorpay_order_id
        ) {

            return res.status(400).json({
                error:
                    "Invalid Razorpay order"
            });
        }


        // ======================================
        // VERIFY SIGNATURE
        // ======================================

        const generatedSignature =
            crypto
                .createHmac(
                    "sha256",
                    process.env.RAZORPAY_KEY_SECRET
                )
                .update(
                    `${razorpay_order_id}|${razorpay_payment_id}`
                )
                .digest("hex");


        if (
            generatedSignature !==
            razorpay_signature
        ) {

            return res.status(400).json({
                error:
                    "Payment verification failed"
            });
        }


        // ======================================
        // ALREADY PAID CHECK
        // ======================================

        if (
            bookingRecord.paymentStatus ===
                "paid" &&
            bookingRecord.status ===
                "confirmed"
        ) {

            return res.json({
                message:
                    "Payment already verified",

                bookingId:
                    bookingRecord._id
            });
        }


        // ======================================
        // FIND EVENT
        // ======================================

        const eventRecord =
            await Event.findById(
                bookingRecord.eventid
            );


        if (!eventRecord) {

            return res.status(404).json({
                error:
                    "Event not found"
            });
        }


        // ======================================
        // CHECK SEATS
        // ======================================

        if (
            eventRecord.availableSeats <= 0
        ) {

            return res.status(400).json({
                error:
                    "No seats available"
            });
        }


        // ======================================
        // UPDATE PAYMENT
        // ======================================

        bookingRecord.paymentStatus =
            "paid";

        bookingRecord.status =
            "confirmed";

        bookingRecord.razorpayPaymentId =
            razorpay_payment_id;

        bookingRecord.razorpaySignature =
            razorpay_signature;


        await bookingRecord.save();


        // ======================================
        // DECREASE AVAILABLE SEATS
        // ======================================

        eventRecord.availableSeats -= 1;

        await eventRecord.save();


        // ======================================
        // SEND CONFIRMATION EMAIL
        // ======================================

        await sendbookingemail(
            req.user.email,
            eventRecord.title,
            bookingRecord._id
        );


        // ======================================
        // RESPONSE
        // ======================================

        res.json({

            message:
                "Payment verified successfully",

            bookingId:
                bookingRecord._id,

            paymentStatus:
                bookingRecord.paymentStatus,

            status:
                bookingRecord.status
        });


    } catch (error) {

        console.error(
            "Verify Payment Error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to verify payment"
        });
    }
};


// ==========================================
// GET MY BOOKINGS
// ==========================================

export const getmybookings = async (req, res) => {

    try {

        const bookings =
            await Booking
                .find({
                    userid: req.user._id
                })
                .populate("eventid")
                .sort({
                    createdAt: -1
                });


        res.json(bookings);


    } catch (error) {

        console.error(
            "Get My Bookings Error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to fetch bookings"
        });
    }
};


// ==========================================
// GET ALL BOOKINGS - ADMIN
// ==========================================

export const getallbookings = async (req, res) => {

    try {

        // ======================================
        // GET ALL BOOKINGS
        // ======================================

        const bookings =
            await Booking
                .find()
                .populate("eventid")
                .sort({
                    createdAt: -1
                })
                .lean();


        // ======================================
        // GET USER IDS
        // ======================================

        const userIds =
            bookings
                .map(
                    (booking) =>
                        booking.userid
                )
                .filter(Boolean);


        // ======================================
        // GET USERS
        // ======================================

        const users =
            await User
                .find({
                    _id: {
                        $in: userIds
                    }
                })
                .select("-password")
                .lean();


        // ======================================
        // CREATE USER MAP
        // ======================================

        const userMap = {};


        users.forEach((user) => {

            userMap[
                user._id.toString()
            ] = user;

        });


        // ======================================
        // COMBINE BOOKING + USER + EVENT
        // ======================================

        const bookingsWithUsers =
            bookings.map((booking) => {

                return {
                    ...booking,

                    userId:
                        userMap[
                            booking.userid?.toString()
                        ] || null,

                    eventId:
                        booking.eventid || null
                };

            });


        // ======================================
        // RESPONSE
        // ======================================

        res.json(
            bookingsWithUsers
        );


    } catch (error) {

        console.error(
            "Get All Bookings Error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to fetch all bookings"
        });
    }
};


// ==========================================
// CANCEL BOOKING
// ==========================================

export const cancelbooking = async (req, res) => {

    try {

        const bookingRecord =
            await Booking.findById(
                req.params.id
            );


        if (!bookingRecord) {

            return res.status(404).json({
                error:
                    "Booking not found"
            });
        }


        // ======================================
        // CHECK OWNERSHIP
        // ======================================

        if (
            bookingRecord.userid.toString() !==
            req.user._id.toString()
        ) {

            return res.status(403).json({
                error:
                    "Not authorized to cancel this booking"
            });
        }


        // ======================================
        // RETURN SEAT IF CONFIRMED
        // ======================================

        if (
            bookingRecord.status ===
            "confirmed"
        ) {

            const eventRecord =
                await Event.findById(
                    bookingRecord.eventid
                );


            if (eventRecord) {

                eventRecord.availableSeats += 1;

                await eventRecord.save();
            }
        }


        // ======================================
        // MARK BOOKING AS CANCELLED
        // ======================================

        bookingRecord.status =
            "cancelled";

        await bookingRecord.save();


        res.json({
            message:
                "Booking cancelled successfully"
        });


    } catch (error) {

        console.error(
            "Cancel Booking Error:",
            error
        );

        res.status(500).json({
            error:
                "Unable to cancel booking"
        });
    }
};