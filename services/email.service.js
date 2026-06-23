const transporter = require("../config/mail");

const sendOTPEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,

    to: email,

    subject: "Verify Email",

    html: `
       <h2>Email Verification</h2>

       <p>Your OTP is</p>

       <h1>${otp}</h1>

       <p>Valid for 10 Minutes</p>
    `,
  });
};

module.exports = sendOTPEmail;
