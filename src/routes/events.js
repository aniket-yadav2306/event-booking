'use strict';

const express    = require('express');
const router     = express.Router();
const { listEvents, createEvent } = require('../controllers/eventController');

/**
 * GET  /events   — List all upcoming events
 * POST /events   — Create a new event
 */
router.get('/',  listEvents);
router.post('/', createEvent);

module.exports = router;
