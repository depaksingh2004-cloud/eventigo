import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import authroutes from "./routes/auth.js";
import eventroutes from "./routes/event.js";
import bookingroutes from "./routes/booking.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authroutes);
app.use("/api/event", eventroutes);
app.use("/api/bookings", bookingroutes);


const port = process.env.PORT || 5000;

const startServer = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error("MONGODB_URL is not defined");
        }

        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected to MongoDB");

        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
};

startServer();

