'use strict';



const express      = require('express');
const swaggerUi    = require('swagger-ui-express');
const yaml         = require('js-yaml');
const fs           = require('fs');
const path         = require('path');

const eventsRouter     = require('./routes/events');
const attendanceRouter = require('./routes/attendance');
const usersRouter      = require('./routes/users');
const { bookingsRouter } = require('./routes/bookings');
const errorHandler     = require('./middleware/errorHandler');

const app = express();

// ─── Body Parsing ─────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request Logger (minimal) ─────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// ─── Swagger / OpenAPI ────────────────────────────────────────────────────
const swaggerDocument = yaml.load(
  fs.readFileSync(path.join(__dirname, '..', 'swagger.yaml'), 'utf8')
);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: 'Event Booking API',
}));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: "API is running 🚀"
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/events',   eventsRouter);
app.use('/events',   attendanceRouter);  // POST /events/:id/attendance
app.use('/bookings', bookingsRouter);
app.use('/users',    usersRouter);       // GET  /users/:id/bookings

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((_req, _res, next) => {
  const err = new Error('Route not found.');
  err.status = 404;
  next(err);
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
