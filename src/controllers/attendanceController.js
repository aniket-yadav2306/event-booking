'use strict';

const Joi  = require('joi');
const pool = require('../config/db');

// ─── Validation Schemas ────────────────────────────────────────────────────

const attendanceSchema = Joi.object({
  booking_code: Joi.string().uuid({ version: 'uuidv4' }).required()
                  .messages({ 'string.guid': 'booking_code must be a valid UUID v4.' }),
});

// ─── Helpers ───────────────────────────────────────────────────────────────

const makeError = (message, status = 500) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ─── Controllers ──────────────────────────────────────────────────────────

/**
 * POST /events/:id/attendance
 *
 * Records event attendance for a given booking_code.
 * Steps:
 *  1. Validate the booking_code in the body.
 *  2. Look up the booking by code + event_id to verify it belongs to this event.
 *  3. Prevent duplicate check-ins (unique constraint on booking_id).
 *  4. Insert into event_attendance.
 *  5. Return the total number of tickets booked for this event.
 */
const recordAttendance = async (req, res, next) => {
  const eventId = Number(req.params.id);
  if (!Number.isInteger(eventId) || eventId <= 0) {
    return next(makeError('Invalid event id.', 400));
  }

  // Validate body
  const { error, value } = attendanceSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  const { booking_code } = value;

  try {
    // 1. Verify event exists
    const [events] = await pool.query(
      'SELECT id, title FROM events WHERE id = ?',
      [eventId]
    );
    if (events.length === 0) {
      return next(makeError(`Event with id ${eventId} not found.`, 404));
    }

    // 2. Look up booking by code + event_id
    const [bookings] = await pool.query(
      `SELECT b.id AS booking_id, b.user_id, b.event_id, b.booking_date
       FROM bookings b
       WHERE b.booking_code = ? AND b.event_id = ?`,
      [booking_code, eventId]
    );

    if (bookings.length === 0) {
      return next(makeError('Invalid booking code for this event.', 404));
    }

    const booking = bookings[0];

    // 3. Check if already checked in
    const [existing] = await pool.query(
      'SELECT id FROM event_attendance WHERE booking_id = ?',
      [booking.booking_id]
    );
    if (existing.length > 0) {
      return next(makeError('This ticket has already been checked in.', 409));
    }

    // 4. Record attendance
    await pool.query(
      'INSERT INTO event_attendance (booking_id, user_id) VALUES (?, ?)',
      [booking.booking_id, booking.user_id]
    );

    // 5. Total tickets booked for this event
    const [[{ total_booked }]] = await pool.query(
      'SELECT COUNT(*) AS total_booked FROM bookings WHERE event_id = ?',
      [eventId]
    );

    return res.status(201).json({
      success:       true,
      message:       'Attendance recorded successfully.',
      event:         events[0],
      booking_code,
      total_booked:  Number(total_booked),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { recordAttendance };
