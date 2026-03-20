'use strict';

const Joi = require('joi');

/**
 * Returns an Express middleware that validates req.body against the
 * provided Joi schema. On failure it responds with 400 and an array
 * of human-readable error messages.
 *
 * @param {Joi.ObjectSchema} schema
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,   // collect ALL validation errors at once
    stripUnknown: true,  // drop unknown fields silently
  });

  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ success: false, errors: messages });
  }

  req.body = value; // replace body with sanitised / coerced value
  next();
};

module.exports = validate;
