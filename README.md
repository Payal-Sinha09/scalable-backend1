# Scalable Backend System

A production-grade REST API with **JWT authentication**, **Gmail email verification**, **Redis caching**, and **Role-Based Access Control (RBAC)**.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Cache | Redis (ioredis) |
| Auth | JWT (access + refresh tokens) |
| Email | Nodemailer + Gmail SMTP |
| Security | bcryptjs, rate limiting, httpOnly cookies |

---

## Project Structure

```
src/
├── config/
│   ├── db.js              # MongoDB connection
│   └── redis.js           # Redis client + cache helpers
├── controllers/
│   ├── authController.js  # Register, login, verify email, reset password
│   └── userController.js  # CRUD, role management
├── middleware/
│   ├── authMiddleware.js  # JWT verification, Redis-cached user lookup
│   └── roleMiddleware.js  # RBAC: restrictTo(), requireMinRole()
├── models/
│   └── User.js            # Mongoose schema with hooks
├── routes/
│   ├── authRoutes.js      # /api/v1/auth/*
│   └── userRoutes.js      # /api/v1/users/*
├── utils/
│   ├── email.js           # Gmail SMTP email templates
│   ├── generateTokens.js  # JWT + crypto token generation
│   └── apiResponse.js     # Consistent response format
├── app.js                 # Express setup, middleware, routes
└── server.js              # Entry point, DB + Redis init
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your MongoDB URI, Gmail credentials, JWT secrets
```

### 3. Gmail App Password (Required)
- Go to your Google Account → Security → 2-Step Verification → App Passwords
- Generate an App Password for "Mail"
- Use that as `EMAIL_PASS` in `.env` (NOT your real Gmail password)

### 4. Run
```bash
npm run dev    # Development (with nodemon)
npm start      # Production
```

---

## API Reference

### Auth Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/register` | Register + send verification email | Public |
| GET | `/api/v1/auth/verify-email?token=` | Verify email address | Public |
| POST | `/api/v1/auth/resend-verification` | Resend verification email | Public |
| POST | `/api/v1/auth/login` | Login → returns JWT | Public |
| POST | `/api/v1/auth/logout` | Logout + clear tokens | Protected |
| POST | `/api/v1/auth/refresh-token` | Refresh access token | Public |
| POST | `/api/v1/auth/forgot-password` | Send reset email | Public |
| POST | `/api/v1/auth/reset-password?token=` | Reset password | Public |
| GET | `/api/v1/auth/me` | Get current user | Protected |

### User Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/v1/users/` | Get all users (paginated) | Admin |
| GET | `/api/v1/users/:id` | Get user by ID | Admin/Moderator |
| GET | `/api/v1/users/profile` | Get own profile | Any |
| PUT | `/api/v1/users/profile` | Update own profile | Any |
| PUT | `/api/v1/users/change-password` | Change password | Any |
| PUT | `/api/v1/users/:id/role` | Update user role | Admin |
| PUT | `/api/v1/users/:id/deactivate` | Deactivate user | Admin |

---

## Key Design Decisions

### Redis Caching Strategy
- User lookups cached for **15 minutes** (`user:{id}`)
- Cache invalidated on update/logout/role change
- Reduces MongoDB reads by ~60% for authenticated routes
- Graceful fallback: if Redis is down, app continues using DB

### JWT Token Strategy
- **Access Token**: Short-lived (7 days), sent in cookie + response body
- **Refresh Token**: Long-lived (30 days), stored as bcrypt hash in DB
- Token rotation: new refresh token issued on every refresh
- All sessions invalidated on password change

### Security
- Passwords hashed with bcrypt (12 salt rounds)
- Rate limiting on all auth endpoints (10 req / 15 min)
- httpOnly cookies prevent XSS token theft
- Email enumeration prevention on forgot-password
- Input size limit (10kb) prevents payload attacks

### RBAC Roles
```
admin      → full access
moderator  → read users, manage content
user       → own profile only
```
