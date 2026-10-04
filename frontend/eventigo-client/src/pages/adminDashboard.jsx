import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authcontext";
import api from "../utils/axios";

const AdminDashboard = () => {
    const { user, loading: authLoading } = useContext(AuthContext);
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [bookings, setBookings] = useState([]);

    const [loading, setLoading] = useState(true);
    const [showEventForm, setShowEventForm] = useState(false);

    const [editingEventId, setEditingEventId] = useState(null);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        date: "",
        location: "",
        category: "",
        totalSeats: "",
        ticketPrice: "",
        image: "",
    });

    // ==========================================
    // AUTH CHECK
    // ==========================================

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            navigate("/login", { replace: true });
            return;
        }

        if (user.role !== "admin") {
            navigate("/", { replace: true });
            return;
        }

        fetchData();
    }, [user, authLoading, navigate]);

    // ==========================================
    // FETCH ADMIN DATA
    // ==========================================

    const fetchData = async () => {
        try {
            setLoading(true);

            const [eventsRes, bookingsRes] = await Promise.all([
                api.get("/event"),
                api.get("/bookings/all"),
            ]);

            const eventsData = Array.isArray(eventsRes.data)
                ? eventsRes.data
                : eventsRes.data?.events || [];

            const bookingsData = Array.isArray(bookingsRes.data)
                ? bookingsRes.data
                : bookingsRes.data?.bookings || [];

            setEvents(eventsData);
            setBookings(bookingsData);

        } catch (error) {
            console.error("Error fetching admin data:", error);

            setEvents([]);
            setBookings([]);

            if (error.response?.status === 401) {
                localStorage.removeItem("user");
                localStorage.removeItem("token");

                navigate("/login", {
                    replace: true,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // RESET FORM
    // ==========================================

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            date: "",
            location: "",
            category: "",
            totalSeats: "",
            ticketPrice: "",
            image: "",
        });

        setEditingEventId(null);
        setShowEventForm(false);
    };

    // ==========================================
    // CREATE EVENT
    // ==========================================

    const handleCreateEvent = async (e) => {
        e.preventDefault();

        try {
            await api.post("/event", {
                title: formData.title,
                description: formData.description,
                date: formData.date,
                location: formData.location,
                category: formData.category,
                totalSeats: Number(formData.totalSeats),
                ticketPrice: Number(formData.ticketPrice),
                imageUrl: formData.image,
            });

            alert("Event created successfully!");

            resetForm();

            fetchData();

        } catch (error) {
            console.error("Error creating event:", error);

            alert(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Error creating event"
            );
        }
    };

    // ==========================================
    // START EDIT EVENT
    // ==========================================

    const handleEditEvent = (event) => {
        setEditingEventId(event._id);

        setFormData({
            title: event.title || "",
            description: event.description || "",
            date: event.date
                ? new Date(event.date)
                    .toISOString()
                    .split("T")[0]
                : "",
            location: event.location || "",
            category: event.category || "",
            totalSeats: event.totalSeats ?? "",
            ticketPrice: event.ticketPrice ?? "",
            image: event.imageUrl || "",
        });

        setShowEventForm(true);

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    // ==========================================
    // UPDATE EVENT
    // ==========================================

    const handleUpdateEvent = async (e) => {
        e.preventDefault();

        if (!editingEventId) {
            return;
        }

        try {
            await api.put(`/event/${editingEventId}`, {
                title: formData.title,
                description: formData.description,
                date: formData.date,
                location: formData.location,
                category: formData.category,
                totalSeats: Number(formData.totalSeats),
                ticketPrice: Number(formData.ticketPrice),
                imageUrl: formData.image,
            });

            alert("Event updated successfully!");

            resetForm();

            fetchData();

        } catch (error) {
            console.error("Error updating event:", error);

            alert(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Error updating event"
            );
        }
    };

    // ==========================================
    // DELETE EVENT
    // ==========================================

    const handleDeleteEvent = async (id) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this event?"
            )
        ) {
            return;
        }

        try {
            await api.delete(`/event/${id}`);

            alert("Event deleted successfully!");

            fetchData();

        } catch (error) {
            console.error("Error deleting event:", error);

            alert(
                error.response?.data?.message ||
                error.response?.data?.error ||
                "Error deleting event"
            );
        }
    };

    // ==========================================
    // LOADING
    // ==========================================

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-2xl font-bold">
                        Loading admin panel...
                    </div>

                    <p className="text-gray-500 mt-2">
                        Please wait...
                    </p>
                </div>
            </div>
        );
    }

    // ==========================================
    // REVENUE
    // ==========================================

    const totalRevenue = bookings.reduce(
        (sum, booking) => {
            if (
                booking.paymentStatus === "paid" &&
                booking.status === "confirmed"
            ) {
                return sum + Number(
                    booking.amount || 0
                );
            }

            return sum;
        },
        0
    );

    // ==========================================
    // PAID CLIENTS
    // ==========================================

    const paidClients = new Set(
        bookings
            .filter(
                (booking) =>
                    booking.paymentStatus === "paid" &&
                    booking.status === "confirmed"
            )
            .map(
                (booking) =>
                    booking.userId?._id ||
                    booking.userid?._id ||
                    booking.userid
            )
            .filter(Boolean)
    ).size;

    // ==========================================
    // PENDING BOOKINGS
    // ==========================================

    const pendingRequests = bookings.filter(
        (booking) =>
            booking.status === "pending"
    ).length;

    // ==========================================
    // RETURN UI
    // ==========================================

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* ======================================
                HEADER
            ====================================== */}

            <div className="bg-black text-white rounded-2xl p-6 sm:p-8 mb-8 shadow-lg flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">

                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
                        Admin Dashboard
                    </h1>

                    <p className="text-gray-300">
                        Manage events and monitor bookings.
                    </p>
                </div>

                <button
                    onClick={() => {
                        if (showEventForm) {
                            resetForm();
                        } else {
                            setEditingEventId(null);

                            setFormData({
                                title: "",
                                description: "",
                                date: "",
                                location: "",
                                category: "",
                                totalSeats: "",
                                ticketPrice: "",
                                image: "",
                            });

                            setShowEventForm(true);
                        }
                    }}
                    className="w-full md:w-auto bg-white text-black font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition shadow-md"
                >
                    {showEventForm
                        ? "Cancel"
                        : "+ Create New Event"}
                </button>

            </div>


            {/* ======================================
                STATS
            ====================================== */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                {/* REVENUE */}

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">

                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">
                            Total Revenue
                        </p>

                        <h3 className="text-3xl font-black text-green-600">
                            ₹{totalRevenue}
                        </h3>
                    </div>

                    <div className="w-12 h-12 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-xl font-bold">
                        ₹
                    </div>

                </div>


                {/* PAID CLIENTS */}

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">

                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">
                            Paid Clients
                        </p>

                        <h3 className="text-3xl font-black text-blue-600">
                            {paidClients}
                        </h3>
                    </div>

                    <div className="w-12 h-12 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-xl font-bold">
                        👤
                    </div>

                </div>


                {/* PENDING */}

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">

                    <div>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-1">
                            Pending Requests
                        </p>

                        <h3 className="text-3xl font-black text-yellow-600">
                            {pendingRequests}
                        </h3>
                    </div>

                    <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xl font-bold">
                        ⏳
                    </div>

                </div>

            </div>


            {/* ======================================
                CREATE / EDIT EVENT FORM
            ====================================== */}

            {showEventForm && (

                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 mb-8">

                    <div className="flex items-center justify-between mb-6">

                        <h2 className="text-2xl font-bold text-gray-800">
                            {editingEventId
                                ? "Edit Event"
                                : "Create New Event"}
                        </h2>

                        {editingEventId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-sm font-semibold text-gray-500 hover:text-black"
                            >
                                Cancel Edit
                            </button>
                        )}

                    </div>


                    <form
                        onSubmit={
                            editingEventId
                                ? handleUpdateEvent
                                : handleCreateEvent
                        }
                        className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >

                        {/* TITLE */}

                        <input
                            required
                            type="text"
                            placeholder="Event Title"
                            className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    title: e.target.value,
                                })
                            }
                        />


                        {/* CATEGORY */}

                        <input
                            required
                            type="text"
                            placeholder="Category (e.g., Tech, Music)"
                            className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition"
                            value={formData.category}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    category: e.target.value,
                                })
                            }
                        />


                        {/* DATE */}

                        <input
                            required
                            type="date"
                            className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition"
                            value={formData.date}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    date: e.target.value,
                                })
                            }
                        />


                        {/* LOCATION */}

                        <input
                            required
                            type="text"
                            placeholder="Location"
                            className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition"
                            value={formData.location}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    location: e.target.value,
                                })
                            }
                        />


                        {/* TOTAL SEATS */}

                        <input
                            required
                            type="number"
                            min="1"
                            placeholder="Total Seats"
                            className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition"
                            value={formData.totalSeats}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    totalSeats: e.target.value,
                                })
                            }
                        />


                        {/* TICKET PRICE */}

                        <input
                            required
                            type="number"
                            min="0"
                            placeholder="Ticket Price"
                            className="border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition"
                            value={formData.ticketPrice}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    ticketPrice: e.target.value,
                                })
                            }
                        />


                        {/* IMAGE */}

                        <div className="md:col-span-2">

                            <input
                                type="text"
                                placeholder="Image URL"
                                className="w-full border px-4 py-3 rounded-lg focus:ring-2 focus:ring-gray-700 outline-none transition"
                                value={formData.image}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        image: e.target.value,
                                    })
                                }
                            />

                            <p className="text-xs text-gray-400 mt-2">
                                Use a direct image URL.
                            </p>

                        </div>


                        {/* DESCRIPTION */}

                        <textarea
                            required
                            placeholder="Event Description"
                            className="border px-4 py-3 rounded-lg md:col-span-2 h-32 focus:ring-2 focus:ring-gray-700 outline-none transition resize-none"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    description: e.target.value,
                                })
                            }
                        />


                        {/* SUBMIT */}

                        <button
                            type="submit"
                            className="md:col-span-2 bg-gray-900 text-white font-bold py-3 mt-2 rounded-lg hover:bg-black transition shadow-md"
                        >
                            {editingEventId
                                ? "Update Event"
                                : "Publish Event"}
                        </button>

                    </form>

                </div>
            )}


            {/* ======================================
                MAIN CONTENT
            ====================================== */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">


                {/* ==================================
                    ALL EVENTS
                ================================== */}

                <div className="flex flex-col">

                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">

                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm">
                            {events.length}
                        </span>

                        All Events

                    </h2>


                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                        <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">

                            {events.length === 0 ? (

                                <li className="p-6 text-gray-500 text-center">
                                    No events created yet.
                                </li>

                            ) : (

                                events.map((event) => (

                                    <li
                                        key={event._id}
                                        className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-50 transition"
                                    >

                                        <div>

                                            <h4 className="font-bold text-gray-900 mb-1 leading-tight">
                                                {event.title}
                                            </h4>


                                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">

                                                <span className="flex items-center gap-1 font-medium">

                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>

                                                    {event.date
                                                        ? new Date(
                                                            event.date
                                                        ).toLocaleDateString()
                                                        : "No date"}

                                                </span>


                                                <span className="flex items-center gap-1 font-medium">

                                                    <div
                                                        className={`w-2 h-2 rounded-full ${
                                                            Number(
                                                                event.availableSeats
                                                            ) > 0
                                                                ? "bg-green-500"
                                                                : "bg-red-500"
                                                        }`}
                                                    ></div>

                                                    {event.availableSeats ?? 0}/
                                                    {event.totalSeats ?? 0} seats

                                                </span>

                                            </div>

                                        </div>


                                        {/* EVENT ACTIONS */}

                                        <div className="flex gap-2 w-full sm:w-auto">

                                            <button
                                                onClick={() =>
                                                    handleEditEvent(event)
                                                }
                                                className="flex-1 sm:flex-none text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm"
                                            >
                                                Edit
                                            </button>


                                            <button
                                                onClick={() =>
                                                    handleDeleteEvent(
                                                        event._id
                                                    )
                                                }
                                                className="flex-1 sm:flex-none text-red-500 hover:text-white hover:bg-red-500 border border-red-200 px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm"
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </li>

                                ))

                            )}

                        </ul>

                    </div>

                </div>


                {/* ==================================
                    ALL BOOKINGS
                ================================== */}

                <div className="flex flex-col">

                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-3">

                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 text-sm font-bold">
                            {bookings.length}
                        </span>

                        All Bookings

                    </h2>


                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                        <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">

                            {bookings.length === 0 ? (

                                <li className="p-6 text-gray-500 text-center">
                                    No bookings yet.
                                </li>

                            ) : (

                                bookings.map((booking) => {

                                    const bookingEvent =
                                        booking.eventId ||
                                        booking.eventid;

                                    const bookingUser =
                                        booking.userId ||
                                        booking.userid;

                                    const bookedDate =
                                        booking.createdAt ||
                                        booking.bookedAt ||
                                        booking.updatedAt;

                                    return (

                                        <li
                                            key={booking._id}
                                            className={`p-6 hover:bg-gray-50 transition border-l-4 ${
                                                booking.status === "pending"
                                                    ? "border-l-yellow-400"
                                                    : booking.status === "confirmed"
                                                        ? "border-l-green-400"
                                                        : "border-l-red-400"
                                            }`}
                                        >

                                            {/* BOOKING HEADER */}

                                            <div className="flex justify-between items-start mb-3">

                                                <div>

                                                    <h4 className="font-bold text-gray-900 text-lg leading-tight">
                                                        {bookingEvent?.title ||
                                                            "Deleted Event"}
                                                    </h4>

                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Booking ID:{" "}
                                                        {booking._id}
                                                    </p>

                                                </div>


                                                <div className="flex flex-col gap-1 items-end shrink-0 ml-4">

                                                    <span
                                                        className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${
                                                            booking.status === "confirmed"
                                                                ? "bg-green-100 text-green-700"
                                                                : booking.status === "cancelled"
                                                                    ? "bg-red-100 text-red-700"
                                                                    : "bg-yellow-100 text-yellow-700"
                                                        }`}
                                                    >
                                                        {booking.status ||
                                                            "unknown"}
                                                    </span>


                                                    <span
                                                        className={`px-2 py-1 text-[10px] font-black rounded uppercase tracking-wider ${
                                                            booking.paymentStatus ===
                                                            "paid"
                                                                ? "bg-indigo-100 text-indigo-700"
                                                                : "bg-gray-200 text-gray-800"
                                                        }`}
                                                    >
                                                        {(
                                                            booking.paymentStatus ||
                                                            "non_paid"
                                                        ).replace(
                                                            "_",
                                                            " "
                                                        )}
                                                    </span>

                                                </div>

                                            </div>


                                            {/* BOOKING DETAILS */}

                                            <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100 text-sm">


                                                {/* USER */}

                                                <p className="text-gray-700 flex flex-wrap items-center gap-2 mb-2">

                                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">
                                                        User:
                                                    </span>

                                                    <span className="font-semibold">
                                                        {bookingUser?.name ||
                                                            "Unknown User"}
                                                    </span>

                                                </p>


                                                {/* EMAIL */}

                                                <p className="text-gray-700 flex flex-wrap items-center gap-2 mb-2">

                                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">
                                                        Email:
                                                    </span>

                                                    <span className="text-gray-600 break-all">
                                                        {bookingUser?.email ||
                                                            "N/A"}
                                                    </span>

                                                </p>


                                                {/* AMOUNT */}

                                                <p className="text-gray-700 flex items-center gap-2 mb-2">

                                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">
                                                        Amount:
                                                    </span>

                                                    <span
                                                        className={`font-semibold ${
                                                            Number(
                                                                booking.amount ||
                                                                0
                                                            ) === 0
                                                                ? "text-green-600"
                                                                : ""
                                                        }`}
                                                    >
                                                        {Number(
                                                            booking.amount ||
                                                            0
                                                        ) === 0
                                                            ? "Free"
                                                            : "₹" +
                                                              booking.amount}
                                                    </span>

                                                </p>


                                                {/* DATE */}

                                                <p className="text-gray-700 flex flex-wrap items-center gap-2 mb-2">

                                                    <span className="font-bold w-16 text-gray-500 uppercase text-xs">
                                                        Booked:
                                                    </span>

                                                    <span>
                                                        {bookedDate
                                                            ? new Date(
                                                                bookedDate
                                                            ).toLocaleString()
                                                            : "N/A"}
                                                    </span>

                                                </p>


                                                {/* EVENT LOCATION */}

                                                {bookingEvent && (
                                                    <p className="text-gray-700 flex flex-wrap items-center gap-2 mb-2">

                                                        <span className="font-bold w-16 text-gray-500 uppercase text-xs">
                                                            Location:
                                                        </span>

                                                        <span>
                                                            {bookingEvent.location ||
                                                                "N/A"}
                                                        </span>

                                                    </p>
                                                )}


                                                {/* SEATS */}

                                                {bookingEvent && (
                                                    <p className="text-gray-700 flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">

                                                        <span className="font-bold w-16 text-gray-500 uppercase text-xs">
                                                            Seats:
                                                        </span>

                                                        <span
                                                            className={`font-bold ${
                                                                Number(
                                                                    bookingEvent.availableSeats
                                                                ) > 0
                                                                    ? "text-green-600"
                                                                    : "text-red-500"
                                                            }`}
                                                        >
                                                            {bookingEvent.availableSeats ??
                                                                0}
                                                        </span>

                                                        <span>
                                                            remaining of{" "}
                                                            {bookingEvent.totalSeats ??
                                                                0}
                                                        </span>

                                                    </p>
                                                )}

                                            </div>

                                        </li>

                                    );
                                })

                            )}

                        </ul>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default AdminDashboard;