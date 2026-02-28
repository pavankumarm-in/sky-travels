# Sky Travels Enterprise Travel Booking System

Full stack travel booking application with separate `USER` and `ADMIN` workflows, JWT auth, MongoDB persistence, audit logging, analytics, and a multi-page vanilla JS frontend.

## 1. Local Setup, Tech Stack, and Libraries

### 1.1 Tech Stack

- Frontend: HTML, CSS, JavaScript (modular JS files)
- Backend: Node.js + Express
- Database: MongoDB + Mongoose ODM
- Auth: JWT (JSON Web Token)
- Password Hashing: `bcryptjs`
- File Upload Handling: `multer` (memory storage)
- Charts: Chart.js (admin dashboard)
- Logging: `morgan` (HTTP logs)

### 1.2 Required Versions

- Node.js: **v20 LTS** (recommended and expected)
- npm: shipped with Node.js v20
- MongoDB Community Server: 7.x or newer
- MongoDB Compass (Optional):, recommended for DB inspection

### 1.3 Install Prerequisites

1. Install Node.js v20 LTS  
Download: `https://nodejs.org/en/download`

2. Install MongoDB Community Server  
Download: `https://www.mongodb.com/try/download/community`

3. Install MongoDB Compass (optional)  
Download: `https://www.mongodb.com/try/download/compass`

### 1.4 Verify Installation

Run in terminal:

```powershell
node -v
npm -v
```

Expected: Node version starts with `v20`.

### 1.5 MongoDB Local Setup

1. Ensure MongoDB service is running on your machine.
2. Default local URI used by this project:

```text
mongodb://127.0.0.1:27017/skytravels
```

3. In Compass, connect using:

```text
mongodb://127.0.0.1:27017
```

Then open database `skytravels`.

### 1.6 Configure Environment

Update `.env` in project root if required:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/skytravels
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```

### 1.7 Install and Run

```powershell
npm install
npm run dev
```

Open:

```text
http://localhost:5000
```

### 1.8 First Run Behavior

- Backend connects to MongoDB
- Seed script inserts default packages if packages collection is empty
- Default admin user is ensured

Default admin credentials:

- Email: `admin@skytravels.com`
- Password: `Admin@12345`

### 1.9 NPM Scripts

- `npm run dev`: start server with nodemon
- `npm start`: start server with node
- `npm run seed`: run seed script manually

### 1.10 Core Libraries Used (from `package.json`)

- Backend: `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `multer`, `cors`, `morgan`, `dotenv`
- Dev: `nodemon`
- Frontend runtime dependency via CDN: `chart.js`

## 2. User and Admin Flows

### 2.1 Authentication Flow

- Signup (`/signup.html`)
  - Validates name, email format, password length
  - Stores hashed password
  - Creates user with default role `USER`
- Login (`/login.html`)
  - Validates credentials
  - Issues JWT with `userId` and `role`
  - Persists session in localStorage
- Route Guards
  - Guest-only: login/signup
  - User-only: packages, package-details, bookings
  - Admin-only: admin dashboard

### 2.2 User Journey

1. Login/signup
2. Browse packages (`/packages.html`)
   - Free-text search
   - Min/max price sliders
   - Pagination
3. Open package details (`/package-details.html?id=<packageId>`)
4. Book and pay from package card
   - Enter adults, children, travel start date
   - Seat checks applied
   - Payment method specific fields (UPI, CC/DC, NetBanking)
   - Default payment preference option
5. View booking history (`/bookings.html`)
   - Successful payments and booking status history

### 2.3 Admin Journey

Admin page: `/admin.html`  
Main tabs:

- Dashboard
  - KPIs and Chart.js chart
- Bookings
  - Pending confirmation queue
  - Confirm bookings
- Manage Packages
  - Create/edit/delete packages
  - Images supported through link mode or upload mode
  - Uploaded images are stored in MongoDB as base64 data URLs in `packages.images`
- Manage Users
  - User list
  - Delete user action (with confirmation modal)
- Audit History
  - Booking-centric audit cards with booking/person/status/payment details

### 2.4 Payment and Booking Status Flow

1. User creates booking (`AWAITING_PAYMENT`)
2. User completes payment simulation (`paymentStatus = SUCCESS`)
3. Booking moves to `AWAITING_ADMIN_CONFIRMATION`
4. Admin confirms booking (`BOOKING_CONFIRMED`)
5. All key actions are audit logged

## 3. Folder Structure and File Responsibilities

## 3.1 High-Level Structure

```text
sky-travels/
  backend/
    src/
      app.js
      server.js
      config/
      constants/
      controllers/
      middleware/
      models/
      repositories/
      routes/
      seeds/
      services/
      utils/
    uploads/
  frontend/
    *.html
    js/
    styles.css
    favicon.svg
  package.json
  package-lock.json
  README.md
```

### 3.2 Root Files

- `package.json`
  - Project metadata, scripts, dependencies.
- `package-lock.json`
  - Locked dependency versions for consistent installs.
- `README.md`
  - Project documentation.

### 3.3 Backend Core

- `backend/src/server.js`
  - Application bootstrap: env load, DB connect, seeding, server start.
- `backend/src/app.js`
  - Express app setup: middleware, static hosting, API routes, error handling.

### 3.4 Backend Config and Constants

- `backend/src/config/env.js`
  - Centralized environment variable reads.
- `backend/src/config/database.js`
  - Mongoose connection setup and DB connection logs.
- `backend/src/constants/roles.js`
  - Role constants (`USER`, `ADMIN`).

### 3.5 Backend Models

- `backend/src/models/User.js`
  - User schema: identity, role, password hash, payment preference.
- `backend/src/models/Package.js`
  - Package schema: title/country/duration/price/destinations/images/itinerary/seats.
- `backend/src/models/Booking.js`
  - Booking schema: traveller split, amount, status, payment metadata.
- `backend/src/models/AuditLog.js`
  - Audit event schema for create/update/delete/payment/confirmation actions.

### 3.6 Backend Repositories (Data Access Layer)

- `backend/src/repositories/userRepository.js`
  - User read/write helpers, role updates, deletes.
- `backend/src/repositories/packageRepository.js`
  - Package CRUD, query, pagination, seat reservation.
- `backend/src/repositories/bookingRepository.js`
  - Booking CRUD, status updates, aggregations, admin lookup helpers.
- `backend/src/repositories/auditLogRepository.js`
  - Audit log create/list helpers.

### 3.7 Backend Services (Business Logic)

- `backend/src/services/authService.js`
  - Signup/login rules, hash compare, JWT generation.
- `backend/src/services/packageService.js`
  - Package payload validation and package CRUD business logic.
- `backend/src/services/bookingService.js`
  - Booking creation, payment simulation, status transitions, audit writes.
- `backend/src/services/adminService.js`
  - Admin analytics/users/bookings/audit-facing business logic.
- `backend/src/services/auditLogService.js`
  - Audit log creation and retrieval orchestration.

### 3.8 Backend Controllers (HTTP Layer)

- `backend/src/controllers/authController.js`
  - Auth API handlers.
- `backend/src/controllers/packageController.js`
  - Package browse/details/admin package handlers.
- `backend/src/controllers/bookingController.js`
  - Booking create/history/payment handlers.
- `backend/src/controllers/adminController.js`
  - Admin APIs: users, analytics, bookings, audit, uploads.

### 3.9 Backend Middleware

- `backend/src/middleware/auth.js`
  - JWT authentication + role-based authorization.
- `backend/src/middleware/errorHandler.js`
  - Central error formatter.
- `backend/src/middleware/notFound.js`
  - 404 API handler.
- `backend/src/middleware/upload.js`
  - Multer memory upload config for package images.

### 3.10 Backend Routes

- `backend/src/routes/index.js`
  - Route aggregator mounted under `/api`.
- `backend/src/routes/authRoutes.js`
  - `/api/auth/*`
- `backend/src/routes/packageRoutes.js`
  - `/api/packages/*`
- `backend/src/routes/bookingRoutes.js`
  - `/api/bookings/*`
- `backend/src/routes/adminRoutes.js`
  - `/api/admin/*`

### 3.11 Backend Seeds

- `backend/src/seeds/packageSeedData.js`
  - Seed data definitions for travel packages.
- `backend/src/seeds/seedPackages.js`
  - First-run seeding and default admin bootstrap logic.

### 3.12 Backend Utilities

- `backend/src/utils/ApiError.js`
  - Custom API error class.
- `backend/src/utils/apiResponse.js`
  - Consistent JSON success response helper.
- `backend/src/utils/asyncHandler.js`
  - Async wrapper for controllers.
- `backend/src/utils/validators.js`
  - Shared validation helpers.

### 3.13 Frontend Pages

- `frontend/index.html`
  - Entry page/redirect.
- `frontend/login.html`
  - Login screen.
- `frontend/signup.html`
  - Signup screen.
- `frontend/packages.html`
  - User package listing, filters, booking/payment modal.
- `frontend/package-details.html`
  - Package detailed itinerary and image view.
- `frontend/bookings.html`
  - User booking history page.
- `frontend/admin.html`
  - Admin console with tabbed sections and package modal.
- `frontend/favicon.svg`
  - App favicon.
- `frontend/styles.css`
  - Complete UI styling and responsive layout rules.

### 3.14 Frontend JavaScript Modules

- `frontend/js/api.js`
  - Fetch wrapper and all API client functions.
- `frontend/js/auth.js`
  - Session storage, token helpers, role guards.
- `frontend/js/common-page.js`
  - Shared page shell init (theme, nav, user meta, logout).
- `frontend/js/ui.js`
  - Toast system, theme toggling, global UI actions.
- `frontend/js/images.js`
  - Safe image source helper for package/gallery rendering.
- `frontend/js/login-page.js`
  - Login form logic.
- `frontend/js/signup-page.js`
  - Signup form logic.
- `frontend/js/packages-page.js`
  - Packages rendering, filters, pagination, booking + payment workflow.
- `frontend/js/package-details-page.js`
  - Package details fetch/render logic.
- `frontend/js/bookings-page.js`
  - User booking history rendering and pagination.
- `frontend/js/admin-page.js`
  - Admin tabs, analytics rendering, users/packages/bookings/audit interactions.

## 4. API Summary

Base path: `/api`

- Auth
  - `POST /auth/signup`
  - `POST /auth/login`
- Packages
  - `GET /packages`
  - `GET /packages/:packageId`
  - `POST /packages` (ADMIN)
  - `PUT /packages/:packageId` (ADMIN)
  - `DELETE /packages/:packageId` (ADMIN)
- Bookings
  - `POST /bookings`
  - `GET /bookings/my-history`
  - `GET /bookings/payment-preference`
  - `POST /bookings/:bookingId/pay`
- Admin
  - `GET /admin/users`
  - `PATCH /admin/users/:userId/role`
  - `DELETE /admin/users/:userId`
  - `GET /admin/analytics`
  - `GET /admin/bookings`
  - `GET /admin/bookings/:bookingId`
  - `PATCH /admin/bookings/:bookingId/confirm`
  - `GET /admin/audit-logs`
  - `POST /admin/uploads/package-images`
- Health
  - `GET /api/health`

## 5. Troubleshooting

- `npm` not recognized:
  - Reinstall Node.js v20 LTS and reopen terminal.
- PowerShell execution policy issue:
  - Run:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  ```
- Mongo connection errors:
  - Ensure MongoDB service is running.
  - Recheck `MONGO_URI` in `.env`.
- Port conflict:
  - Change `PORT` in `.env` and restart.
