const { Meeting } = require("../models/meeting.model.js");

// Add to meeting history
const addToHistory = async (req, res) => {
    try {
        if (!req.user?.username) {
            return res.status(401).json({ error: 'User authentication failed' });
        }

        const { meeting_code } = req.body;

        // Create new meeting record
        const meeting = new Meeting({
            meetingCode: meeting_code,
            username: req.user.username
        });

        await meeting.save();

        // Return success even if duplicate (allow joining)
        res.status(201).json({
            success: true,
            meeting
        });
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
            res.status(200).json({
                success: true,
                message: "Meeting already recorded"
            });
        } else {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
};

const getHistory = async (req, res) => {
    try {
        if (!req.user?.username) {
            return res.status(401).json({ error: 'User authentication failed' });
        }

        const meetings = await Meeting.find({ username: req.user.username })
            .sort({ joinedAt: -1 });

        res.status(200).json({
            success: true,
            meetings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

module.exports = { addToHistory, getHistory };