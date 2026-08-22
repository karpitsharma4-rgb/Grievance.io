# StyleHive — Clothing E-Commerce Frontend

A production-ready React frontend for a clothing e-commerce platform, built with **Vite**, **Redux Toolkit**, **React Router v6**, **Axios**, and **Tailwind CSS**.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Backend running at `http://localhost:5000` (see [Backend Setup](#backend))

### Installation

```bash
cd "Project-Again-Frontend"
npm install
npm run dev
```

The app runs at **http://localhost:5173**

---

## ⚙️ Environment Variables

Create or edit `.env` in the project root:

```env
VITE_API_BASE_URL=http://localhost:5000
```

> Change this value if your backend runs on a different port or host.

---

## 🗂️ Folder Structure

```
src/
├── App.jsx                   # Root component + all routes
├── main.jsx                  # Entry point (Provider, BrowserRouter, Toast)
├── index.css                 # Tailwind + global component classes
│
├── components/
│   ├── Navbar.jsx            # Nav with cart badge, auth, admin link
│   ├── Footer.jsx
│   ├── ProductCard.jsx       # Reusable product card
│   ├── Pagination.jsx        # Smart paginator with ellipsis
│   ├── ProtectedRoute.jsx    # Redirect to /login if not authenticated
│   └── AdminRoute.jsx        # Redirect if not admin role
│
├── pages/
│   ├── Home.jsx              # Product grid + filters + pagination
│   ├── ProductPage.jsx       # Detail: images, size/color picker, add to cart
│   ├── CartPage.jsx          # Cart items, qty, remove, price breakdown
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Profile.jsx           # View & edit profile
│   ├── Checkout.jsx          # 3-step: Address → Payment → Review
│   ├── OrderSuccess.jsx      # Post-order confirmation
│   ├── MyOrders.jsx          # User order history
│   ├── OrderDetails.jsx      # Full order detail with progress tracker
│   ├── AdminDashboard.jsx    # Stats + recent orders
│   ├── AdminProducts.jsx     # CRUD products (table + modal form)
│   └── AdminOrders.jsx       # All orders + inline status/tracking update
│
├── services/
│   ├── api.js                # Axios instance, token interceptor, 401 logout
│   ├── authService.js
│   ├── productService.js
│   ├── cartService.js
│   └── orderService.js
│
└── store/
    ├── store.js              # Redux store
    └── slices/
        ├── authSlice.js      # user, token, role, isAuthenticated
        ├── cartSlice.js      # cartItems, totalQuantity
        ├── productSlice.js   # products, filters, pagination
        └── orderSlice.js     # currentOrder, orderHistory, allOrders
```

---

## 🔗 Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Home (product grid) | Public |
| `/product/:id` | Product Detail | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/cart` | Shopping Cart | 🔒 Auth |
| `/checkout` | Checkout | 🔒 Auth |
| `/order-success/:id` | Order Confirmation | 🔒 Auth |
| `/my-orders` | My Orders | 🔒 Auth |
| `/orders/:id` | Order Detail | 🔒 Auth |
| `/profile` | My Profile | 🔒 Auth |
| `/admin` | Admin Dashboard | 👑 Admin |
| `/admin/products` | Manage Products | 👑 Admin |
| `/admin/orders` | Manage Orders | 👑 Admin |

---

## 🖥️ Backend Connection

The frontend connects to the backend at `VITE_API_BASE_URL`. All API calls use the service layer in `/src/services/`.

**Auth token flow:**
1. Login/Register → JWT token returned in `response.data.data.token`
2. Token stored in `localStorage` + Redux state
3. Axios interceptor automatically attaches `Authorization: Bearer <token>`
4. On 401 response → token cleared, redirect to `/login`

### Starting the backend

```bash
# In a separate terminal:
cd <your-backend-dir>
npm install
npm run dev     # or: node server.js
```

---

## ✨ Features

- **Mobile-first responsive design** with Tailwind CSS
- **Skeleton loaders** for all loading states
- **Graceful empty states** with actionable CTAs
- **Toast notifications** for all user actions
- **Protected + admin-only routes** with redirect
- **Cart badge** updates in real-time
- **Role-based UI** — Admin nav only visible to admins
- **Persistent auth** — token survives page refresh
- **Auto-profile fetch** on reload if token exists
- **Order price displayed from backend** — not recalculated on frontend

---

## 🧪 Test Credentials

Register a new account via `/register` or use your existing backend seeded users.

To make a user admin, update their `role` field to `"admin"` in MongoDB:

```js
db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
```

---

## 📦 Dependencies

| Package | Purpose |
|---------|---------|
| `react-router-dom` | Client-side routing |
| `@reduxjs/toolkit` + `react-redux` | State management |
| `axios` | HTTP client with interceptors |
| `react-toastify` | Toast notifications |
| `react-icons` | Icon library (Feather Icons) |
| `tailwindcss` | Utility-first CSS |
