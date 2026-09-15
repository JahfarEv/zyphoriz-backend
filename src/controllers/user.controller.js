const asyncHandler = require('express-async-handler');
const sendResponse = require('../utils/apiResponse');

// @desc    Get the logged-in user's referral stats (code, earnings, count)
// @route   GET /api/v1/users/referrals
// @access  Private
const getReferralStats = asyncHandler(async (req, res) => {
  const { referralCode, referralEarnings, referralCount } = req.user;
  sendResponse(res, 200, { referralCode, referralEarnings, referralCount });
});

module.exports = { getReferralStats };
