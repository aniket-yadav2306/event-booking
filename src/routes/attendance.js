'use strict';

const express  = require('express');
const router   = express.Router();
const { recordAttendance } = require('../controllers/attendanceController');


router.post('/:id/attendance', recordAttendance);

module.exports = router;
