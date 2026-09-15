const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/apiResponse');
const { sendTokenResponse } = require('../utils/generateToken');

// @desc    Register a new user (mobile + email + password)
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { mobile, email, password } = req.body;

  if (!mobile || !email || !password) {
    throw new ApiError(400, 'Mobile, email and password are all required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedMobile = mobile.trim();

  const existing = await User.findOne({
    $or: [{ email: normalizedEmail }, { mobile: normalizedMobile }],
  });
  if (existing) {
    throw new ApiError(409, 'An account with this email or mobile number already exists');
  }

  const user = await User.create({
    mobile: normalizedMobile,
    email: normalizedEmail,
    password,
  });

  sendTokenResponse(res, 201, user, 'Account created successfully');
});

// @desc    Log in with email or mobile + password
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
console.log(identifier, password);

  if (!identifier || !password) {
    throw new ApiError(400, 'Identifier (email or mobile) and password are required');
  }

  const normalized = identifier.trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ email: normalized }, { mobile: identifier.trim() }],
  }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Incorrect email/mobile number or password');
  }

  sendTokenResponse(res, 200, user, 'Logged in successfully');
});

// @desc    Log out (clears auth cookie)
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', { expires: new Date(Date.now() + 1000), httpOnly: true });
  sendResponse(res, 200, null, 'Logged out successfully');
});

// @desc    Get the currently authenticated user
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  sendResponse(res, 200, { user: req.user.toSafeObject() });
});

module.exports = { register, login, logout, getMe };
