const jwt = require('jsonwebtoken');
const { JWT_EXPIRES_IN, COOKIE_EXPIRES_DAYS } = require('../config/constants');

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

// Sends the JWT both as an httpOnly cookie (for browser clients)
// and in the JSON body (for mobile / non-cookie clients).
const sendTokenResponse = (res, statusCode, user, message) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + COOKIE_EXPIRES_DAYS * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };

  res.cookie('token', token, cookieOptions);
  res.status(statusCode).json({
    success: true,
    message,
    token,
    data: { user: user.toSafeObject ? user.toSafeObject() : user },
  });
};

module.exports = { generateToken, sendTokenResponse };
