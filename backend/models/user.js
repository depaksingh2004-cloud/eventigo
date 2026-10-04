import mongoose from "mongoose";

const Userschema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isverified: {
        type: Boolean,
        default: false, 
    }

    
});

export default mongoose.model('user', Userschema);

