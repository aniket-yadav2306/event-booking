'use strict';

const express    = require('express');
const router     = express.Router();
const { listEvents, createEvent } = require('../controllers/eventController');


router.get('/',  listEvents);
router.post('/', createEvent);

module.exports = router;
