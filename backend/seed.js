import dotenv from "dotenv";
import mongoose from "mongoose";

import User from "./models/user.js";
import Event from "./models/events.js";

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);

        console.log("MongoDB connected");

        // Existing admin ko database se find karo
        const admin = await User.findOne({ role: "admin" });

        if (!admin) {
            throw new Error(
                "Admin user not found. Please create/login with an admin account first."
            );
        }

        console.log("Admin found:", admin.email);

        // Events
        const events = [
            {
                title: "Delhi Music Festival",
                description:
                    "A live music festival featuring popular artists and amazing performances.",
                date: new Date("2026-10-15"),
                location: "Jawaharlal Nehru Stadium, Delhi",
                category: "Music",
                totalSeats: 500,
                availableSeats: 500,
                ticketPrice: 999,
                imageUrl:
                    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a",
                createdBy: admin._id,
            },

            {
                title: "Tech Conference 2026",
                description:
                    "A technology conference covering web development, AI and modern software development.",
                date: new Date("2026-11-05"),
                location: "India Expo Mart, Greater Noida",
                category: "Technology",
                totalSeats: 300,
                availableSeats: 300,
                ticketPrice: 1499,
                imageUrl:
                    "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
                createdBy: admin._id,
            },

            {
                title: "Stand Up Comedy Night",
                description:
                    "Enjoy an evening full of comedy, fun and entertainment.",
                date: new Date("2026-10-25"),
                location: "The Laugh Club, Gurgaon",
                category: "Comedy",
                totalSeats: 150,
                availableSeats: 150,
                ticketPrice: 599,
                imageUrl:
                    "https://images.unsplash.com/photo-1585699324551-f6c309eedeca",
                createdBy: admin._id,
            },

            {
                title: "Delhi Food Carnival",
                description:
                    "Explore delicious food from different cuisines under one roof.",
                date: new Date("2026-12-10"),
                location:
                    "Major Dhyan Chand National Stadium, Delhi",
                category: "Food",
                totalSeats: 400,
                availableSeats: 400,
                ticketPrice: 299,
                imageUrl:
                    "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
                createdBy: admin._id,
            },

            {
                title: "Photography Workshop",
                description:
                    "Learn photography basics, composition and practical camera techniques.",
                date: new Date("2026-11-20"),
                location: "Lodhi Gardens, Delhi",
                category: "Workshop",
                totalSeats: 50,
                availableSeats: 50,
                ticketPrice: 799,
                imageUrl:
                    "https://images.unsplash.com/photo-1452780212940-6f5c0d14d848",
                createdBy: admin._id,
            },
        ];

        // Sirf missing events insert karo
        let insertedCount = 0;

        for (const eventData of events) {
            const existingEvent = await Event.findOne({
                title: eventData.title,
            });

            if (existingEvent) {
                console.log(
                    `Already exists: ${eventData.title}`
                );
            } else {
                await Event.create(eventData);

                console.log(
                    `Created: ${eventData.title}`
                );

                insertedCount++;
            }
        }

        console.log("--------------------------------");
        console.log(
            `${insertedCount} new event(s) inserted successfully.`
        );

        const totalEvents = await Event.countDocuments();

        console.log(
            `Total events in database: ${totalEvents}`
        );

        console.log("--------------------------------");

        process.exit(0);
    } catch (error) {
        console.error("Seed error:", error);
        process.exit(1);
    }
};

seedData();