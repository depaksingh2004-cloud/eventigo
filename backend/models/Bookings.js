import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
    {
        eventid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
        },

        userid: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        amount: {
            type: Number,
            required: true,
        },

        paymentStatus: {
            type: String,
            enum: ['non_paid', 'paid'],
            default: 'non_paid',
        },

        // Razorpay Order ID
        razorpayOrderId: {
            type: String,
            default: null,
        },

        // Razorpay Payment ID
        razorpayPaymentId: {
            type: String,
            default: null,
        },

        // Razorpay Signature
        razorpaySignature: {
            type: String,
            default: null,
        },

        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

bookingSchema.index({
    eventid: 1,
    userid: 1
});

const Booking = mongoose.model(
    'Booking',
    bookingSchema
);

export default Booking;