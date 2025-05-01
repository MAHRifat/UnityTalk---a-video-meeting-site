// routes/meetings.routes.js
const { Router } = require('express');
const { addToHistory, getHistory } = require('../controllers/meeting.controllers.js');
const { authenticate } = require('../middleware/auth.js');

console.log('addToHistory type:', typeof addToHistory);
console.log('getHistory type:', typeof getHistory);

const router = Router();

router.post('/add_meeting', authenticate, addToHistory);
router.get('/get_meetings', authenticate, getHistory);

module.exports = router;