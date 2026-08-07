# Local Setup — NIC-MoSJE Employee Management System

> This is a demo repository. The production system used by the Government of India is classified and cannot be accessed externally. This guide covers running the demo locally.

---

## Prerequisites

- Node.js 20+
- MySQL 8.0+ (running locally or via Docker)
- npm (bundled with Node.js)
- (Optional for PDF conversion in production) Puppeteer-compatible Chromium binary

---

## 1. Clone and install

```bash
git clone https://github.com/tanisheesh/NIC-MoSJE-Employee-Management
cd NIC-MoSJE-Employee-Management

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 2. Environment variables — Backend

Copy the example file and fill in the values:

```bash
cd backend
cp .env.example .env
```

| Variable | Description | Where to get it |
|---|---|---|
| `DB_HOST` | MySQL host | `localhost` for local MySQL |
| `DB_PORT` | MySQL port | Default: `3306` |
| `DB_NAME` | Database name | Create this in MySQL: `employee_management` |
| `DB_USER` | MySQL username | Your MySQL user |
| `DB_PASSWORD` | MySQL password | Your MySQL user's password |
| `JWT_SECRET` | JWT signing secret | Generate: `openssl rand -hex 64` — minimum 32 characters |
| `ENCRYPTION_KEY` | AES-256 key for PII fields | Generate: `openssl rand -hex 64` — minimum 32 characters |
| `EMAIL_HOST` | SMTP host | `smtp.gmail.com` or your SMTP provider |
| `EMAIL_USER` | SMTP username | Your email address |
| `EMAIL_PASS` | SMTP app password | Gmail: Settings → Security → App Passwords |
| `SESSION_SECRET` | Session signing secret | Generate: `openssl rand -hex 32` |
| `NODE_ENV` | Environment | `development` for local |
| `PORT` | Backend port | Default: `5000` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `SSL_KEY_PATH` | SSL private key path | Production only — path to your `.key` file |
| `SSL_CERT_PATH` | SSL certificate path | Production only — path to your `.crt` file |

---

## 3. Environment variables — Frontend

```bash
cd frontend
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Full URL to the backend API — e.g. `http://localhost:5000/api` |
| `NEXT_PUBLIC_ENABLE_HTTPS` | `false` for local development |
| `NEXT_PUBLIC_SECURE_COOKIES` | `false` for local development |
| `NODE_ENV` | `development` |

---

## 4. Database setup

Make sure MySQL is running, then:

```bash
cd backend

# Step 1 — Create the database
npm run init-db

# Step 2 — Create all tables and seed reference data
# Seeds: 5 departments, 34 positions, 4 document categories, 21 document types
npm run seed-data

# Step 3 — Create the default admin user
# Default credentials: admin@company.com / AdminPassword123!
npm run create-admin
```

The Sequelize models will create all tables automatically on first run via `sequelize.sync()`. The seed script populates the lookup tables (departments, positions, document types) and the init script creates the database if it doesn't exist.

---

## 5. Run locally

Open two terminal windows:

**Terminal 1 — Backend:**

```bash
cd backend
npm run dev
# Server starts at http://localhost:5000
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
# App starts at http://localhost:3000
```

Open `http://localhost:3000` in your browser. Log in with `admin@company.com` / `AdminPassword123!`.

---

## 6. Default seed data

After running `npm run seed-data` and `npm run create-admin`:

| Data | Details |
|---|---|
| Departments | HR, IT, Finance, Marketing, Operations |
| Positions | 34 roles across all departments |
| Document categories | Personal, Employee, Medical, Financial |
| Document types | 21 types (Aadhaar, PAN, Passport, Degree, etc.) |
| Admin user | `admin@company.com` / `AdminPassword123!` |

---

## 7. Deploy to production

1. Set `NODE_ENV=production` in the backend `.env`.
2. Provide `SSL_KEY_PATH` and `SSL_CERT_PATH` pointing to your SSL certificate files.
3. Set `FRONTEND_URL` to your production domain.
4. Run `npm start` in the backend directory — the server will start HTTPS automatically when `NODE_ENV=production`.
5. Build and start the frontend: `npm run build && npm start` (runs on port 3000 by default; use a reverse proxy like Nginx to terminate SSL on the frontend as well).
6. Update `NEXT_PUBLIC_API_URL` in the frontend env to the production backend URL.

---

## Known local-only limitations

- **Token blacklist is in-memory** — Restarting the backend server clears the blacklist. Logged-out tokens become valid again until their 1-hour expiry. Production deployments need Redis.
- **Account lockout is in-memory** — Same caveat. The User model's `failedLoginAttempts` column persists across restarts, but the middleware-level lockout map resets.
- **File storage is local** — Uploaded documents are stored in the backend process's working directory. Files are lost if the server machine is replaced. Use object storage in production.
- **Puppeteer / PDF conversion** — Puppeteer downloads a Chromium binary on `npm install`. On headless Linux servers this may require additional libraries (`libglib2.0`, `libnss3`, etc.). Pass `--no-sandbox` in Puppeteer launch options for containerised environments.
- **Email is not wired** — SMTP credentials are accepted in `.env` but email sending is not integrated into the notification flow in v1. Notifications appear in the admin dashboard only.
