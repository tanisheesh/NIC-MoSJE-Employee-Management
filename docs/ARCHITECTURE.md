# NIC-MoSJE Employee Management System — Architecture

<!--
Companion to PRD.md.
PRD says WHAT the system does. This says HOW.
Audience: an engineer who needs to understand the system well
enough to build it, debug it, or extend it.
-->

---

## 1. Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.1 (App Router, TypeScript, React 19) |
| Styling | Tailwind CSS 4 |
| HTTP Client | Axios |
| Forms | react-hook-form · react-hot-toast |
| Backend | Node.js · Express.js 5 |
| ORM | Sequelize 6 |
| Database | MySQL 8.0+ |
| Auth | JWT (jsonwebtoken) · bcrypt (12 rounds) · in-memory token blacklist |
| File Processing | multer · Sharp · Puppeteer · Mammoth · pdfkit |
| Scheduling | node-cron |
| Security | Helmet.js · express-rate-limit · xss · express-validator · AES-256-GCM (Node crypto) |

---

## 2. Components

```
NIC-MoSJE-Employee-Management/
  frontend/src/app/          Next.js App Router pages (public + role dashboards)
  frontend/src/components/   Shared UI and layout components
  backend/routes/            Express route handlers (one file per resource)
  backend/models/            Sequelize models + associations
  backend/middleware/        Auth guards, rate limiters, audit logger, XSS sanitizer
  backend/services/          NotificationService (cron scheduler)
  backend/utils/             Encryption, file upload, password validation helpers
  backend/scripts/           One-shot setup scripts (init DB, seed, create admin)
```

### Frontend (Next.js App Router)

Public landing page (`/`) and public-facing auth routes (`/login`, `/register`) have a separate layout with `PublicNavbar` and `PublicFooter`. Authenticated routes split into three dashboard trees:

- `/admin/*` — admin-only: employee list, employee detail, add employee, documents, notifications, profile
- `/employee/*` — employee-only: own dashboard and documents
- `/superadmin/*` — superadmin profile

`DashboardLayout` wraps all authenticated pages with a collapsible `Sidebar`. Token storage and role extraction use `js-cookie` and a thin `/lib/auth` helper. All API calls go through a shared Axios instance at `/lib/api` which reads `NEXT_PUBLIC_API_URL`.

### Backend (Express.js)

Single entry point: `server.js`. Middleware applied in order: Helmet security headers → CORS (origin whitelist) → JSON body parser (10MB limit) → global XSS sanitizer → rate limiters → routes → 404 handler → global error handler.

In production, the server starts HTTPS via Node's built-in `https` module with SSL certs loaded from env-var paths. In development it starts plain HTTP.

### Auth Middleware (`middleware/auth.js`)

Three exported guards: `auth` (any valid JWT), `adminAuth` (admin or superadmin role), `superAdminAuth` (superadmin only). On each request: extract Bearer token → check in-memory blacklist → verify JWT signature → check in-memory account lockout → load User + Employee from DB → attach to `req.user`. The in-memory blacklist and lockout maps are process-local; production would require Redis.

### Notification Service (`services/notificationService.js`)

node-cron job fires daily at 09:00. For every employee it checks: birthday, marriage anniversary, work anniversary (joiningDate), and leaving-related events (7-day reminder, last-day alert, leaving anniversary). Deduplication: before inserting, it queries for an existing `Notification` with the same `type + employeeId + date`. Notifications fan out to all admin users via a `NotificationRecipient` join row.

### File Utilities (`utils/fileUpload.js`, `utils/secureFileUpload.js`)

`createEmployeeDirectories` creates a per-employee folder structure (`NIC-{id}/{FirstName_LastName}/`) at employee creation time. `deleteEmployeeDirectory` removes it on delete. multer handles the multipart upload; Sharp converts images; Puppeteer renders DOCX → PDF; Mammoth extracts text for searchability.

---

## 3. Data Flow

```
[Browser] -- POST /api/auth/login --> [loginLimiter] --> [Express route]
    --> bcrypt.compare password
    --> JWT issued (1-hour expiry) + refreshToken
    --> token stored in client cookie via js-cookie

[Admin clicks "Add Employee"]
    --> POST /api/employees (Authorization: Bearer <token>)
    --> [adminAuth]: verify JWT, check blacklist, load user, assert role
    --> validatePassword (12-char complexity, personal info check)
    --> User.create (bcrypt hash at model hook, saltRounds=12)
    --> Employee.create (linked to userId)
    --> createEmployeeDirectories (NIC-{id}/{Name}/)
    --> 201 with employee JSON

[Employee uploads document]
    --> POST /api/documents (multipart/form-data)
    --> [auth]: JWT guard
    --> multer saves file to employee directory
    --> Puppeteer/Mammoth converts non-PDF to PDF if needed
    --> Document.create (status='pending')
    --> Admin sees count on dashboard

[node-cron fires at 09:00]
    --> Employee.findAll()
    --> for each employee: check birthday/anniversary/leaving matches tomorrow's MM-DD
    --> deduplicate against existing Notification rows
    --> Notification.create + NotificationRecipient.create per admin
```

1. Client authenticates with email or username + password; JWT returned.
2. Admin creates an employee record, which atomically creates a User account and an Employee profile, then provisions the file-system directory.
3. Employees upload documents; documents start in `pending` status and appear in the admin's dashboard approval queue.
4. The nightly cron sweeps all employees, computes date matches, and materialises notifications for admin users.
5. Admin views real-time stats (total employees, active employees, pending documents, pending registrations) on the dashboard.

---

## 4. Database Schema

- `users` — id, email, username, password (bcrypt hash), role (admin | employee | superadmin), failedLoginAttempts, accountLockedUntil, isActive, passwordChangedAt, twoFactorSecret, twoFactorEnabled
- `employees` — id, employeeId (3-digit string, unique), firstName, lastName, email, personalEmail, phone, dateOfBirth, joiningDate, leavingDate, marriageAnniversary, address, city, district, state, pincode, department, departmentId, position, positionId, status (active | inactive | retired), userId (FK → users)
- `documents` — id, employeeId (FK), documentTypeId (FK), fileName, originalName, filePath, fileSize, mimeType, status (pending | approved | rejected), uploadedBy (FK → users), approvedBy (FK → users), approvedAt, rejectionReason, issueDate, expiryDate, version
- `departments` — id, name
- `positions` — id, title, departmentId (FK)
- `document_categories` — id, name
- `document_types` — id, name, categoryId (FK)
- `notifications` — id, type (birthday | anniversary | joining_anniversary | leaving_anniversary | leaving_reminder | leaving_date), employeeId (FK), title, message, date
- `pending_registrations` — id, firstName, lastName, email, username, status (pending | approved | rejected)

**Indexes:** `users(email)`, `users(username)` (both unique) — hot paths for login lookup. `users(role)` and `users(isActive)` — admin list queries filter on both columns.

---

## 5. API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate with email/username + password; returns JWT |
| `POST` | `/api/auth/logout` | Blacklist the current token |
| `POST` | `/api/auth/refresh` | Issue a new access token using refresh token |
| `GET` | `/api/employees` | List employees with pagination and search/filter (admin only) |
| `POST` | `/api/employees` | Create employee + user account atomically (admin only) |
| `GET` | `/api/employees/:id` | Fetch single employee (own record for employees; any for admin) |
| `PUT` | `/api/employees/:id` | Full update — department, position, status (admin only) |
| `PUT` | `/api/employees/:id/profile` | Self-service update — personal contact fields only |
| `DELETE` | `/api/employees/:id` | Delete employee, user, and file directory (admin only) |
| `PUT` | `/api/employees/:id/reset-password` | Admin resets employee password with full policy validation |
| `GET` | `/api/documents` | List documents for current user or employee (role-gated) |
| `POST` | `/api/documents` | Upload document (multipart) |
| `GET` | `/api/documents/pending-approvals` | List pending documents (admin only) |
| `PATCH` | `/api/documents/:id/approve` | Approve a document (admin only) |
| `PATCH` | `/api/documents/:id/reject` | Reject a document with reason (admin only) |
| `GET` | `/api/notifications` | Get notifications for current user |
| `GET` | `/api/departments` | List all departments |
| `GET` | `/api/positions` | List positions (optionally filtered by department) |
| `POST` | `/api/registration` | Self-register (rate-limited to 3/hour) |
| `GET` | `/api/registration/pending` | List pending self-registrations (admin only) |
| `POST` | `/api/registration/approve/:id` | Approve registration with employeeId + phone (admin only) |
| `POST` | `/api/registration/reject/:id` | Reject and delete pending registration (admin only) |
| `GET` | `/api/dashboard/stats` | Count stats: employees, active, pending docs/registrations (admin) |
| `GET` | `/api/dashboard/activities` | Recent 5 employees and documents (admin) |

---

## 6. Security

- **Secrets:** All API keys and credentials in env vars only — `.env` gitignored, `.env.example` committed with placeholder values. Never logged.
- **Password hashing:** bcrypt with 12 salt rounds. Password history tracked in-process to prevent reuse of last 5 passwords. Complexity: 12+ chars, uppercase, lowercase, digit, special character. Personal info (name, email, username, phone) blocked from appearing in password.
- **JWT:** Access token expires in 1 hour. Tokens are blacklisted on logout via an in-memory `Set`. In production this must move to Redis.
- **Account lockout:** 5 failed login attempts → account locked for 30 minutes. Tracked in both the User model (`failedLoginAttempts`, `accountLockedUntil` columns) and a middleware-level in-memory map.
- **Rate limiting:** Login: 5 attempts / 15 min. Registration: 3 / hour. File upload: 10 / hour. General: 500 / 15 min. API: 1000 / 15 min.
- **XSS:** Global middleware sanitizes `req.body`, `req.query`, and `req.params` with the `xss` library before any handler sees them.
- **SQL injection:** Sequelize parameterized queries at the ORM level; no raw query strings with user input.
- **Encryption:** AES-256-GCM (Node `crypto`) available for PII fields; key derived with `scryptSync` from `ENCRYPTION_KEY` env var.
- **CORS:** Origin whitelist — only `FRONTEND_URL` and localhost variants allowed. Returns `403` for unlisted origins.
- **Security headers:** Helmet with strict CSP (`defaultSrc: 'self'`), HSTS (1 year, includeSubDomains, preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`.
- **File uploads:** multer with size limits and MIME type validation before any file is written to disk.

---

## 7. Error Handling & Reliability

| Failure | Behaviour |
|---|---|
| Invalid JWT | 401 before any DB query — short-circuit in auth middleware |
| Account locked | 423 with remaining lock time in minutes |
| Failed login | Increments counter in both User model and in-memory map; 401 with generic "Invalid credentials" (no enumeration) |
| DB write fails | 500 with error detail in development; generic "Internal server error" in production (no stack trace leaked) |
| Notification duplicate | Deduplicated before insert — existing notification for same type + employee + date skips creation silently |
| File upload limit exceeded | 10 uploads/hour rate limiter returns 429 before multer processes the file |
| Missing env vars | `ENCRYPTION_KEY` absence throws at startup; `JWT_SECRET` absence causes jwt.sign to throw on first login |

---

## 8. Deployment

1. Clone repo; `cd backend && npm install` then `cd ../frontend && npm install`.
2. Copy `.env.example` to `.env` in both `backend/` and `frontend/` and fill all values.
3. `npm run init-db` → create MySQL database. `npm run seed-data` → departments, positions, document categories. `npm run create-admin` → default admin user.
4. Backend: `npm start` (production) or `npm run dev` (nodemon). In production, set `NODE_ENV=production` and provide `SSL_KEY_PATH` / `SSL_CERT_PATH` for HTTPS.
5. Frontend: `npm run build && npm start` (Next.js production build on port 3000).
6. Set `NEXT_PUBLIC_API_URL` in the frontend env to the backend's public URL.

---

## 9. Explicit Scope Cuts

- **Redis session store** — Token blacklist and account lockout maps are in-process memory. A multi-instance deployment would require Redis; deferred to v2.
- **Real-time notifications** — Cron polling rather than WebSocket push. Admin must refresh to see new notifications; sufficient for the demo scope.
- **Email delivery** — `nodemailer` is configured in env vars but email sending is not wired into the notification flow in v1. Infrastructure is present; integration deferred.
- **2FA enforcement** — The `twoFactorSecret` and `twoFactorEnabled` columns exist on the User model, but the TOTP flow is not implemented in v1 routes.
- **Audit log persistence** — `middleware/auditLogger.js` logs security events to console. Persisting to a DB table or SIEM is a v2 item.
