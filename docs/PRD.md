# NIC-MoSJE Employee Management System — Product Requirements Document

**Status:** Final (v1 / Demo)
**Owner:** Tanish Poddar
**One-liner:** A secure, role-gated employee management system built for the National Informatics Centre under the Ministry of Social Justice & Empowerment, Government of India.

---

## 1. Problem

Government HR departments at NIC-MoSJE manage hundreds of employee records, physical documents, and recurring event tracking (birthdays, anniversaries, retirement) through manual, paper-based processes. Maintaining physical document folders per employee is error-prone and creates compliance gaps. Admins have no central view of upcoming employee lifecycle events, and new employee onboarding requires paper forms routed through multiple approvals. This system digitises and centralises those workflows.

---

## 2. Goals (v1 / MVP)

1. Admin can create, read, update, and delete employee records with full profile data.
2. Employees can self-register; admins approve or reject with an assigned NIC employee ID.
3. Employees can upload documents (PDF, DOCX, images); admins approve or reject with a reason.
4. A daily automated job notifies admins of upcoming birthdays, work anniversaries, marriage anniversaries, and leaving-related events.
5. Admins see a real-time dashboard with employee counts, pending document approvals, and pending registrations.
6. All routes enforce role-based access (employee, admin, superadmin); no cross-role data leakage.
7. The system meets government IT security standards: bcrypt password hashing (12 rounds), JWT auth with blacklisting, account lockout, rate limiting, XSS sanitization, CORS whitelist, and HTTPS in production.
8. Working demo deployed locally with seed data and a documented setup path.

---

## 3. Non-Goals (explicit scope cuts)

- **Email delivery** — SMTP configuration exists but email sending is not wired to notifications in v1. The notification system is dashboard-only.
- **Two-factor authentication** — DB columns exist for 2FA but the TOTP enrolment and verification flow is not implemented.
- **Real-time push (WebSockets)** — Notifications appear on page load/refresh; no WebSocket connection in v1.
- **Redis / distributed session store** — Token blacklist and account lockout are in-process memory; not suitable for multi-instance deployment.
- **Audit log database persistence** — Security events are logged to console; not stored in a queryable DB table.
- **Mobile app** — The frontend is a responsive web app, not a native mobile app.
- **Payroll or leave management** — Out of scope; this system tracks employee records and documents only.

---

## 4. Users

**Primary:** HR admins and department heads at NIC-MoSJE who manage employee lifecycle, approve documents, and review notifications.

**Secondary:** Individual employees who manage their own profile, upload personal documents, and self-register for an account.

**Tertiary:** Superadmins (NIC IT administrators) who manage system-level configuration and admin accounts.

---

## 5. User Stories

1. *As an admin,* I want to add a new employee with their personal, professional, and contact details so that a system record exists before the employee's first day.
2. *As an admin,* I want to see pending self-registration requests and approve them with a NIC employee ID and phone number so that employees cannot assign their own IDs.
3. *As an admin,* I want to see pending document uploads and approve or reject each one so that only verified documents are stored in the employee's official record.
4. *As an admin,* I want to receive daily notifications about upcoming birthdays, anniversaries, and leaving dates so that I can send timely acknowledgements without manual tracking.
5. *As an employee,* I want to update my personal contact details (phone, address, personal email) without waiting for an admin so that my record stays current.
6. *As an employee,* I want to upload documents to my profile and track their approval status so that I know which files are part of my official record.
7. *As an employee,* I want my account to be locked after 5 failed login attempts so that unauthorised access attempts are blocked without me needing to take action.

---

## 6. Functional Requirements

### 6.1 Authentication

- Users authenticate with email or username + password.
- JWT access token expires in 1 hour; logout blacklists the token immediately.
- Password must be 12+ characters with uppercase, lowercase, digit, and special character. Must not contain the user's first name, last name, email, or username.
- 5 consecutive failed login attempts lock the account for 30 minutes.
- Login endpoint is rate-limited to 5 attempts per 15 minutes.

### 6.2 Employee Management (Admin)

- Admin can create employees; creation atomically creates a User account + Employee profile + file-system directory (`NIC-{id}/{FirstName_LastName}/`).
- Employee ID is a 3-digit numeric string assigned by admin (cannot be self-assigned).
- Admin can search employees by name, email, or employee ID; filter by department or status.
- Admin can update any employee field including department, position, and status (active / inactive / retired).
- Admin can reset an employee's password, which is validated against the same policy before hashing.
- Deleting an employee removes the User account, Employee record, and the on-disk file directory.

### 6.3 Self-Registration (Employee)

- Any visitor can submit a registration request (first name, last name, email, username, password).
- Registration is rate-limited to 3 submissions per hour per IP.
- Pending registrations appear on the admin dashboard.
- Admin approves by supplying a 3-digit employee ID and 10-digit phone number; this creates the User + Employee records.
- Admin can reject and delete a pending registration.

### 6.4 Document Management

- Employees can upload documents (PDF, DOCX, DOC, images) to their own profile.
- Non-PDF files are converted to PDF via Puppeteer (DOCX) or Sharp (images) on upload.
- Each document has a type (from the `document_types` table) and an optional issue/expiry date.
- Documents start in `pending` status. Admins approve or reject with an optional rejection reason.
- Approved documents are viewable by the owning employee and any admin.
- Document uploads are rate-limited to 10 per hour.

### 6.5 Notifications

- A cron job runs daily at 09:00 and checks all employees for events occurring the next day.
- Event types: birthday, marriage anniversary, work anniversary (joining date), leaving anniversary, 7-day leaving reminder, last-day alert.
- Notifications are broadcast to all admin users.
- Duplicate notifications (same type + employee + date) are not created.
- Admins can view and mark notifications as read.

### 6.6 Dashboard (Admin)

- Dashboard shows: total employees, active employees count, pending document approvals count, pending registration count.
- Recent activities panel shows last 5 created employees and last 5 uploaded documents.
- Pending account approvals and document approvals are listed with approve/reject quick-actions.

---

## 7. Non-Functional Requirements

- **Security:** All API keys in env vars only, never committed. JWT blacklisting enforced on logout. Password bcrypt (12 rounds). XSS sanitization on all user inputs. Parameterized queries (Sequelize ORM).
- **Auth hardening:** HSTS 1 year with includeSubDomains. CSP defaultSrc: self. X-Frame-Options: DENY. Rate limiting on all sensitive endpoints.
- **Reliability:** No silent notification duplicates — deduplication query runs before every insert. Server startup fails hard if `ENCRYPTION_KEY` or DB connection is absent.
- **Production HTTPS:** When `NODE_ENV=production`, the server loads SSL certs and runs HTTPS via Node's built-in `https` module.
- **Input validation:** express-validator runs schema validation on auth and employee creation routes before any business logic executes.
- **Responsive UI:** Tailwind-based responsive layout; mobile-accessible for employees checking their own profile.

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| Setup time from clone to running app | Under 10 minutes following SETUP.md |
| Auth bypass attempts handled | Account lockout fires correctly after 5 failures |
| Notification deduplication | Zero duplicate notifications for the same event on the same day |
| Document conversion | PDF output produced for DOCX and image uploads without manual intervention |

---

## 9. Risks & Open Questions

- **In-memory token blacklist** — Process restart clears the blacklist. A logged-out token becomes valid again until its 1-hour expiry. Mitigated in v2 by Redis.
- **In-memory account lockout** — Same risk: process restart clears lockouts. The User model also stores `failedLoginAttempts` in the DB as a fallback, but the middleware map takes precedence.
- **File storage at scale** — Documents are stored on the server's local filesystem. No CDN or object storage in v1. Large numbers of employees will grow disk usage linearly.
- **Puppeteer in production** — Puppeteer requires a Chromium binary. Containerised deployments need `--no-sandbox` flags or a separate Chromium sidecar.
- **Open question** — Should the notification system also send email, or remain dashboard-only? SMTP config exists but is not wired.

---

## 10. v2 Candidates

- **Redis token blacklist and lockout store** — Required before multi-instance deployment.
- **Email notifications via nodemailer** — SMTP config already present; just needs the integration in `NotificationService`.
- **Two-factor authentication (TOTP)** — DB columns exist; enrolment flow not built.
- **Audit log table** — Persist security events (login, logout, failed attempts, approvals) to a queryable DB table.
- **Real-time notifications via WebSocket** — Replace poll-on-load with a persistent connection so admins see notifications without refresh.
- **Object storage (S3 or NIC cloud)** — Replace local filesystem document storage with object storage for reliability and scalability.
