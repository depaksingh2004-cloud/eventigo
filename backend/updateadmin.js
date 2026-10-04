import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/user.js";

dotenv.config();

const updateAdmin = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error("MONGODB_URL is not defined");
        }

        await mongoose.connect(process.env.MONGODB_URL);

        console.log("MongoDB connected");

        const hashedPassword = await bcrypt.hash("Admin@123", 10);

        const admin = await User.findOneAndUpdate(
            { email: "admin@eventigo.com" },
            {
                name: "Eventigo Admin",
                password: hashedPassword,
                role: "admin",
                isverified: true
            },
            { new: true }
        );

        if (!admin) {
            console.log("Admin user not found!");
            process.exit(1);
        }

        console.log("Admin updated successfully!");
        console.log("Name:", admin.name);
        console.log("Email:", admin.email);
        console.log("Role:", admin.role);
        console.log("Password: Admin@123");

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
};

updateAdmin();