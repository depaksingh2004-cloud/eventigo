import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		date: {
			type: Date,
			required: true,
		},
		location: {
			type: String,
			required: true,
			trim: true,
		},
        category: {
            type: String,
            required: true,
            trim: true,
        },
        totalSeats: {
            type: Number,
            required: true,
            min: 0,
        },
        availableSeats: {
            type: Number,
            required: true,
            min: 0,
        },
        ticketPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        imageUrl: {
            type: String,
            trim: true,
        },
        createdBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true
        }
        
	},  {timestamps: true});

const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);

export default Event;