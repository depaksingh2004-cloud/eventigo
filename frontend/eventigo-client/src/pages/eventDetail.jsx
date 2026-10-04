import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { AuthContext } from '../context/authcontext';

import {
    FaCalendarAlt,
    FaMapMarkerAlt,
    FaChair,
    FaMoneyBillWave
} from 'react-icons/fa';

const EventDetail = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    // Get event ID directly from URL
    // Example: /events/6aafa1f004ab7654713fb937
    const eventId = window.location.pathname.split('/').pop();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);

    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // =========================
    // FETCH EVENT
    // =========================
    useEffect(() => {
        const fetchEvent = async () => {
            console.log('EVENT ID:', eventId);

            if (!eventId || eventId === 'events') {
                setError('Event ID not found.');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError('');

                console.log(
                    'CALLING EVENT API:',
                    `/event/${eventId}`
                );

                const response = await api.get(
                    `/event/${eventId}`
                );

                console.log(
                    'EVENT API RESPONSE:',
                    response.data
                );

                const eventData =
                    response.data?.event ?? response.data;

                console.log(
                    'EVENT DATA:',
                    eventData
                );

                setEvent(eventData);

            } catch (err) {
                console.error(
                    'EVENT API ERROR:',
                    err
                );

                console.error(
                    'ERROR RESPONSE:',
                    err?.response?.data
                );

                setError(
                    err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    'Failed to load event details.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId]);

    // =========================
    // BOOKING
    // =========================
    const handleBooking = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (!event?._id) {
            setError('Event information is missing.');
            return;
        }

        setBookingLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            // SEND OTP
            if (!showOTP) {
                await api.post('/bookings/send-otp', {
                    eventid: event._id
                });

                setShowOTP(true);

                setSuccessMsg(
                    'OTP sent to your email. Please enter the OTP to confirm your booking.'
                );
            }

            // VERIFY OTP + BOOK
            else {
                await api.post('/bookings/book', {
                    eventid: event._id,
                    otp: otp
                });

                setSuccessMsg(
                    'Booking requested successfully! Check your dashboard.'
                );

                setShowOTP(false);
                setOtp('');
            }

        } catch (err) {
            console.error('BOOKING ERROR:', err);

            setError(
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                'Booking failed.'
            );
        } finally {
            setBookingLoading(false);
        }
    };

    // =========================
    // LOADING
    // =========================
    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900"></div>

                    <p className="text-xl font-semibold text-gray-700">
                        Loading event...
                    </p>
                </div>
            </div>
        );
    }

    // =========================
    // EVENT ERROR
    // =========================
    if (!event) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-6">
                <div className="text-center">

                    <p className="mb-4 text-xl font-semibold text-red-500">
                        {error || 'Event not found.'}
                    </p>

                    <button
                        onClick={() => navigate('/')}
                        className="rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white hover:bg-black"
                    >
                        Back to Home
                    </button>

                </div>
            </div>
        );
    }

    const isSoldOut = event.availableSeats <= 0;

    return (
        <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">

            {/* IMAGE */}
            {event.imageUrl || event.image ? (
                <img
                    src={event.imageUrl || event.image}
                    alt={event.title}
                    className="h-80 w-full object-cover"
                />
            ) : (
                <div className="flex h-64 w-full items-center justify-center bg-gray-900 text-6xl font-black uppercase tracking-widest text-white/50">
                    {event.category}
                </div>
            )}

            <div className="p-8 md:p-12">

                <div className="mb-8 flex flex-col items-start justify-between gap-6 md:flex-row">

                    {/* EVENT INFO */}
                    <div className="w-full">

                        <div className="mb-3 inline-block rounded-full bg-gray-200 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-800">
                            {event.category}
                        </div>

                        <h1 className="mb-4 text-4xl font-extrabold text-gray-900">
                            {event.title}
                        </h1>

                        <p className="mb-6 text-lg leading-relaxed text-gray-600">
                            {event.description}
                        </p>

                    </div>

                    {/* BOOKING CARD */}
                    <div className="w-full shrink-0 rounded-xl border border-gray-100 bg-gray-50 p-6 shadow-sm md:w-[320px]">

                        <h3 className="mb-6 text-xl font-bold text-gray-800">
                            Booking Details
                        </h3>

                        <div className="mb-8 space-y-4">

                            {/* PRICE */}
                            <div className="flex items-center gap-4 text-gray-600">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-900">
                                    <FaMoneyBillWave />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold uppercase text-gray-400">
                                        Ticket Price
                                    </p>

                                    <p className="text-lg font-bold text-gray-800">
                                        {event.ticketPrice === 0 ? (
                                            <span className="text-green-500">
                                                Free
                                            </span>
                                        ) : (
                                            `₹${event.ticketPrice}`
                                        )}
                                    </p>
                                </div>

                            </div>

                            {/* SEATS */}
                            <div className="flex items-center gap-4 text-gray-600">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-900">
                                    <FaChair />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold uppercase text-gray-400">
                                        Availability
                                    </p>

                                    <p className="font-bold text-gray-800">
                                        <span
                                            className={
                                                event.availableSeats < 10
                                                    ? 'text-orange-500'
                                                    : ''
                                            }
                                        >
                                            {event.availableSeats}
                                        </span>{' '}
                                        / {event.totalSeats}
                                    </p>
                                </div>

                            </div>

                            {/* DATE */}
                            <div className="flex items-center gap-4 text-gray-600">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-900">
                                    <FaCalendarAlt />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold uppercase text-gray-400">
                                        Date
                                    </p>

                                    <p className="font-bold text-gray-800">
                                        {new Date(
                                            event.date
                                        ).toLocaleDateString()}
                                    </p>
                                </div>

                            </div>

                            {/* LOCATION */}
                            <div className="flex items-center gap-4 text-gray-600">

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-900">
                                    <FaMapMarkerAlt />
                                </div>

                                <div>
                                    <p className="text-sm font-semibold uppercase text-gray-400">
                                        Location
                                    </p>

                                    <p className="font-bold text-gray-800">
                                        {event.location}
                                    </p>
                                </div>

                            </div>

                        </div>

                        {/* OTP */}
                        {showOTP && (
                            <div className="mb-4">

                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Enter OTP to Confirm
                                </label>

                                <input
                                    type="text"
                                    placeholder="6-digit code"
                                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg font-bold tracking-widest shadow-sm focus:ring-2 focus:ring-gray-700"
                                    value={otp}
                                    onChange={(e) =>
                                        setOtp(e.target.value)
                                    }
                                    maxLength={6}
                                />

                            </div>
                        )}

                        {/* BUTTON */}
                        <button
                            onClick={handleBooking}
                            disabled={
                                isSoldOut ||
                                bookingLoading ||
                                (showOTP && !otp)
                            }
                            className={`w-full rounded-xl px-6 py-4 text-lg font-bold shadow-lg transition ${
                                isSoldOut ||
                                bookingLoading ||
                                (showOTP && !otp)
                                    ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                                    : 'bg-gray-900 text-white hover:-translate-y-1 hover:bg-black hover:shadow-xl'
                            }`}
                        >
                            {bookingLoading
                                ? 'Processing...'
                                : showOTP
                                ? 'Verify OTP & Confirm'
                                : isSoldOut
                                ? 'Sold Out'
                                : 'Confirm Registration'}
                        </button>

                        {/* ERROR */}
                        {error && (
                            <p className="mt-4 rounded bg-red-50 p-2 text-center font-medium text-red-500">
                                {error}
                            </p>
                        )}

                        {/* SUCCESS */}
                        {successMsg && (
                            <p className="mt-4 rounded bg-green-50 p-2 text-center font-medium text-green-600">
                                {successMsg}
                            </p>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;