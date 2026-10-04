import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";
import { AuthContext } from "../context/authcontext";


// ==========================================
// LOAD RAZORPAY CHECKOUT SCRIPT
// ==========================================

const loadRazorpayScript = () => {
    return new Promise((resolve) => {

        const existingScript =
            document.querySelector(
                'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
            );

        if (existingScript) {
            resolve(true);
            return;
        }

        const script =
            document.createElement("script");

        script.src =
            "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = () => {
            resolve(true);
        };

        script.onerror = () => {
            resolve(false);
        };

        document.body.appendChild(script);
    });
};


// ==========================================
// USER DASHBOARD
// ==========================================

const UserDashboard = () => {

    const {
        user,
        loading: authLoading
    } = useContext(AuthContext);

    const navigate = useNavigate();


    const [bookings, setBookings] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [paymentLoading, setPaymentLoading] =
        useState(null);

    const [cancelLoading, setCancelLoading] =
        useState(null);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // ==========================================
    // FETCH BOOKINGS
    // ==========================================

    const fetchBookings = async () => {

        try {

            setLoading(true);
            setError("");

            const response =
                await api.get("/bookings/my");

            setBookings(
                Array.isArray(response.data)
                    ? response.data
                    : []
            );

        } catch (err) {

            console.error(
                "Fetch bookings error:",
                err
            );

            setError(
                err.response?.data?.error ||
                "Unable to load bookings."
            );

        } finally {

            setLoading(false);
        }
    };


    // ==========================================
    // AUTH CHECK + FETCH
    // ==========================================

    useEffect(() => {

        if (authLoading) {
            return;
        }

        if (!user) {

            navigate(
                "/login",
                { replace: true }
            );

            return;
        }

        fetchBookings();

    }, [
        user,
        authLoading,
        navigate
    ]);


    // ==========================================
    // PAY NOW
    // ==========================================

    const handlePayment = async (booking) => {

        try {

            setPaymentLoading(
                booking._id
            );

            setError("");
            setSuccess("");


            // ======================================
            // LOAD RAZORPAY SCRIPT
            // ======================================

            const scriptLoaded =
                await loadRazorpayScript();


            if (!scriptLoaded) {

                setError(
                    "Razorpay failed to load. Please check your internet connection."
                );

                return;
            }


            // ======================================
            // CREATE PAYMENT ORDER
            // ======================================

            const orderResponse =
                await api.post(
                    `/bookings/${booking._id}/payment/order`
                );


            const {
                orderId,
                amount,
                currency,
                keyId,
                bookingId
            } = orderResponse.data;


            // ======================================
            // RAZORPAY CHECKOUT OPTIONS
            // ======================================

            const options = {

                key: keyId,

                amount: amount,

                currency: currency,

                name: "EVENTIGO",

                description:
                    `Payment for ${booking.eventid?.title || "Event"}`,

                order_id: orderId,

                handler: async function (
                    paymentResponse
                ) {

                    try {

                        // ==================================
                        // VERIFY PAYMENT WITH BACKEND
                        // ==================================

                        const verifyResponse =
                            await api.post(
                                `/bookings/${bookingId}/payment/verify`,
                                {
                                    razorpay_order_id:
                                        paymentResponse.razorpay_order_id,

                                    razorpay_payment_id:
                                        paymentResponse.razorpay_payment_id,

                                    razorpay_signature:
                                        paymentResponse.razorpay_signature
                                }
                            );


                        console.log(
                            "Payment verification response:",
                            verifyResponse.data
                        );


                        setSuccess(
                            "Payment successful! Your booking is confirmed."
                        );


                        // ==================================
                        // REFRESH BOOKINGS
                        // ==================================

                        await fetchBookings();


                    } catch (verifyError) {

                        console.error(
                            "Payment verification error:",
                            verifyError
                        );

                        setError(
                            verifyError.response?.data?.error ||
                            "Payment verification failed."
                        );
                    }
                },


                modal: {

                    ondismiss: function () {

                        console.log(
                            "Razorpay checkout closed"
                        );

                        setPaymentLoading(null);
                    }
                },


                prefill: {

                    name:
                        user?.name || "",

                    email:
                        user?.email || ""
                },


                theme: {
                    color: "#4f46e5"
                }
            };


            // ======================================
            // OPEN RAZORPAY
            // ======================================

            const razorpay =
                new window.Razorpay(
                    options
                );


            razorpay.on(
                "payment.failed",
                function (response) {

                    console.error(
                        "Razorpay payment failed:",
                        response.error
                    );

                    setError(
                        response.error?.description ||
                        "Payment failed. Please try again."
                    );

                    setPaymentLoading(null);
                }
            );


            razorpay.open();


        } catch (err) {

            console.error(
                "Payment error:",
                err
            );

            setError(
                err.response?.data?.error ||
                "Unable to start payment."
            );

        } finally {

            setPaymentLoading(null);
        }
    };


    // ==========================================
    // CANCEL BOOKING
    // ==========================================

    const handleCancelBooking = async (
        bookingId
    ) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to cancel this booking?"
            );


        if (!confirmed) {
            return;
        }


        try {

            setCancelLoading(
                bookingId
            );

            setError("");
            setSuccess("");


            await api.delete(
                `/bookings/${bookingId}`
            );


            setSuccess(
                "Booking cancelled successfully."
            );


            await fetchBookings();


        } catch (err) {

            console.error(
                "Cancel booking error:",
                err
            );

            setError(
                err.response?.data?.error ||
                "Unable to cancel booking."
            );

        } finally {

            setCancelLoading(null);
        }
    };


    // ==========================================
    // LOADING
    // ==========================================

    if (authLoading || loading) {

        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-lg font-semibold text-gray-600">
                    Loading your dashboard...
                </div>
            </div>
        );
    }


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div className="min-h-screen bg-gray-50 px-6 py-10">

            <div className="mx-auto max-w-6xl">


                {/* ==================================
                    HEADER
                ================================== */}

                <div className="mb-8">

                    <h1 className="text-3xl font-extrabold text-gray-900">
                        My Dashboard
                    </h1>

                    <p className="mt-2 text-gray-600">
                        Welcome back, {user?.name || "User"}!
                    </p>

                </div>


                {/* ==================================
                    SUCCESS MESSAGE
                ================================== */}

                {success && (

                    <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-700">
                        {success}
                    </div>

                )}


                {/* ==================================
                    ERROR MESSAGE
                ================================== */}

                {error && (

                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
                        {error}
                    </div>

                )}


                {/* ==================================
                    BOOKINGS
                ================================== */}

                <div className="mb-4 flex items-center justify-between">

                    <h2 className="text-2xl font-bold text-gray-900">
                        My Bookings
                    </h2>

                    <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
                        {bookings.length} Booking
                        {bookings.length !== 1
                            ? "s"
                            : ""}
                    </span>

                </div>


                {bookings.length === 0 ? (

                    <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

                        <h3 className="text-xl font-bold text-gray-800">
                            No bookings yet
                        </h3>

                        <p className="mt-2 text-gray-500">
                            Explore events and book your next experience.
                        </p>

                        <button
                            onClick={() =>
                                navigate("/")
                            }
                            className="mt-6 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Browse Events
                        </button>

                    </div>

                ) : (

                    <div className="space-y-6">

                        {bookings.map((booking) => {

                            const event =
                                booking.eventid;

                            const isPaid =
                                booking.paymentStatus ===
                                "paid";

                            const isConfirmed =
                                booking.status ===
                                "confirmed";

                            const isCancelled =
                                booking.status ===
                                "cancelled";

                            const isPending =
                                booking.status ===
                                "pending";


                            return (

                                <div
                                    key={booking._id}
                                    className="overflow-hidden rounded-2xl bg-white shadow-sm"
                                >

                                    {/* ==================================
                                        BOOKING HEADER
                                    ================================== */}

                                    <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-6 sm:flex-row sm:items-center">

                                        <div>

                                            <h3 className="text-xl font-bold text-gray-900">
                                                {event?.title ||
                                                    "Deleted Event"}
                                            </h3>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Booking ID:{" "}
                                                {booking._id}
                                            </p>

                                        </div>


                                        {/* STATUS BADGES */}

                                        <div className="flex flex-wrap gap-2">

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                                                    isConfirmed
                                                        ? "bg-green-100 text-green-700"
                                                        : isCancelled
                                                        ? "bg-red-100 text-red-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {booking.status}
                                            </span>


                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                                                    isPaid
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-100 text-gray-700"
                                                }`}
                                            >
                                                {booking.paymentStatus}
                                            </span>

                                        </div>

                                    </div>


                                    {/* ==================================
                                        BOOKING DETAILS
                                    ================================== */}

                                    <div className="grid gap-6 p-6 md:grid-cols-2">


                                        {/* EVENT DETAILS */}

                                        <div className="rounded-xl bg-gray-50 p-5">

                                            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
                                                Event Details
                                            </h4>

                                            <div className="space-y-3 text-sm">

                                                <div>
                                                    <span className="font-semibold text-gray-700">
                                                        Event:
                                                    </span>{" "}
                                                    {event?.title ||
                                                        "Deleted Event"}
                                                </div>

                                                <div>
                                                    <span className="font-semibold text-gray-700">
                                                        Location:
                                                    </span>{" "}
                                                    {event?.location ||
                                                        "N/A"}
                                                </div>

                                                <div>
                                                    <span className="font-semibold text-gray-700">
                                                        Date:
                                                    </span>{" "}
                                                    {event?.date
                                                        ? new Date(
                                                            event.date
                                                        ).toLocaleDateString(
                                                            "en-IN",
                                                            {
                                                                day: "2-digit",
                                                                month: "short",
                                                                year: "numeric"
                                                            }
                                                        )
                                                        : "N/A"}
                                                </div>

                                            </div>

                                        </div>


                                        {/* PAYMENT DETAILS */}

                                        <div className="rounded-xl bg-gray-50 p-5">

                                            <h4 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
                                                Payment Details
                                            </h4>

                                            <div className="space-y-3 text-sm">

                                                <div>
                                                    <span className="font-semibold text-gray-700">
                                                        Amount:
                                                    </span>{" "}
                                                    <span className="font-bold text-gray-900">
                                                        ₹
                                                        {booking.amount}
                                                    </span>
                                                </div>

                                                <div>
                                                    <span className="font-semibold text-gray-700">
                                                        Payment:
                                                    </span>{" "}
                                                    {booking.paymentStatus}
                                                </div>

                                                <div>
                                                    <span className="font-semibold text-gray-700">
                                                        Booked:
                                                    </span>{" "}
                                                    {booking.createdAt
                                                        ? new Date(
                                                            booking.createdAt
                                                        ).toLocaleString(
                                                            "en-IN"
                                                        )
                                                        : "N/A"}
                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    {/* ==================================
                                        ACTIONS
                                    ================================== */}

                                    <div className="flex flex-col gap-3 border-t border-gray-100 p-6 sm:flex-row sm:justify-end">


                                        {/* PAY NOW */}

                                        {isPending &&
                                            !isPaid &&
                                            !isCancelled && (

                                                <button
                                                    onClick={() =>
                                                        handlePayment(
                                                            booking
                                                        )
                                                    }
                                                    disabled={
                                                        paymentLoading ===
                                                        booking._id
                                                    }
                                                    className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                >

                                                    {paymentLoading ===
                                                    booking._id
                                                        ? "Opening Razorpay..."
                                                        : `Pay Now ₹${booking.amount}`}

                                                </button>

                                            )}


                                        {/* CANCEL */}

                                        {!isCancelled &&
                                            !isConfirmed && (

                                                <button
                                                    onClick={() =>
                                                        handleCancelBooking(
                                                            booking._id
                                                        )
                                                    }
                                                    disabled={
                                                        cancelLoading ===
                                                        booking._id
                                                    }
                                                    className="rounded-xl border border-red-200 bg-white px-6 py-3 font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                >

                                                    {cancelLoading ===
                                                    booking._id
                                                        ? "Cancelling..."
                                                        : "Cancel Booking"}

                                                </button>

                                            )}


                                        {/* CONFIRMED MESSAGE */}

                                        {isConfirmed &&
                                            isPaid && (

                                                <div className="rounded-xl bg-green-50 px-6 py-3 font-bold text-green-700">
                                                    ✓ Payment Complete
                                                </div>

                                            )}

                                    </div>

                                </div>

                            );
                        })}

                    </div>

                )}

            </div>

        </div>
    );
};


export default UserDashboard;