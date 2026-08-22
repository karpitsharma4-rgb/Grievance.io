# Grievance.io — Backend API

> **REST API** for the Grievance.io grievance management system, built with Node.js, Express, and MongoDB.

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![License](https://img.shields.io/badge/License-ISC-blue)](LICENSE)

**Frontend Repository →** [grivienceio_frontend](https://github.com/chikkuXcode/Grievance/tree/main/grivienceio_frontend)

---

## Table of Contents

- [What It Does](#what-it-does)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Seeding the Database](#seeding-the-database)
- [User Roles & Demo Credentials](#user-roles--demo-credentials)
- [Contributing](#contributing)
- [Support](#support)

---

## What It Does

Grievance.io backend is a RESTful API that powers a college/institution grievance portal. Students can submit grievances, departmental admins review and respond, and a super-admin oversees everything institution-wide. The system supports case threading, file attachments, escalation workflows, email notifications, and report generation (Excel / PDF).

---

## Features

| Feature | Details |
|---|---|
| 🔐 **JWT Authentication** | Stateless auth with configurable expiry |
| 👥 **Role-Based Access Control** | `student`, `admin`, `superadmin` roles with route guards |
| 📋 **Grievance Lifecycle** | `Pending → In Progress → Escalated → Resolved` transitions |
| 💬 **Threaded Messaging** | Per-case message threads with internal admin-only notes |
| 📎 **File Attachments** | Up to 5 files (images/PDF, max 5 MB each) via Multer |
| 📧 **Email Notifications** | OTP password reset + resolution emails via Nodemailer |
| 📊 **Reports** | Downloadable Excel (`.xlsx`) and PDF reports by period/department |
| 🌱 **Database Seeding** | Rich seed script with students, admins, and sample cases |

---

## Project Structure

```
grivenceio_backend/
├── server.js               # Entry point — Express app + MongoDB connection
├── .env.example            # Environment variable template
├── package.json
└── backend/
    ├── middleware/
    │   └── auth.js         # JWT protect & restrictTo middleware
    ├── models/
    │   ├── User.js         # User schema (student / admin / superadmin)
    │   └── Case.js         # Case schema with embedded messages & attachments
    ├── routes/
    │   ├── auth.js         # Register, login, OTP reset, change-password
    │   ├── cases.js        # File, view, message, escalate, resolve cases
    │   ├── admin.js        # Admin CRUD (superadmin only)
    │   └── reports.js      # Excel & PDF report downloads
    ├── utils/
    │   └── mailer.js       # Nodemailer helpers
    └── seed.js             # Database seed script
```

---

## Prerequisites

- **Node.js** v18 or later
- **MongoDB** v6+ running locally, or a [MongoDB Atlas](https://www.mongodb.com/atlas) cluster URI

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/chikkuXcode/Grievance.git
cd Grievance/grivenceio_backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and update the values — see [Environment Variables](#environment-variables) below.

### 4. Start the server

```bash
# Development
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000/api`.

### 5. Verify the server is running

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Grievance.io API is running",
  "db": "connected"
}
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/grievancedb

# JWT
JWT_SECRET=change_this_to_a_long_random_secret_string
JWT_EXPIRES_IN=7d

# SMTP (Nodemailer — Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM="Grievance.io" <your@gmail.com>
```

> **Note:** For Gmail, generate an [App Password](https://support.google.com/accounts/answer/185833) rather than using your account password directly.

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Auth — `/api/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/register` | Public | Register a new student account |
| `POST` | `/login` | Public | Login and receive a JWT token |
| `GET` | `/me` | Protected | Get current authenticated user |
| `POST` | `/forgot-password` | Public | Send OTP to email for password reset |
| `POST` | `/verify-otp` | Public | Verify the reset OTP |
| `POST` | `/reset-password` | Public | Reset password using OTP |
| `PUT` | `/change-password` | Protected | Change password (authenticated users) |

**Login example:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@demo.com","password":"password123"}'
```

---

### Cases — `/api/cases`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `POST` | `/` | Student | File a new grievance (supports file upload) |
| `GET` | `/my` | Student | Get the student's own cases |
| `GET` | `/department` | Admin | Get cases in the admin's department |
| `GET` | `/all` | SuperAdmin | Get all cases (with filters) |
| `GET` | `/escalated` | SuperAdmin | Get all escalated cases |
| `GET` | `/stats` | Protected | Get dashboard statistics |
| `GET` | `/:id` | Protected | Get a single case with full message thread |
| `PUT` | `/:id/status` | Admin / SuperAdmin | Change case status (with remark) |
| `PUT` | `/:id/escalate` | Admin | Escalate a case to SuperAdmin |
| `PUT` | `/:id/resolve` | Admin / SuperAdmin | Resolve and close a case (sends email) |
| `POST` | `/:id/message` | Protected | Post a message in a case thread |

**Case status transitions:**
```
Pending → In Progress → Resolved
                     ↘ Escalated → Resolved
```

**File a grievance (with attachment):**
```bash
curl -X POST http://localhost:5000/api/cases \
  -H "Authorization: Bearer <TOKEN>" \
  -F "category=IT & Technical Support" \
  -F "subject=VPN not working" \
  -F "description=Cannot connect to campus VPN since Monday." \
  -F "attachments=@/path/to/screenshot.png"
```

---

### Admin Management — `/api/admin`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/list` | SuperAdmin | List all admin accounts |
| `POST` | `/create` | SuperAdmin | Create a new admin account |
| `PUT` | `/:id` | SuperAdmin | Update admin email / department |
| `DELETE` | `/:id` | SuperAdmin | Delete an admin account |
| `GET` | `/students` | Admin / SuperAdmin | List all student accounts |

---

### Reports — `/api/reports`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| `GET` | `/download` | Admin / SuperAdmin | Download report as Excel or PDF |

**Query parameters for `/download`:**

| Param | Values | Default |
|-------|--------|---------|
| `period` | `weekly`, `15days`, `monthly`, `yearly` | `monthly` |
| `format` | `excel`, `pdf` | `excel` |
| `department` | Any department name or `all` | Admin's own dept / `all` for SuperAdmin |

```bash
# Download monthly Excel report
curl "http://localhost:5000/api/reports/download?period=monthly&format=excel" \
  -H "Authorization: Bearer <TOKEN>" \
  --output report.xlsx
```

---

## Seeding the Database

Populate the database with sample users and grievance cases for development and testing:

```bash
npm run seed
```

This creates:
- 1 Super Admin, multiple Admins (one per department), and multiple Students
- A diverse set of grievance cases in all statuses and categories

---

## User Roles & Demo Credentials

After seeding, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| Student | `student@demo.com` | `password123` |
| Admin | `admin@demo.com` | `password123` |
| Super Admin | `super@demo.com` | `password123` |

---

## Grievance Categories

Cases are routed to departments based on their category:

| Category | Department |
|----------|------------|
| Academic Affairs | Academic Affairs |
| Administration | Administration |
| Facilities & Infrastructure | Facilities & Infrastructure |
| IT & Technical Support | IT & Technical Support |
| Student Welfare & Discipline | Student Welfare & Discipline |

---

## Contributing

1. Fork the repository on GitHub
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/chikkuXcode/Grievance/issues)
- **Frontend:** See the [Frontend README](https://github.com/chikkuXcode/Grievance/tree/main/grivienceio_frontend#readme) for setup instructions
- **Full project overview:** [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md)
