const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true // Ensures lookups are always case-insensitive
    },
    otp: {
        type: String,
        required: true
    },
    expireAt: {
        type: Date,
        required: true,
        expires: 0 // 💡 CRITICAL: Automatically deletes the document at the exact expireAt time
    }
});

module.exports = mongoose.model('Otp', otpSchema);
