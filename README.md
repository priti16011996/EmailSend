# SecureAuth API

A production-ready authentication system built with **Node.js, Express.js, MongoDB, JWT, Redis, and BullMQ** featuring Email OTP Verification, JWT Authentication, Account Locking, OTP Resend with Cooldown, Rate Limiting, and Asynchronous Email Processing.

---

## Features

* User Registration
* Email OTP Verification
* JWT Authentication
* Password Hashing using bcrypt
* OTP Hashing using bcrypt
* One Active OTP Per User
* OTP Expiration using MongoDB TTL Index
* OTP Resend Functionality
* OTP Cooldown Protection
* Rate Limiting
* Account Locking after Multiple Failed Login Attempts
* Redis + BullMQ Email Queue
* Retry Failed Emails with Exponential Backoff
* Controller → Service → Model Architecture

---

## Tech Stack

### Backend

* Node.js
* Express.js

### Database

* MongoDB
* Mongoose

### Authentication

* JWT (JSON Web Token)
* bcryptjs

### Email Service

* Nodemailer / Resend

### Queue & Background Jobs

* Redis
* BullMQ

### Security

* Express Rate Limit
* OTP Hashing
* Account Locking

---

## Project Structure

```bash
src/
│
├── config/
│   ├── db.js
│   └── mail.js
│
├── controllers/
│   └── auth.controller.js
│
├── services/
│   ├── auth.service.js
│   └── email.service.js
│
├── models/
│   ├── user.model.js
│   ├── otp.model.js
│   └── failedEmail.model.js
│
├── routes/
│   └── auth.routes.js
│
├── middlewares/
│   ├── otpRateLimit.js
│   └── authMiddleware.js
│
├── queues/
│   └── email.queue.js
│
├── workers/
│   └── email.worker.js
│
├── utils/
│   ├── generateOTP.js
│   └── generateToken.js
│
├── app.js
└── server.js
```

---

## Authentication Flow

```text
User Registration
       |
       v
Create User
       |
Generate OTP
       |
Hash OTP
       |
Store OTP
       |
Add Email Job
       |
Redis Queue
       |
BullMQ Worker
       |
Send OTP Email
```

### Email Verification

```text
Verify OTP
    |
Find OTP
    |
Check Expiry
    |
Compare Hashed OTP
    |
Update User
isVerified = true
    |
Delete OTP
```

### Login Flow

```text
Login
  |
Find User
  |
Check Account Lock
  |
Verify Password
  |
Check Email Verification
  |
Generate JWT
```

---

## Environment Variables

Create a `.env` file in the root directory.

```env
PORT=5000

MONGO_URI=mongodb://localhost:27017/secureauth

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd secure-auth-api
```

### Install Dependencies

```bash
npm install
```

### Start MongoDB

```bash
mongod
```

### Start Redis

Using Docker:

```bash
docker run -d \
--name redis \
-p 6379:6379 \
redis
```

Verify Redis:

```bash
redis-cli ping
```

Output:

```text
PONG
```

---

## Run Application

### Start API Server

```bash
npm run dev
```

### Start Email Worker

```bash
node src/workers/email.worker.js
```

---

## API Endpoints

### Register User

```http
POST /api/auth/register
```

Request:

```json
{
  "name": "Priti",
  "email": "priti@gmail.com",
  "password": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "Registration successful. OTP sent to your email."
}
```

---

### Verify OTP

```http
POST /api/auth/verify-otp
```

Request:

```json
{
  "email": "priti@gmail.com",
  "otp": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

### Login

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "priti@gmail.com",
  "password": "123456"
}
```

Response:

```json
{
  "success": true,
  "token": "jwt-token",
  "user": {
    "id": "userId",
    "name": "Priti",
    "email": "priti@gmail.com"
  }
}
```

---

### Resend OTP

```http
POST /api/auth/resend-otp
```

Request:

```json
{
  "email": "priti@gmail.com"
}
```

Response:

```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

---

## Security Features

### Password Hashing

Passwords are hashed using bcrypt before storing in MongoDB.

### OTP Hashing

OTPs are hashed using bcrypt and never stored in plain text.

### Account Locking

After 5 failed login attempts:

```text
Account Locked for 15 Minutes
```

### OTP Cooldown

Users must wait before requesting another OTP.

### Rate Limiting

```text
5 OTP Requests / 15 Minutes
```

### MongoDB TTL Index

Expired OTPs are automatically deleted by MongoDB.

### JWT Authentication

Secure token-based authentication with configurable expiration.

---

## BullMQ Retry Mechanism

Email delivery failures are retried automatically.

```javascript
attempts: 5,
backoff: {
  type: "exponential",
  delay: 3000
}
```

Example:

```text
Attempt 1 -> Failed
Wait 3 Seconds

Attempt 2 -> Failed
Wait 6 Seconds

Attempt 3 -> Success
```

---

## Future Improvements

* Refresh Token Authentication
* Role-Based Access Control (RBAC)
* Google OAuth Login
* Password Reset Flow
* Multi-Factor Authentication (MFA)
* Docker Deployment
* CI/CD Pipeline
* AWS SES Integration
* Prometheus Monitoring
* Centralized Logging

---

## Author

**Priti Maurya**

* GitHub: https://github.com/priti16011996
* LinkedIn: https://www.linkedin.com/in/priti-maurya16/
* Portfolio: https://pritimaurya.com

---

Built with Node.js, Express.js, MongoDB, Redis, BullMQ, and JWT.
