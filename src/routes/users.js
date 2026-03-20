'use strict';

const express  = require('express');
const router   = express.Router({ mergeParams: true });
const { getUserBookings } = require('../controllers/bookingController');

/**
 * GET /users/:id/bookings
 */
router.get('/:id/bookings', getUserBookings);

module.exports = router;
