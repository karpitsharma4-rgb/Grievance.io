# Grievance.io — Frontend

> **Multi-page web application** for the Grievance.io grievance management system, built with Vanilla HTML/CSS/JavaScript and bundled with Vite.

[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License](https://img.shields.io/badge/License-ISC-blue)](LICENSE)

**Backend Repository →** [grivenceio_backend](https://github.com/chikkuXcode/Grievance/tree/main/grivenceio_backend)

---

## Table of Contents

- [What It Does](#what-it-does)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Pages & User Flows](#pages--user-flows)
- [JavaScript Modules](#javascript-modules)
- [API Integration](#api-integration)
- [Building for Production](#building-for-production)
- [Contributing](#contributing)
- [Support](#support)

---

## What It Does

Grievance.io frontend is a role-aware, multi-page web app that provides dedicated dashboards for students, departmental admins, and super-admins. Students submit and track their grievances; admins respond, escalate, and resolve cases; super-admins manage all cases across departments and download analytical reports.

---

## Features

| Feature | Details |
|---|---|
| 🎓 **Student Dashboard** | File new grievances, track case status, chat with admin |
| 🛡️ **Admin Dashboard** | View department cases, update status, send internal notes |
| 👑 **Super Admin Dashboard** | Institution-wide overview, manage admins, download reports |
| 🔒 **Auth Pages** | Login, register, forgot password with OTP verification |
| 📊 **Reports** | One-click download of Excel (`.xlsx`) and PDF reports |
| 📎 **File Attachments** | Upload images/PDFs when filing a grievance |
| 🔔 **Live Status Badges** | Color-coded `Pending / In Progress / Escalated / Resolved` |
| 📱 **Responsive Design** | Works on desktop, tablet, and mobile |

---

## Project Structure

```
grivienceio_frontend/
├── index.html                  # Landing / redirect page
├── vite.config.js              # Vite multi-page config
├── .env.example                # Environment variable template
├── package.json
├── pages/
│   ├── auth.html               # Login, register, forgot-password
│   ├── student_dashboard.html  # Student portal
│   ├── normal_admin.html       # Departmental admin portal
│   └── superadmin.html         # Super admin portal
└── js/
    ├── api.js                  # Centralized API client (fetch wrapper + session)
    ├── auth.js                 # Auth page logic (login/register/OTP flows)
    ├── core.js                 # Shared utilities (toast, modal, date-format)
    ├── student.js              # Student dashboard logic
    ├── admin.js                # Admin dashboard logic
    └── superadmin.js           # Super admin dashboard logic
```

---

## Prerequisites

- **Node.js** v18 or later
- The **backend server** must be running — see the [Backend README](https://github.com/chikkuXcode/Grievance/tree/main/grivenceio_backend#readme) for setup

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/chikkuXcode/Grievance.git
cd Grievance/grivienceio_frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` if your backend runs on a non-default URL — see [Environment Variables](#environment-variables).

### 4. Start the development server

```bash
npm run dev
```

Vite will open `http://localhost:5173` in your browser automatically.

> **Make sure the backend is running first** at `http://localhost:5000` before starting the frontend.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | *(auto)* | Override the backend API base URL. In dev, defaults to `http://localhost:5000/api`. In production on the same host, defaults to `/api`. |

**`.env` example:**
```env
# Optional — only set if your backend isn't on localhost:5000
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Pages & User Flows

### Landing Page — `index.html`
Splash / redirect screen. Authenticated users are sent directly to their role-specific dashboard.

### Auth — `pages/auth.html`
Three-tab interface:
1. **Login** — email + password, "Remember me" toggle
2. **Register** — student self-registration (name, email, phone, student ID)
3. **Forgot Password** — email → OTP verification → new password

After login the user is redirected based on their role:

| Role | Redirected To |
|------|---------------|
| `student` | `pages/student_dashboard.html` |
| `admin` | `pages/normal_admin.html` |
| `superadmin` | `pages/superadmin.html` |

---

### Student Dashboard — `pages/student_dashboard.html`

- View personal stats (total, pending, in-progress, resolved)
- Browse and search personal grievance list
- **File a new grievance** — category, subject, description, up to 5 attachments
- Open any case to view the full message thread and send follow-up messages
- Download attachments directly from the case detail view

---

### Admin Dashboard — `pages/normal_admin.html`

- View cases assigned to the admin's department
- Filter by status (`Pending`, `In Progress`, `Escalated`, `Resolved`)
- Search by case ID, subject, or student name
- Open a case to:
  - Update status with a mandatory remark
  - Escalate to SuperAdmin with an escalation reason
  - Send messages (public) or internal notes (admin-only)
  - Resolve and close the case (triggers a notification email to the student)
- Download departmental reports (Excel or PDF)

---

### Super Admin Dashboard — `pages/superadmin.html`

- Institution-wide case overview across all departments
- Filter by status and department; full-text search
- Dedicated **Escalated Cases** tab
- **Admin Management** — create, edit, and delete admin accounts
- Download reports for any department and time period

---

## JavaScript Modules

### `js/api.js` — API Client

Central fetch wrapper. All HTTP calls go through this module.

```js
import API from './api.js';

// Login
const result = await API.login('student@demo.com', 'password123');

// File a grievance
const form = new FormData();
form.append('category', 'IT & Technical Support');
form.append('subject', 'VPN issue');
form.append('description', 'Cannot connect.');
const res = await API.fileGrievance(form);

// Get stats for the current user
const stats = await API.getStats();
```

Key capabilities:
- Automatic JWT injection from `localStorage` / `sessionStorage`
- Consistent `{ success, data?, message? }` response shape
- Session save/restore with optional persistence toggle

---

### `js/core.js` — Shared Utilities

```js
import { showToast, formatDate, openModal, closeModal } from './core.js';

showToast('Case submitted successfully!', 'success');
formatDate('2024-03-27T00:00:00Z'); // → "27 Mar 2024"
```

---

### `js/auth.js` — Auth Logic

Handles tab switching, form validation, login/register calls, OTP countdown timer, and post-login role-based redirect.

---

### `js/student.js`, `js/admin.js`, `js/superadmin.js`

Role-specific page controllers:
- Load and render case lists
- Handle modals for case detail, file grievance, status change, escalation
- Wire up search/filter inputs
- Manage report downloads

---

## API Integration

The frontend auto-detects the backend URL:
- **`localhost`** / `127.0.0.1` → `http://localhost:5000/api`
- **Production** (any other host) → `/api` (relative, assumes same origin or reverse proxy)

You can override this with `VITE_API_BASE_URL` in `.env`.

All API responses follow the shape:
```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Error description" }
```

---

## Building for Production

```bash
npm run build
```

Compiled output lands in `dist/`. The build includes all five HTML entry points as separate pages, with bundled and minified JS.

To preview the production build locally:
```bash
npm run preview
```

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
- **Backend:** See the [Backend README](https://github.com/chikkuXcode/Grievance/tree/main/grivenceio_backend#readme) for API setup instructions
- **Full project overview:** Available in the backend repo as [`PROJECT_OVERVIEW.md`](https://github.com/chikkuXcode/Grievance/tree/main/grivenceio_backend/PROJECT_OVERVIEW.md)
