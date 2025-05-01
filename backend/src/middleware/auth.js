const jwt = require('jsonwebtoken');

const authenticate = async (req, res, next) => {
    try {
        // Get token from header or cookies
        const token = req.header('Authorization')?.replace('Bearer ', '') ||
            req.cookies?.token;

        if (!token) {
            console.log("No token provided");
            return res.status(401).json({ error: 'Authentication required' });
        }

        console.log("Received token:", token); // Debug log

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.username) {
            console.log("Token missing username");
            return res.status(401).json({ error: 'Invalid token format' });
        }

        req.user = {
            _id: decoded._id,
            username: decoded.username
        };

        next();
    } catch (err) {
        console.error("Authentication error:", err.message);

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }

        res.status(401).json({ error: err.message });
    }
};


module.exports = {
    authenticate
};