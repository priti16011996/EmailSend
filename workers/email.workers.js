const { Worker } = require("bullmq");

const sendOTPEmail = require("../services/email.service");
const FailedEmail = require("../models/failedEmail.model");

const worker = new Worker(
  "emailQueue",

  async (job) => {
    const { email, otp } = job.data;

    await sendOTPEmail(email, otp);
  },

  {
    connection: {
      host: "127.0.0.1",
      port: 6379,
    },
  },
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

// worker.on("failed", async (job, err) => {
//   console.error(`Job ${job.id} failed after ${job.attemptsMade} attempts`);

//   console.error(`Email: ${job.data.email}`);

//   console.error(`Reason: ${err.message}`);

//   console.log("Max Attempts:", job.opts.attempts);
// });

//Save only after the final retry:
worker.on("failed", async (job, err) => {
  const maxAttempts = job.opts.attempts || 1;

  if (job.attemptsMade >= maxAttempts) {
    await FailedEmail.create({
      email: job.data.email,
      reason: err.message,
      attempts: job.attemptsMade,
    });
  }
});
