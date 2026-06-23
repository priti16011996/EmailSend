await OTP.create({
  email,
  otp: hashOtp,
  expiresAt: new Date(Date.now() + 10 * 60 * 1000),
});
