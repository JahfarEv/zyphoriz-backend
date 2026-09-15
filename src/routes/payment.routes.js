const express = require('express');
const { createOrder, checkout, getMyPayments } = require('../controllers/payment.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/order', protect, createOrder);
router.post('/checkout', protect, checkout);
router.get('/mine', protect, getMyPayments);

module.exports = router;
