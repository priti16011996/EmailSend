const User = require("../models/user.model");
const OTP = require("../models/otp.model");

const bcrypt = require("bcryptjs");

const generateOTP = require("../utils/generateOTP");

const sendOTPEmail = require("./email.service");

const generateToken = require("../utils/generateToken");

// REGISTER
const registerUser = async (name, email, password) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashedPassword,
  });

  const otp = generateOTP();
  const hashOtp = await bcrypt.hash(otp, 10);
  await OTP.create({
    email,
    otp: hashOtp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  await sendOTPEmail(email, otp);

  return {
    message: "OTP sent",
  };
};

// VERIFY OTP
const verifyOTP = async (email, otp) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const otpDoc = await OTP.findOne({ email });

  if (!otpDoc) {
    throw new Error("OTP not found");
  }

  if (otpDoc.expiresAt < Date.now()) {
    await OTP.deleteOne({ _id: otpDoc._id });

    throw new Error("OTP expired");
  }

  const isMatch = await bcrypt.compare(otp, otpDoc.otp);

  if (!isMatch) {
    throw new Error("Invalid OTP");
  }

  user.isVerified = true;

  await user.save();

  await OTP.deleteOne({
    _id: otpDoc._id,
  });

  return {
    message: "Email verified successfully",
  };
};

// LOGIN
const loginUser = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.isVerified) {
    throw new Error("Please verify email first");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid Credentials");
  }

  const token = generateToken(user._id);

  return {
    token,
  };
};

module.exports = {
  registerUser,
  verifyOTP,
  loginUser,
};
