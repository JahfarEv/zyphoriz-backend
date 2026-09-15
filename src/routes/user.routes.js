const express = require('express');
const { getReferralStats } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/referrals', protect, getReferralStats);

module.exports = router;
