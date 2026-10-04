import event from "../models/events.js";


// ==========================================
// GET ALL EVENTS
// ==========================================

export const getAllEvents = async (req, res) => {
    try {

        const {
            category,
            ticketPrice,
            search
        } = req.query;

        const filter = {};

        // Category filter
        if (category) {
            filter.category = category;
        }

        // Ticket price filter
        if (ticketPrice !== undefined && ticketPrice !== "") {
            filter.ticketPrice = Number(ticketPrice);
        }

        // Search filter
        if (search && search.trim() !== "") {

            const searchText = search.trim();

            filter.$or = [
                {
                    title: {
                        $regex: searchText,
                        $options: "i"
                    }
                },
                {
                    description: {
                        $regex: searchText,
                        $options: "i"
                    }
                },
                {
                    location: {
                        $regex: searchText,
                        $options: "i"
                    }
                },
                {
                    category: {
                        $regex: searchText,
                        $options: "i"
                    }
                }
            ];
        }

        const events = await event.find(filter)
            .sort({ date: 1 });

        res.status(200).json(events);

    } catch (error) {

        console.error(
            "Get All Events Error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
};


// ==========================================
// GET EVENT BY ID
// ==========================================

export const geteventbyid = async (req, res) => {
    try {

        const foundEvent = await event.findById(
            req.params.id
        );

        if (!foundEvent) {
            return res.status(404).json({
                message: "Event not found",
            });
        }

        res.status(200).json(foundEvent);

    } catch (error) {

        console.error(
            "Get Event By ID Error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
};


// ==========================================
// CREATE EVENT - ADMIN
// ==========================================

export const createevent = async (req, res) => {
    try {

        const {
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            ticketPrice,
            imageUrl
        } = req.body;


        // ======================================
        // VALIDATION
        // ======================================

        if (
            !title ||
            !description ||
            !date ||
            !location ||
            !category
        ) {
            return res.status(400).json({
                message: "Please provide all required event details"
            });
        }


        if (
            totalSeats === undefined ||
            Number(totalSeats) < 1
        ) {
            return res.status(400).json({
                message: "Total seats must be at least 1"
            });
        }


        if (
            ticketPrice === undefined ||
            Number(ticketPrice) < 0
        ) {
            return res.status(400).json({
                message: "Ticket price cannot be negative"
            });
        }


        // ======================================
        // CREATE EVENT
        // ======================================

        const newEvent = await event.create({

            title: title.trim(),

            description: description.trim(),

            date,

            location: location.trim(),

            category: category.trim(),

            totalSeats: Number(totalSeats),

            availableSeats: Number(totalSeats),

            ticketPrice: Number(ticketPrice),

            imageUrl: imageUrl?.trim() || "",

            createdBy: req.user._id
        });


        res.status(201).json(newEvent);

    } catch (error) {

        console.error(
            "Create Event Error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
};


// ==========================================
// UPDATE EVENT - ADMIN
// ==========================================

export const updateevent = async (req, res) => {
    try {

        const eventRecord = await event.findById(
            req.params.id
        );

        if (!eventRecord) {
            return res.status(404).json({
                message: "Event not found"
            });
        }


        const {
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            ticketPrice,
            imageUrl
        } = req.body;


        // ======================================
        // VALIDATION
        // ======================================

        if (
            !title ||
            !description ||
            !date ||
            !location ||
            !category
        ) {
            return res.status(400).json({
                message: "Please provide all required event details"
            });
        }


        if (
            totalSeats === undefined ||
            Number(totalSeats) < 1
        ) {
            return res.status(400).json({
                message: "Total seats must be at least 1"
            });
        }


        if (
            ticketPrice === undefined ||
            Number(ticketPrice) < 0
        ) {
            return res.status(400).json({
                message: "Ticket price cannot be negative"
            });
        }


        // ======================================
        // HANDLE SEAT CHANGE
        // ======================================

        const oldTotalSeats =
            Number(eventRecord.totalSeats || 0);

        const oldAvailableSeats =
            Number(eventRecord.availableSeats || 0);

        const newTotalSeats =
            Number(totalSeats);


        /*
         * Calculate how many seats have already
         * been booked.
         */

        const bookedSeats =
            oldTotalSeats - oldAvailableSeats;


        /*
         * Do not allow admin to reduce total seats
         * below already booked seats.
         */

        if (newTotalSeats < bookedSeats) {
            return res.status(400).json({
                message:
                    `Total seats cannot be less than already booked seats (${bookedSeats})`
            });
        }


        /*
         * Preserve already booked seats.
         *
         * Example:
         *
         * Old:
         * Total = 100
         * Available = 80
         * Booked = 20
         *
         * New total = 120
         *
         * New available = 100
         */

        const newAvailableSeats =
            newTotalSeats - bookedSeats;


        // ======================================
        // UPDATE EVENT
        // ======================================

        eventRecord.title =
            title.trim();

        eventRecord.description =
            description.trim();

        eventRecord.date =
            date;

        eventRecord.location =
            location.trim();

        eventRecord.category =
            category.trim();

        eventRecord.totalSeats =
            newTotalSeats;

        eventRecord.availableSeats =
            newAvailableSeats;

        eventRecord.ticketPrice =
            Number(ticketPrice);

        eventRecord.imageUrl =
            imageUrl?.trim() || "";


        await eventRecord.save();


        res.status(200).json(
            eventRecord
        );

    } catch (error) {

        console.error(
            "Update Event Error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
};


// ==========================================
// DELETE EVENT - ADMIN
// ==========================================

export const deleteevent = async (req, res) => {
    try {

        const deletedEvent =
            await event.findByIdAndDelete(
                req.params.id
            );

        if (!deletedEvent) {
            return res.status(404).json({
                message: "Event not found",
            });
        }

        res.status(200).json({
            message: "Event deleted successfully",
        });

    } catch (error) {

        console.error(
            "Delete Event Error:",
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
};