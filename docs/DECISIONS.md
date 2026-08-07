# Engineering Decisions — NIC-MoSJE Employee Management System

<!--
This is not user documentation. It is for technical interviewers
and senior engineers who want to understand WHY the system is built
the way it is. Every entry answers a question an interviewer might ask.
-->

---

## Decision 1 — Sequelize ORM over raw SQL queries

**Context:** The backend needs to read and write to MySQL across 9 tables with associations. Two options: Sequelize ORM or hand-written SQL with mysql2.

**Decision:** Sequelize with model-level validation and parameterized queries throughout.

**Reason:** SQL injection is one of the most common vulnerabilities in web apps, and it is the most catastrophic for a government employee database. Sequelize makes parameterized queries the default — there is no opt-in required per handler. It also allows model-level validators (email format, 3-digit employee ID, 10-digit phone number) to run synchronously before any DB write, without duplicating validation logic across route handlers. Sequelize `sync({ alter: false })` handles schema alignment on startup, which simplifies the deploy path for a v1 with no migration runner.

**Tradeoff:** Sequelize adds abstraction overhead and its association API is verbose. Complex JOIN queries are harder to read than raw SQL. For v1 scope (straightforward CRUD + filters) this is acceptable; heavy reporting queries in v2 would benefit from raw SQL or a query builder.

---

## Decision 2 — JWT with in-memory token blacklist instead of stateful sessions

**Context:** The API needs to support authentication for a browser client. Options: server-side sessions (express-session), stateless JWT, or a hybrid with a persistent blacklist.

**Decision:** JWT access tokens (1-hour expiry) with an in-memory `Set` for blacklisting logged-out tokens.

**Reason:** JWT allows the API to be stateless per-request — no session lookup on every call, which simplifies horizontal scaling. The 1-hour expiry limits the blast radius of a stolen token. The blacklist handles the "logout invalidates the token immediately" requirement without requiring a DB round-trip on every request.

**Tradeoff:** The in-memory blacklist is process-local. A server restart clears it, making recently logged-out tokens valid again until their natural 1-hour expiry. In a multi-instance deployment, different instances have different blacklists — a token logged out on instance A is still valid on instance B. This is an explicit v1 tradeoff; the fix is moving to Redis, which is documented in v2 candidates.

---

## Decision 3 — node-cron for notifications instead of BullMQ + Redis

**Context:** Admins need daily reminders about upcoming employee events (birthdays, anniversaries, leaving dates). Options: a cron job in-process, BullMQ with Redis, or a cloud scheduler.

**Decision:** `node-cron` scheduling directly in the Express server process.

**Reason:** The notification workload is a single daily sweep — one job, one time, low volume. There is no retry requirement (a failed run is simply missed for that day and retried the next), no priority queue, and no fan-out beyond writing a handful of DB rows. BullMQ adds Redis as a hard infrastructure dependency and significant operational complexity for what is essentially a scheduled DB query. Cron keeps the entire backend deployable as a single Node process.

**Tradeoff:** The cron job shares the server process with the API. A long-running cron sweep can block the event loop for a brief period. If the server is down at 09:00, the day's notifications are missed (no missed-job recovery). In a production system handling thousands of employees, a dedicated worker process with Redis-backed job queue would be appropriate.

---

## Decision 4 — bcrypt with 12 rounds (not the default 10)

**Context:** Password hashing is required. The default bcrypt cost factor in most Node libraries is 10.

**Decision:** bcrypt with `saltRounds = 12` everywhere passwords are hashed.

**Reason:** Government IT security guidelines require strong password protection. Increasing from 10 to 12 rounds roughly quadruples the hash computation time, making offline brute-force attacks meaningfully more expensive. On a modern server, 12 rounds keeps hash time under 500ms per password — acceptable latency for login and employee creation, which are infrequent operations.

**Tradeoff:** Higher cost makes the `/login` and `/create-employee` endpoints slower under load. With rate limiting at 5 login attempts per 15 minutes, this is not a practical concern for normal traffic; it only matters if the rate limiter were bypassed.

---

## Decision 5 — Per-employee filesystem directory instead of flat uploads folder

**Context:** Employee documents must be stored and retrievable by employee. Options: flat uploads folder with DB-tracked filenames, or a per-employee directory hierarchy.

**Decision:** Create `NIC-{id}/{FirstName_LastName}/` directories at employee creation time; store documents inside the employee's own directory.

**Reason:** A flat folder becomes unmanageable as employee count grows and makes accidental cross-employee file access easier if path construction has a bug. Per-employee directories make the file layout auditable without the DB — an admin can verify what's on disk just by listing directories. `createEmployeeDirectories` runs in the same request as employee creation, so the directory always exists when the first document is uploaded.

**Tradeoff:** Local filesystem storage does not survive a server replacement without manual backup or volume mounts. This is acceptable for a demo/v1 deployment; production would require object storage (S3, MinIO, or NIC cloud equivalent) with the DB storing keys rather than file paths.

---

## What I'd do differently in v2

- **Redis for blacklist and lockout** — The in-memory token blacklist and account lockout map are the biggest reliability gaps. Moving these to Redis makes them survive restarts and work correctly across multiple server instances.
- **Refresh token rotation with per-device revocation** — The current auth flow issues a refresh token but does not rotate it or track device sessions. Per-device revocation (e.g., "log out all other devices") requires a DB-backed refresh token table.
- **Persistent audit log table** — Security events (login attempts, lockouts, document approvals) are currently `console.log`-only. A queryable audit table would be required for any government compliance review.
- **Object storage for documents** — Replace the local filesystem with object storage so documents survive server replacements and can be served via signed URLs.
- **Email notifications** — The SMTP configuration (`nodemailer`, env vars) is already wired; the integration into `NotificationService` is a v2 one-liner once the email templates are designed.

---

## Explicit non-decisions (deferred to v2)

| Feature | Why deferred |
|---|---|
| Two-factor authentication | DB columns (`twoFactorSecret`, `twoFactorEnabled`) exist on the User model. TOTP enrolment and verification flow not built — adds significant UX complexity for a demo scope. |
| Real-time notifications (WebSocket) | Admin refreshes the page to see new notifications. WebSocket adds infrastructure and client-side complexity without changing the core v1 requirement. |
| Payroll or leave management | Different problem domain requiring a separate data model. Keeping v1 focused on employee records and documents keeps the schema and UI manageable. |
| Multi-tenancy | Single ministry (MoSJE) scope. Multi-tenant would require per-tenant data isolation, billing, and admin hierarchy — disproportionate to v1 needs. |
