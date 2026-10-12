# HustleHub+ — Part 2: Secure Freelance Marketplace

**Module:** INSY7314  
**Project:** HustleHub+  
**Technology:** MongoDB, Express.js, React, Node.js (MERN)  
**Project stage:** Part 2 — marketplace functionality, role-based access control, API security and testing

## 1. Project Overview

HustleHub+ is a web-based freelance marketplace connecting **Clients** who need services with **Freelancers** who offer them. Clients can browse gigs, request bookings and make **simulated** payments. Freelancers can publish and manage gigs, accept bookings, complete paid work and view earnings. The platform integrates a React frontend with a REST API and MongoDB persistence.

Part 2 extends the Part 1 authentication foundation into a working marketplace. It replaces the initial JSON-file-based user storage approach with MongoDB-backed application models, introduces gig, booking and transaction workflows, adds role and resource-ownership checks, and supplies automated backend security tests. **Payments are simulated; no real money is processed.**

## 2. Main Features and User Roles

| Area | Client | Freelancer |
| --- | --- | --- |
| Account | Register, log in and access own account | Register, log in and access own account |
| Marketplace | Browse available gigs | Create, update and remove own gigs |
| Bookings | Request and view own bookings; cancel eligible bookings | View and accept bookings for own gigs; complete eligible bookings |
| Transactions | Simulate payment for an eligible accepted booking; view own transactions | View relevant transactions and earnings |
| Access control | Cannot publish gigs or accept freelancer bookings | Cannot create client bookings or make client payments |

The user model includes an `Admin` role, but **an administrator dashboard and full admin management capabilities are not documented as completed Part 2 features**. Authorization must be checked on the backend even if the React interface hides restricted actions.

## 3. System Architecture

The application follows the MERN architecture:

```text
React frontend (Vite)
       |
       | HTTPS REST API requests + Bearer JWT
       v
Node.js / Express backend
       |
       +-- Security middleware (Helmet, CORS, JSON size limit)
       +-- Authentication and authorization middleware
       +-- API routes and controllers
       +-- Centralized error handling
       |
       v
Mongoose models
       |
       v
MongoDB (users, gigs, bookings, transactions)
```

The backend separates concerns into `routes/` (endpoint definitions), `controllers/` (business rules), `middleware/` (authentication, authorization and error handling), `models/` (MongoDB schemas), `config/` (database configuration) and `utils/` (supporting infrastructure). `app.js` configures the Express application and HTTPS startup. It also exports the Express app for automated testing without starting the server or connecting to the live database.

### Representative project structure

```text
ST10439938_INSY7314/
├── app.js
├── package.json
├── .env                       # Local configuration; do not commit
├── .gitignore
├── config/                   # Database configuration
├── controllers/
│   ├── authController.js
│   ├── gigController.js
│   ├── bookingController.js
│   └── transactionController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── authorize.js
│   └── errorMiddleware.js
├── models/                   # Mongoose schemas
├── routes/
│   ├── authRoutes.js
│   ├── gigRoutes.js
│   ├── bookingRoutes.js
│   └── transactionRoutes.js
├── tests/
│   ├── security.test.js
│   ├── roles.test.js
│   ├── bookingSecurity.test.js
│   ├── validation.test.js
│   └── cors.test.js
├── frontend/                 # React/Vite application
├── ssl/                      # Local development certificates; do not commit
└── README.md
```

## 4. Installation and Local Setup

### Prerequisites

- Node.js and npm
- A running MongoDB instance or an accessible MongoDB connection string
- VS Code or another code editor
- A modern browser
- Development HTTPS certificate and private key in the locations expected by `utils/https.js`

### Backend

From the repository root:

```powershell
npm install
```

Create a local `.env` file and supply the values expected by the application. Example **variable names** (not real credentials):

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/hustlehub
JWT_SECRET=replace_with_a_long_random_secret
# Optional, when the frontend is hosted on a different origin:
# FRONTEND_URL=https://your-frontend-domain.example
```

> Confirm the MongoDB variable name against the current database configuration if it differs from `MONGO_URI`. Never commit `.env`, private keys or real credentials. The example above is for local development, not production configuration.

Start the backend:

```powershell
npm start
```

The development backend uses HTTPS on port `5000` when configured as above. A self-signed development certificate may produce a browser or API-client trust warning; do not disable certificate verification in production.

### Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL shown by Vite (commonly `http://localhost:5173` or `http://localhost:5174`). The frontend must be configured to call the correct backend HTTPS URL. The backend's local CORS allowlist includes both of those development origins.

## 5. API Reference

Protected endpoints require:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Authentication — `/api/auth`

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register a new account |
| POST | `/api/auth/login` | Public | Authenticate and obtain a JWT |
| GET | `/api/auth/me` | Authenticated | Retrieve current account details |

### Gigs — `/api/gigs`

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/gigs` | Public | Browse gigs |
| POST | `/api/gigs` | Freelancer | Publish a gig |
| PATCH | `/api/gigs/:id` | Owning Freelancer | Update a gig |
| DELETE | `/api/gigs/:id` | Owning Freelancer | Remove a gig through the implemented soft-delete logic |

### Bookings — `/api/bookings`

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/bookings/mine` | Client or Freelancer | View bookings relevant to the signed-in user |
| POST | `/api/bookings` | Client | Create a booking |
| PATCH | `/api/bookings/:id/accept` | Owning Freelancer | Accept a booking |
| PATCH | `/api/bookings/:id/complete` | Owning Freelancer | Complete an eligible paid booking |
| PATCH | `/api/bookings/:id/cancel` | Owning Client | Cancel an eligible booking |

### Transactions — `/api/transactions`

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/transactions/mine` | Client or Freelancer | View relevant transactions |
| GET | `/api/transactions/earnings` | Freelancer | View income information |
| POST | `/api/transactions/pay/:bookingId` | Owning Client | Simulate payment for an accepted booking |

**Note:** These are the routes established during Part 2 development. Request bodies, response fields and exact state transitions should be checked against the current route/controller code or a verified Postman collection before submission.

## 6. End-to-End Workflow

1. A **Freelancer** registers or logs in and publishes a gig.
2. A **Client** registers or logs in, browses available gigs and creates a booking.
3. The relevant Freelancer reviews and accepts the booking.
4. The Client makes a **simulated payment** against the accepted booking.
5. The Freelancer marks the eligible paid booking as completed.
6. Each user views their relevant booking or transaction information; the Freelancer can view earnings.

Booking updates are scoped to the appropriate owner and permitted state. The payment controller checks booking ownership and eligibility. A unique transaction constraint helps prevent recording a second simulated payment for the same booking. These checks are performed server-side rather than relying only on frontend controls.

## 7. Security Design

### Authentication and password protection

- Passwords are hashed with **bcrypt** before storage, rather than saved in plaintext.
- Successful login issues a signed **JWT** with a one-hour lifetime.
- Protected endpoints validate the JWT and load the associated user from the database.
- Requests with missing, invalid or expired credentials are rejected with **401 Unauthorized**.
- The JWT signing secret is read from an environment variable rather than hard-coded in source control.

### Role-based access control and ownership

- The authorization middleware checks whether the authenticated account has the required `Client` or `Freelancer` role.
- Incompatible roles receive **403 Forbidden** responses.
- Sensitive gig and booking modifications are constrained to resources owned by the current user.
- Transaction creation requires an eligible booking belonging to the paying Client.
- Backend authorization remains mandatory even when a frontend control is hidden or disabled.

### Validation and error handling

- Authentication routes use **express-validator** for required fields, email format, password length and permitted registration roles.
- The gig controller validates important gig fields, including text inputs and finite nonnegative pricing.
- Email values are normalized where appropriate.
- Invalid input is rejected with controlled **400 Bad Request** responses.
- The centralized error middleware avoids returning raw internal stack traces to API consumers.
- **Further validation and sanitisation review is recommended for all booking and transaction request fields.**

### HTTP and API protections

- **Helmet** supplies HTTP security headers. Its Content Security Policy configuration should be checked separately against the assessment's CSP requirements.
- **CORS** permits the known local React origins and an optional configured frontend origin. CORS is a browser restriction, **not** a replacement for authentication or authorization.
- Express limits JSON request bodies to **100 KB**.
- Authentication routes include rate limiting of **20 requests per 15 minutes**. Booking-specific rate limiting must be verified separately before claiming it is implemented.
- Local development uses HTTPS. Production deployment requires a properly trusted certificate and environment-specific configuration.
- `.gitignore` excludes local secrets, certificates, dependencies, generated builds and `storage/users.json` from new Git tracking. Previously committed secrets or data are **not** erased from Git history by adding ignore rules.

## 8. Automated Backend Testing

Backend tests use **Jest** and **Supertest**. The Express app is imported directly for isolated request testing, without starting the production server. Model mocks are used where needed so tests do not alter live MongoDB data.

Run from the repository root:

```powershell
npm test
```

### Part 2 test suites

| File | Coverage |
| --- | --- |
| `tests/security.test.js` | Missing/invalid JWT and unauthenticated protected operations |
| `tests/roles.test.js` | Rejection of actions attempted by the wrong user role |
| `tests/bookingSecurity.test.js` | Booking ownership, payment eligibility and duplicate-payment protection |
| `tests/validation.test.js` | Invalid registration and login inputs |
| `tests/cors.test.js` | Approved origins, blocked-origin CORS headers and approved preflight requests |

**Most recently verified local result:**

```text
Test Suites: 5 passed, 5 total
Tests:       22 passed, 22 total
```

The expected `400`, `401`, `403` and `409` responses in these negative tests represent correctly rejected requests, not test failures. Automated tests demonstrate the behaviours covered by the test cases; they do not establish that every security risk has been eliminated.

### Dependency audit

```powershell
npm audit
npm audit --omit=dev
```

At the most recent check, `npm audit --omit=dev` reported **0 vulnerabilities** in production dependencies. The full audit reported **19 moderate development-dependency findings**, linked to the Jest tooling dependency tree. These findings remain for review; avoid `npm audit fix --force` without evaluating breaking changes.

### Postman/Newman and frontend tests

The rubric separately requires **Postman/Newman execution evidence** and **React frontend interaction tests**. The Jest/Supertest backend results above do **not** replace those deliverables. Add the verified Postman collection, Newman command/results and frontend test instructions to this section once they have been completed. Do not report them as passed without an actual run.

## 9. Part 1 to Part 2 Changes

| Part 1 foundation | Part 2 improvement |
| --- | --- |
| Express authentication API | Full marketplace API for gigs, bookings and transactions |
| Temporary JSON-based user storage | MongoDB/Mongoose persistence |
| JWT and bcrypt foundations | Database-backed authentication, RBAC and ownership checks |
| Backend-focused project | React/Vite frontend integrated with API |
| Basic security middleware | Restricted CORS, request-size limit and additional workflow checks |
| Manual API exploration | Five automated backend suites, 22 passing tests |
| No completed marketplace income flow | Simulated payment records and freelancer earnings views |

## 10. Known Limitations and Future Improvements

- **Payments are simulated** and must not be represented as real payment processing.
- Admin account capabilities are not established as complete in the current Part 2 implementation.
- Booking rate limiting, a specifically reviewed Content Security Policy and comprehensive input sanitisation still require verification against the marking rubric.
- Postman/Newman evidence and automated React interaction tests must be added if they are required for final assessment.
- Production hosting, operational monitoring, CI/CD and further hardening are outside the functionality verified in this document.
- A full security assessment would include additional integration, authorization, abuse-case and dependency testing.

## 11. Troubleshooting

| Symptom | What to check |
| --- | --- |
| Frontend cannot reach API | Backend is running; frontend API base URL uses the correct HTTPS port; CORS origin is permitted |
| MongoDB connection failure | Database service/connection string, network access and local `.env` values |
| `401 Unauthorized` | JWT exists, is valid and is sent as `Authorization: Bearer <token>` |
| `403 Forbidden` | Logged-in role has permission for the requested operation |
| `409 Conflict` | Booking/payment state, resource ownership or duplicate transaction |
| Self-signed HTTPS warning | Development certificate trust; do not bypass certificate checks in production |
| Jest test hangs on `gigs.find()` | A test may be calling a database-dependent route without mocking the model or connecting to a test database |

## 12. Submission Notes

Before submitting, verify that the README matches the **latest source code**, include evidence for any required Newman and frontend tests, and confirm the repository contains no `.env` values, private keys, real user data or unintended generated files. Maintain accurate commit history and follow the course's collaboration and repository requirements.

---

**HustleHub+ Part 2 — MERN Freelance Marketplace**
