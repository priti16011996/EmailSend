const User = require("../models/user.model");
const OTP = require("../models/otp.model");
const bcrypt = require("bcryptjs");
const emailQueue = require("../queues/email.queue");

const generateOTP = require("../utils/generateOTP");

const sendOTPEmail = require("./email.service");

const generateToken = require("../utils/generateToken");

// REGISTER
const registerUser = async (name, email, password) => {
  const existingUser = await User.findOne({ email });

  // Already verified
  if (existingUser && existingUser.isVerified) {
    throw new Error("User already exists");
  }

  // Existing but unverified user
  if (existingUser && !existingUser.isVerified) {
    const otp = generateOTP();

    const hashedOTP = await bcrypt.hash(otp, 10);

    await OTP.findOneAndUpdate(
      { email },
      {
        otp: hashedOTP,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        lastSentAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      },
    );

    // await sendOTPEmail(email, otp);
    await emailQueue.add("sendOTP", {
      email,
      otp,
    });

    return {
      success: true,
      message:
        "Account already exists but is not verified. OTP resent successfully.",
    };
  }

  // New User
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    isVerified: false,
  });

  const otp = generateOTP();

  const hashedOTP = await bcrypt.hash(otp, 10);

  await OTP.create({
    email,
    otp: hashedOTP,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    lastSentAt: new Date(),
  });

  //await sendOTPEmail(email, otp);
  await emailQueue.add(
    "sendOTP",
    {
      email,
      otp,
    },
    {
      attempts: 3,

      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
  );

  return {
    success: true,
    message: "Registration successful. OTP sent to your email.",
    userId: user._id,
  };
};

// VERIFY OTP
const verifyOTP = async (email, otp) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("User already verified");
  }

  const otpDoc = await OTP.findOne({ email });

  if (!otpDoc) {
    throw new Error("OTP not found");
  }

  if (otpDoc.expiresAt < Date.now()) {
    await OTP.deleteOne({
      _id: otpDoc._id,
    });

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
    success: true,
    message: "Email verified successfully",
  };
};

// LOGIN
const MAX_LOGIN_ATTEMPTS = 3;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutescle
const loginUser = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Check if account is currently locked
  if (user.lockUntil && user.lockUntil > Date.now()) {
    const remainingMinutes = Math.ceil(
      (user.lockUntil - Date.now()) / (60 * 1000),
    );

    throw new Error(
      `Account locked. Try again after ${remainingMinutes} minute(s)`,
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);

  // Wrong Password
  if (!isMatch) {
    const attempts = user.loginAttempts + 1;

    // Lock account after max attempts
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            loginAttempts: 0,
            lockUntil: new Date(Date.now() + LOCK_TIME),
          },
        },
      );

      throw new Error(
        "Too many failed login attempts. Account locked for 15 minutes.",
      );
    }

    await User.updateOne(
      { _id: user._id },
      {
        $inc: {
          loginAttempts: 1,
        },
      },
    );

    throw new Error("Invalid email or password");
  }

  // Password Correct
  // Reset failed attempts
  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        loginAttempts: 0,
        lockUntil: null,
      },
    },
  );

  // Email verification check
  if (!user.isVerified) {
    return {
      success: false,
      requiresVerification: true,
      message: "Please verify your email first",
    };
  }

  const token = generateToken(user._id);

  return {
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

const resendOTP = async (email) => {
  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("User already verified");
  }

  const existingOTP = await OTP.findOne({ email });

  if (existingOTP) {
    const diff = Date.now() - existingOTP.lastSentAt.getTime();

    if (diff < 300 * 1000) {
      throw new Error("Please wait 5 min requesting another OTP");
    }
  }

  const otp = generateOTP();

  const hashedOTP = await bcrypt.hash(otp, 10);

  await OTP.findOneAndUpdate(
    { email },
    {
      otp: hashedOTP,

      expiresAt: new Date(Date.now() + 10 * 60 * 1000),

      lastSentAt: new Date(),
    },
    {
      upsert: true,
      new: true,
    },
  );

  await sendOTPEmail(email, otp);

  return {
    message: "OTP sent successfully",
  };
};

module.exports = {
  registerUser,
  verifyOTP,
  loginUser,
  resendOTP,
};
