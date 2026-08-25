# Visitor Pass Management System (MERN Stack)

A production-ready **Visitor Pass Management System** built with the MERN Stack (MongoDB, Express.js, React, Node.js). The platform replaces traditional paper entry registers with a digital check-in system featuring **Pre-Registration**, **Host Approvals**, **QR-code Verification**, **PDF Badge Generation**, **Real-Time Security Gate Logs**, **Role-Based Access Control (RBAC)**, **Mock OTP Verification**, and **CSV Audit Export**.

---

## 🚀 Key Features & Core Requirements

### 1. Role-Based Authentication & Access Control (JWT & RBAC)
- **Admin**: System management, staff account management, system analytics dashboard, CSV export.
- **Security / Frontdesk**: Issue instant passes, scan/verify QR codes via camera scanner or manual entry, log check-ins and check-outs in real time.
- **Employee / Host**: Send visitor invitations, approve/reject pending visit requests.
- **Visitor**: Self pre-register online, view active digital passes, download PDF badges with QR codes.

### 2. Digital Pass Issuance & PDF Badges
- Dynamic 2D QR Code generation using `qrcode` and `qrcode.react`.
- Server-side PDF Badge creation with `pdfkit` featuring visitor details, host information, validity window, and embedded QR image.

### 3. Real-Time Gate Security & QR Scanner
- Integrated camera QR scanner (`html5-qrcode`) for seamless check-in at front desk security.
- Instant validation of pass codes, expiry timestamps, and revocation status.

### 4. Public Pre-Registration with OTP Verification
- Public landing portal allowing external visitors to pre-register visit requests.
- 2-Step verification flow with mock 6-digit OTP confirmation.

### 5. Analytics & Audit Reports
- Real-time counters: Total System Users, Currently Inside, Passes Issued, Pending Approvals.
- 1-Click CSV Export for compliance and security auditing.

---

## 🔑 Pre-Configured Demo Credentials (Instant 1-Click Login)

Run `npm run seed` inside `backend/` to populate the database with these demo accounts (All passwords: `password123`):

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| 👑 **Admin** | `admin@example.com` | `password123` | Full control, User creation, Analytics, CSV export |
| 👮 **Security** | `security@example.com` | `password123` | QR scanner, Check-In/Out logging, On-the-spot pass issuance |
| 🏢 **Host** | `host@example.com` | `password123` | Invite visitors, Approve/Reject visit requests |
| 👤 **Visitor** | `visitor@example.com` | `password123` | View digital pass card, Download PDF badge |

---

## 📦 Project Structure

```
visitor_pass/
├── backend/
│   ├── config/
│   │   └── db.js                 # Mongoose connection
│   ├── controllers/
│   │   ├── analyticsController.js # System stats & CSV export
│   │   ├── appointmentController.js # Invitations & approvals
│   │   ├── authController.js      # JWT Register/Login/Me
│   │   ├── checkLogController.js  # Gate check-in/out logic
│   │   ├── passController.js       # Issue passes, verify QR, PDF badge
│   │   └── userController.js      # Staff user CRUD
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification & RBAC check
│   │   └── errorMiddleware.js     # Global Express error handler
│   ├── models/
│   │   ├── Appointment.js
│   │   ├── CheckLog.js
│   │   ├── Pass.js
│   │   ├── User.js
│   │   └── Visitor.js
│   ├── routes/                    # Express API endpoints
│   ├── scripts/
│   │   └── seed.js               # Database seeding script
│   ├── utils/
│   │   ├── emailSender.js        # Email notification service
│   │   ├── pdfGenerator.js       # PDFKit badge generator
│   │   └── qrGenerator.js        # Base64 QR generator
│   ├── .env                      # Environment variables
│   ├── Dockerfile
│   ├── package.json
│   └── server.js                 # Express server entrypoint
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Navigation bar & role badges
│   │   │   ├── PassCard.jsx      # Digital QR Pass card component
│   │   │   ├── ProtectedRoute.jsx# Role guard wrapper
│   │   │   ├── QRScannerModal.jsx# Camera scanner modal
│   │   │   └── Sidebar.jsx       # Side menu navigation
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global Auth State
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── HostDashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── PublicPreRegister.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Reports.jsx
│   │   │   ├── SecurityDashboard.jsx
│   │   │   └── VisitorDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js            # Axios client with JWT interceptor
│   │   ├── App.jsx
│   │   ├── index.css             # Tailwind imports
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docker-compose.yml
└── README.md
```

---

## 🛠️ Quick Start Guide (Local Development)

### Step 1: Start MongoDB
Ensure MongoDB is running locally on `mongodb://127.0.0.1:27017` or update `MONGO_URI` in `backend/.env`.

### Step 2: Setup & Seed Backend
```bash
cd backend
npm install
npm run seed
npm start
```
*Backend server runs on `http://localhost:5000`.*

### Step 3: Setup & Launch Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend application runs on `http://localhost:5173`.*

---

## 🐳 Docker Deployment (Bonus Challenge)

To deploy the entire stack with Docker & Docker Compose:

```bash
docker-compose up --build
```
- **Frontend App**: `http://localhost`
- **Backend API**: `http://localhost:5000`
- **MongoDB**: `localhost:27017`

---

## 🌐 API Endpoint Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Authenticate user & get JWT token |
| `POST` | `/api/auth/register` | Public | Register new user |
| `GET` | `/api/users` | Private | List staff users (Host filter available) |
| `POST` | `/api/appointments/public-register` | Public | Public visitor pre-registration |
| `GET` | `/api/appointments` | Private | List appointments for user role |
| `PUT` | `/api/appointments/:id/status` | Host/Admin | Approve or Reject appointment |
| `POST` | `/api/passes` | Security/Host/Admin | Issue instant pass |
| `GET` | `/api/passes/verify/:code` | Public/Security | Verify QR code or pass code |
| `GET` | `/api/passes/:id/pdf` | Public/Private | Download PDF badge file |
| `POST` | `/api/check-logs/check-in` | Security/Admin | Log visitor entry |
| `POST` | `/api/check-logs/check-out` | Security/Admin | Log visitor exit |
| `GET` | `/api/analytics/dashboard` | Private | Get system analytics summary |
| `GET` | `/api/analytics/export-csv` | Admin/Security | Export check logs to CSV |
