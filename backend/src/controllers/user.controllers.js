const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const httpStatus = require("http-status");
const crypto = require("crypto")


const { User } = require("../models/user.model");
const { Meeting } = require("../models/meeting.model.js");
const { error } = require("console");

const login = async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // Include username in the token payload
        const token = jwt.sign(
            {
                _id: user._id,
                username: user.username
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Set appropriate expiration
        );

        res.status(200).json({ token, user: { username: user.username } });
    } catch (e) {
        res.status(500).json({ message: "Login failed", error: e.message });
    }
};


const register = async (req, res) => {
    const { name, username, password } = req.body;

    try {

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: "User already exist" });
        }

        const hashePassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name: name,
            username: username,
            password: hashePassword,
        });

        await newUser.save();

        res.status(201).json({ message: "User registerd" })


    } catch (e) {
        console.log("Register Error", e)
        res.status(500).json({ message: "Somethings went wrong" })

    }
}
module.exports = { login, register };