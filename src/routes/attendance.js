'use strict';

const express  = require('express');
const router   = express.Router();
const { recordAttendance } = require('../controllers/attendanceController');

/**
 * POST /events/:id/attendance
 * Accepts { booking_code } in body, records check-in, returns total_booked.
 */
router.post('/:id/attendance', recordAttendance);

module.exports = router;
