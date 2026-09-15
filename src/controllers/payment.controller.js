const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Business = require('../models/Business');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/apiResponse');
const {
  REFERRAL_COMMISSION,
  STANDARD_PLAN_PRICE,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
} = require('../config/constants');
const Razorpay = require('razorpay');

const razorpay = RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
  : null;

const generateTransactionId = () => `ZYP-${crypto.randomInt(10000000, 99999999)}`;

// Credits the configured commission to the referrer, once per referred user.
const awardReferralCommission = async (referralCode, referredUserId) => {
  if (!referralCode) return;

  const escapedCode = referralCode.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await User.findOneAndUpdate(
    {
      referralCode: { $regex: `^${escapedCode}$`, $options: 'i' },
      _id: { $ne: referredUserId },
      referredUserIds: { $ne: referredUserId },
    },
    {
      $inc: { referralEarnings: REFERRAL_COMMISSION, referralCount: 1 },
      $addToSet: { referredUserIds: referredUserId },
    }
  );
};

const getOwnedBusiness = async (businessId, userId) => {
  const business = await Business.findById(businessId);
  if (!business) throw new ApiError(404, 'Business not found');
  if (String(business.owner) !== String(userId)) {
    throw new ApiError(403, 'You do not own this business listing');
  }
  if (business.status === 'active') {
    throw new ApiError(400, 'This business listing is already active');
  }
  return business;
};

// @desc    Create a Razorpay order for a pending listing
// @route   POST /api/v1/payments/order
// @access  Private
const createOrder = asyncHandler(async (req, res) => {
  if (!razorpay) throw new ApiError(500, 'Razorpay is not configured on the server');

  const { businessId } = req.body;
  await getOwnedBusiness(businessId, req.user._id);

  const order = await razorpay.orders.create({
    amount: Math.round(STANDARD_PLAN_PRICE * 100),
    currency: 'INR',
    receipt: `zyphoriz_${businessId}_${Date.now()}`,
    notes: { businessId: String(businessId), userId: String(req.user._id) },
  });

  sendResponse(res, 201, {
    order,
    keyId: RAZORPAY_KEY_ID,
    amount: STANDARD_PLAN_PRICE,
    currency: 'INR',
  }, 'Razorpay order created');
});

// @desc    Verify a Razorpay payment and activate the listing
// @route   POST /api/v1/payments/checkout
// @access  Private
const checkout = asyncHandler(async (req, res) => {
  const {
    businessId,
    method,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = req.body;

  if (!razorpay || !businessId || !['upi', 'card'].includes(method)
    || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new ApiError(400, 'Complete Razorpay payment details are required');
  }

  const business = await getOwnedBusiness(businessId, req.user._id);
  const order = await razorpay.orders.fetch(razorpayOrderId);
  if (order.status !== 'paid' && order.status !== 'attempted') {
    throw new ApiError(400, 'Razorpay order is not valid for checkout');
  }
  if (order.amount !== Math.round(STANDARD_PLAN_PRICE * 100)
    || order.currency !== 'INR'
    || order.notes?.businessId !== String(business._id)
    || order.notes?.userId !== String(req.user._id)) {
    throw new ApiError(400, 'Razorpay order does not match this business');
  }
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  const signaturesMatch = expectedSignature.length === razorpaySignature.length
    && crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpaySignature));
  if (!signaturesMatch) throw new ApiError(400, 'Razorpay payment verification failed');

  const payment = await Payment.create({
    user: req.user._id,
    business: business._id,
    transactionId: generateTransactionId(),
    razorpayOrderId,
    razorpayPaymentId,
    amount: STANDARD_PLAN_PRICE,
    method,
    plan: business.selectedPlan,
    status: 'success',
  });

  business.status = 'active';
  business.verified = true;
  business.planExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await business.save();

  await awardReferralCommission(business.referralCodeUsed, req.user._id);

  sendResponse(res, 200, { payment, business }, 'Payment successful, your business is now live');
});

// @desc    Get the logged-in user's payment history
// @route   GET /api/v1/payments/mine
// @access  Private
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate('business', 'name slug')
    .sort({ createdAt: -1 });
  sendResponse(res, 200, { payments });
});

module.exports = { createOrder, checkout, getMyPayments };
