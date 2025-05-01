const { Schema, mongoose } = require("mongoose");
const meetingSchema = new Schema({
    username: { type: String, required: true },  // Changed from user_id to username
    meetingCode: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Meeting = mongoose.model("Meeting", meetingSchema);

module.exports = { Meeting };