const express = require('express');
const router = express.Router();
const { listCounsellors } = require('../controllers/counsellorController');

router.get('/', listCounsellors);

module.exports = router;


