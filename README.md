<p align="center">
  <img src="frontend/src/app/favicon.ico" width="64" height="64" alt="NIC-MoSJE Employee Management System">
</p>

<h1 align="center">NIC-MoSJE Employee Management System</h1>

<p align="center">
  <strong>Enterprise-grade employee management system built for the National Informatics Centre under the Ministry of Social Justice &amp; Empowerment, Government of India.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/MySQL-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/license-GPL--3.0-1D4ED8?style=flat-square" alt="License">
</p>

---

## What is this?

The NIC-MoSJE Employee Management System is a full-stack web application developed during an internship at the National Informatics Centre (NIC) for the Ministry of Social Justice & Empowerment. It replaces paper-based HR workflows with a secure, digitised system for managing employee records, documents, and lifecycle events — aligned with the Digital India initiative. This repository is a demo version; the production system is classified under government security restrictions.

---

## What you get

- **Role-based employee CRUD** — Three-tier access control (employee, admin, superadmin) with full lifecycle management: hire, transfer, retire, delete, and per-role data visibility enforcement at every route.
- **Document vault with approval workflow** — Upload PDFs, DOCX, and images per employee; automatic PDF conversion via Puppeteer; admins approve or reject with audit trail and versioning.
- **Automated event notifications** — Daily cron at 9 AM checks birthdays, work anniversaries, marriage anniversaries, and leaving reminders for all employees; deduplicates before inserting.
- **Registration approval flow** — Employees self-register; admin assigns a 3-digit NIC employee ID and phone number upon approval, keeping employee IDs out of self-service hands.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16.1 (App Router) · React 19 · TypeScript · Tailwind CSS 4 |
| Backend | Node.js · Express.js 5 · Sequelize ORM |
| Database | MySQL 8.0+ |
| Auth | JWT (1-hour access token) · bcrypt (12 rounds) · in-memory token blacklist |
| File Processing | Sharp · Puppeteer · Mammoth · pdfkit · multer |
| Scheduling | node-cron (daily notification jobs) |
| Security | Helmet.js · express-rate-limit · xss · express-validator · AES-256-GCM |

---

## Engineering Decisions

**Why Sequelize ORM over raw SQL?**
Sequelize enforces parameterized queries by default, eliminating the SQL injection surface without discipline at every call site. Model-level validations (email format, 3-digit employee ID, 10-digit phone) run before any DB write reaches the handler.

**Why JWT with an in-memory token blacklist instead of stateful sessions?**
JWT allows a stateless API design that can scale horizontally. The in-memory blacklist handles immediate revocation on logout. In production this would move to Redis — the current in-memory store is an explicit v1 tradeoff documented in DECISIONS.md.

**Why node-cron instead of BullMQ for notifications?**
Notifications fire once daily; there are no retry requirements, no fan-out at volume, and no need for a persistent queue. Cron keeps the infrastructure to a single Node process without a Redis dependency for the v1 scope.

**What would you do differently in v2?**
Move the token blacklist to Redis (survives restarts, works across multiple instances), add refresh token rotation with per-device revocation, and replace the in-memory account-lockout tracker with a DB-backed counter so lockouts survive pod restarts.

---

## Docs

| Document | Description |
|---|---|
| [PRD](docs/PRD.md) | Product requirements — goals, user stories, non-goals |
| [Architecture](docs/ARCHITECTURE.md) | System design, data flow, component breakdown |
| [Decisions](docs/DECISIONS.md) | Every major technical decision and why |
| [Setup](docs/SETUP.md) | Local dev setup, env vars, database initialisation |

---

## Author

**Tanish Poddar** — [tanisheesh.in](https://tanisheesh.in) · [LinkedIn](https://linkedin.com/in/tanisheesh) · [GitHub](https://github.com/tanisheesh)

AWS Student Builder Lead · SRM IST · Ex-NIC Govt of India
