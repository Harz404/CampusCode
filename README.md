# CampusCode — MERN Stack Edition

**Build. Manage. Sell. Earn.**

A production-quality student-focused software marketplace and project-management platform built on a pure **MERN Stack** (MongoDB, Express.js, React SPA, Node.js). CampusCode connects student developers with individuals and organizations that need software solutions.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18 SPA with JavaScript/JSX, React Router v6, Tailwind CSS v4, Framer Motion, Lucide React, Recharts |
| **Build tools** | esbuild (React bundling), PostCSS (Tailwind CSS compilation) |
| **Backend** | Node.js, Express.js, TypeScript (ESM) |
| **Database** | MongoDB with Mongoose ODM (MongoDB Atlas) |
| **Authentication** | JWT (JSON Web Tokens) with bcryptjs password hashing |
| **Payments** | Razorpay-ready integration / simulated wallet transactions |
| **AI Services** | Gemini / OpenAI integration endpoints (mock-ready fallback) |

---

## 📁 Repository Structure

```
CampusCode/
├── client/                   # React Single-Page Application
│   ├── index.html
│   ├── scripts/build.mjs     # React/CSS build and development watch mode
│   ├── package.json          # Frontend dependencies & scripts
│   ├── jsconfig.json         # JavaScript editor settings & @/ import alias
│   ├── src/
│   │   ├── main.jsx          # React DOM entrypoint & Providers
│   │   ├── App.jsx           # React Router v6 routing table
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

Use Node.js 20 or newer. Install dependencies in both `client` and `server` with `npm install`. Copy `server/.env.example` to `server/.env` if it does not exist, then configure your MongoDB connection and JWT secret.

Express serves the frontend and API together at port 5000. Run the server and frontend builder in separate terminal windows:

### Terminal 1: Backend Server (Port 5000)
```bash
cd server
npm run dev
```

### Terminal 2: Frontend Builder (Watch Mode)
```bash
cd client
npm run dev
```

After the first frontend build finishes, visit [http://localhost:5000](http://localhost:5000). The builder watches frontend source, styles, HTML, and optional `client/public` assets. Refresh the browser after changes; hot module replacement is not enabled.

API requests use the same origin, so a separate frontend server or API proxy is unnecessary. If you change `PORT`, update `CLIENT_URL` in `server/.env` to match.

---

## 📦 Building for Production

```bash
# Build backend
cd server && npm run build

# Build frontend
cd ../client && npm run build

# Start Express (serves the API and client/dist)
cd ../server && npm start
```

Set `NODE_ENV=production` in the deployment environment. Deploy both `server/dist` and `client/dist` with the same directory structure. Build tools are only used to generate the frontend files; Express serves the resulting JavaScript and CSS.

After building both directories, verify frontend serving from `server` with `node --test tests/client.test.mjs`.

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
