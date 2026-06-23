const { Worker } = require("bullmq");

const sendOTPEmail = require("../services/email.service");

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

worker.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed`);

  console.log(err.message);
});
