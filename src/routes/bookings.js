'use strict';

const express  = require('express');
const router   = express.Router();
const { createBooking, getUserBookings } = require('../controllers/bookingController');

/**
 * POST /bookings             — Book a ticket (transactional)
 * GET  /users/:id/bookings   — All bookings for a user
 *
 * Note: /users/:id/bookings is mounted here under the '/users' prefix
 * configured in app.js, so the full path is /users/:id/bookings.
 */
router.post('/', createBooking);

module.exports = { bookingsRouter: router };
