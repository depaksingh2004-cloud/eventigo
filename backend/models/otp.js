import mongoose from "mongoose";


const otpschema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
	},
	otp: {
		type: String,
		required: true,
	},
	action: {
        type: String,
        enum: ['account_verification', 'event_booking'],
        required: true

    },
    createdAt:{
        type: Date,
        default: Date.now,
        expires: 300 
    }
});

export default mongoose.model("OTP", otpschema);