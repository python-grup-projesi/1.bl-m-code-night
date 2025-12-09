const router = require('express').Router();
const { processTicket } = require('../controllers/agentController');

// POST /api/agent/process
// Bu endpoint'i Ticket Service çağıracak
router.post('/process', processTicket);

module.exports = router;