'use strict';

const { v4: uuidv4 } = require('uuid');
const Joi            = require('joi');
const pool           = require('../config/db');

// ─── Validation Schemas ────────────────────────────────────────────────────

const createBookingSchema = Joi.object({
  user_id:  Joi.number().integer().positive().required(),
  event_id: Joi.number().integer().positive().required(),
});

// ─── Helpers ───────────────────────────────────────────────────────────────

const makeError = (message, status = 500) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ─── Controllers ──────────────────────────────────────────────────────────

/**
 * POST /bookings
 *
 * Books a ticket for a user:
 *  1. Validates input.
 *  2. Verifies the user exists.
 *  3. Verifies the event exists and has remaining tickets.
 *  4. Opens a transaction, locks the event row with SELECT ... FOR UPDATE
 *     (prevents race conditions / overselling), decrements remaining_tickets,
 *     and inserts the booking with a UUID booking_code.
 *  5. Returns the new booking including the unique booking_code.
 */
const createBooking = async (req, res, next) => {
  // 1. Validate input
  const { error, value } = createBookingSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  const { user_id, event_id } = value;
  const conn = await pool.getConnection();

  try {
    // 2. Verify user exists
    const [users] = await conn.query('SELECT id FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      conn.release();
      return next(makeError(`User with id ${user_id} not found.`, 404));
    }

    // 3. Begin transaction
    await conn.beginTransaction();

    // 4. Lock the event row to prevent race conditions
    const [events] = await conn.query(
      'SELECT id, title, remaining_tickets FROM events WHERE id = ? FOR UPDATE',
      [event_id]
    );

    if (events.length === 0) {
      await conn.rollback();
      conn.release();
      return next(makeError(`Event with id ${event_id} not found.`, 404));
    }

    const event = events[0];

    if (event.remaining_tickets <= 0) {
      await conn.rollback();
      conn.release();
      return next(makeError('No tickets available for this event.', 409));
    }

    // 5. Check for duplicate booking (same user + event)
    const [existingBookings] = await conn.query(
      'SELECT id FROM bookings WHERE user_id = ? AND event_id = ?',
      [user_id, event_id]
    );
    if (existingBookings.length > 0) {
      await conn.rollback();
      conn.release();
      return next(makeError('You have already booked a ticket for this event.', 409));
    }

    // 6. Generate unique booking code
    const booking_code = uuidv4();

    // 7. Insert booking
    const [bookingResult] = await conn.query(
      `INSERT INTO bookings (user_id, event_id, booking_code)
       VALUES (?, ?, ?)`,
      [user_id, event_id, booking_code]
    );

    // 8. Decrement remaining_tickets
    await conn.query(
      'UPDATE events SET remaining_tickets = remaining_tickets - 1 WHERE id = ?',
      [event_id]
    );

    // 9. Commit
    await conn.commit();
    conn.release();

    // 10. Fetch the created booking for response
    const [bookings] = await pool.query(
      `SELECT b.id, b.user_id, b.event_id, b.booking_date, b.booking_code,
              e.title AS event_title, e.date AS event_date
       FROM bookings b
       JOIN events e ON e.id = b.event_id
       WHERE b.id = ?`,
      [bookingResult.insertId]
    );

    return res.status(201).json({
      success:  true,
      message:  'Booking confirmed!',
      data:     bookings[0],
    });
  } catch (err) {
    await conn.rollback().catch(() => {});
    conn.release();
    next(err);
  }
};

/**
 * GET /users/:id/bookings
 * Retrieve all bookings made by a specific user, with event details.
 */
const getUserBookings = async (req, res, next) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return next(makeError('Invalid user id.', 400));
  }

  try {
    // Verify user exists
    const [users] = await pool.query('SELECT id, name, email FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return next(makeError(`User with id ${userId} not found.`, 404));
    }

    const [bookings] = await pool.query(
      `SELECT
         b.id            AS booking_id,
         b.booking_code,
         b.booking_date,
         e.id            AS event_id,
         e.title         AS event_title,
         e.description   AS event_description,
         e.date          AS event_date,
         e.total_capacity,
         e.remaining_tickets
       FROM bookings b
       JOIN events e ON e.id = b.event_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC`,
      [userId]
    );

    return res.json({
      success: true,
      user:    users[0],
      data:    bookings,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBooking, getUserBookings };
