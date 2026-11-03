# CampusCode — MERN Stack Edition

**Build. Manage. Sell. Earn.**

A production-quality student-focused software marketplace and project-management platform built on a pure **MERN Stack** (MongoDB, Express.js, React SPA, Node.js). CampusCode connects student developers with individuals and organizations that need software solutions.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 SPA, Vite, React Router v6, Tailwind CSS v4, Framer Motion, Lucide React, Recharts |
| **Backend** | Node.js, Express.js, TypeScript (ESM) |
| **Database** | MongoDB with Mongoose ODM (MongoDB Atlas) |
| **Authentication** | JWT (JSON Web Tokens) with bcryptjs password hashing |
| **Payments** | Razorpay-ready integration / simulated wallet transactions |
| **AI Services** | Gemini / OpenAI integration endpoints (mock-ready fallback) |

---

## 📁 Repository Structure

```
CampusCode/
├── client/                   # React Single-Page Application (Vite)
│   ├── index.html
│   ├── vite.config.ts        # Vite config with API proxy to port 5000
│   ├── package.json          # Frontend dependencies & scripts
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.tsx          # React DOM entrypoint & Providers
│   │   ├── App.tsx           # React Router v6 routing table
│   │   ├── types/            # Shared TypeScript domain models & DTOs
│   │   ├── context/          # AuthContext, ThemeContext, Notifications
│   │   ├── components/       # Primitives, Navbar, Footer, DashboardLayout
│   │   └── pages/            # Public, Auth, Dashboard, and Admin views
│   └── dist/                 # Production build output
└── server/                   # Express & MongoDB REST API
    ├── .env                  # Server environment variables
    ├── .env.example          # Environment template
    ├── package.json          # Backend dependencies & scripts
    ├── tsconfig.json
    ├── src/
    │   ├── index.ts          # Express server entry & route mounting
    │   ├── config/           # MongoDB Atlas connection handler
    │   ├── middleware/       # JWT auth & RBAC (Student, Client, Admin)
    │   ├── models/           # Mongoose Schemas (User, Project, Task, Product, etc.)
    │   ├── controllers/      # REST API route handlers
    │   ├── routes/           # Express router endpoints
    │   └── seed/             # Database seed & clear scripts
    └── dist/                 # Compiled backend JavaScript
```

---

## 🚀 Running the Project

Run the backend and frontend in separate terminal windows:

### Terminal 1: Backend Server (Port 5000)
```bash
cd server
npm run dev
```

### Terminal 2: Frontend Client (Port 5173)
```bash
cd client
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Building for Production

```bash
# Build backend
cd server && npm run build

# Build frontend
cd ../client && npm run build
```

---

## 🗄 Database Management

From the `server` directory:

```bash
cd server

# Seed database with sample data
npm run seed

# Clear all data from MongoDB
npm run clear
```
