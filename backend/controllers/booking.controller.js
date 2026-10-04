import Otp from "../models/otp.js";
import Event from "../models/events.js";
import Booking from "../models/Bookings.js";
import User from "../models/user.js";

import {
    sendotpemail,
    sendbookingemail
} from "../utils/email.js";


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
                "Booking created successfully.",

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

        const bookings =
            await Booking
                .find()
                .populate("eventid")
                .sort({
                    createdAt: -1
                })
                .lean();


        const userIds =
            bookings
                .map(
                    (booking) =>
                        booking.userid
                )
                .filter(Boolean);


        const users =
            await User
                .find({
                    _id: {
                        $in: userIds
                    }
                })
                .select("-password")
                .lean();


        const userMap = {};


        users.forEach((user) => {

            userMap[
                user._id.toString()
            ] = user;

        });


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