'use strict';

const pool = require('../config/db');
const Joi  = require('joi');

// ─── Validation Schemas ────────────────────────────────────────────────────

const createEventSchema = Joi.object({
  title:          Joi.string().trim().min(1).max(255).required(),
  description:    Joi.string().trim().max(2000).optional().allow(''),
  date:           Joi.date().iso().greater('now').required()
                    .messages({ 'date.greater': 'Event date must be in the future.' }),
  total_capacity: Joi.number().integer().min(1).required(),
});

// ─── Helpers ───────────────────────────────────────────────────────────────

const makeError = (message, status = 500) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ─── Controllers ──────────────────────────────────────────────────────────

/**
 * GET /events
 * List all upcoming events (date >= NOW()), ordered by date ascending.
 */
const listEvents = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         id,
         title,
         description,
         date,
         total_capacity,
         remaining_tickets,
         created_at
       FROM events
       WHERE date >= NOW()
       ORDER BY date ASC`
    );

    return res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /events
 * Create a new event. Sets remaining_tickets = total_capacity initially.
 */
const createEvent = async (req, res, next) => {
  // Validate input
  const { error, value } = createEventSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  const { title, description = null, date, total_capacity } = value;

  try {
    const [result] = await pool.query(
      `INSERT INTO events (title, description, date, total_capacity, remaining_tickets)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, new Date(date), total_capacity, total_capacity]
    );

    const [rows] = await pool.query(
      'SELECT * FROM events WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { listEvents, createEvent };
