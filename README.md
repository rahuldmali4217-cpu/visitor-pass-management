# 🎫 Visitor Pass Management System (MERN Stack)
> **Student Name**: Rahul Mali  
> **Course / Degree**: MERN Stack Project Submission  
> **Live Deployment**: [https://visitor-pass-management-z0w5.onrender.com/](https://visitor-pass-management-z0w5.onrender.com/)  
> **GitHub Repository**: [https://github.com/rahuldmali4217-cpu/visitor-pass-management](https://github.com/rahuldmali4217-cpu/visitor-pass-management)  
> **Full Demo Video**: [`visitor_pass_demo.webm`](https://github.com/rahuldmali4217-cpu/visitor-pass-management/blob/main/visitor_pass_demo.webm)

---

## 📌 1. Project Overview & Motivation

In traditional offices and college campuses, visitor logs are maintained manually on paper registers at the security gate. This approach has many issues:
- Unverified contact numbers and fake identities.
- Hosts (employees) are unaware when their visitor arrives until security calls.
- Lost visitor logs and no quick search or analytics for security audits.

**What My Project Does:**
I built a full-stack **Visitor Pass Management System** using the **MERN stack** to digitize the entire visitor cycle from pre-registration to gate exit:
1. **Visitor Pre-Registration**: Visitors submit their details and verify their phone/email via a **6-Digit OTP**.
2. **Host Approval Workflow**: Hosts review pending visit requests and approve or reject them.
3. **Digital Pass & PDF Badge**: Upon approval, a digital pass with a unique **2D QR Code** and downloadable **PDF Badge** is generated.
4. **Security Gate Scanner**: Security guards scan the visitor's QR code using their camera or upload the QR image to record real-time **Check-In and Check-Out** timestamps.
5. **Admin Analytics**: Admins can monitor live occupants, daily visitor counts, and export gate logs as **CSV reports**.

---

## 🔑 2. Demo User Credentials (1-Click Login Enabled)

The login screen has instant one-click login buttons for all 4 roles (All passwords: `password123`):

| Role | Demo Email | Password | Primary Functions |
| :--- | :--- | :--- | :--- |
| 👑 **Admin** | `admin@example.com` | `password123` | View system analytics, manage staff users, export CSV audit logs |
| 👮 **Security** | `security@example.com` | `password123` | Live QR camera scanning, QR image upload, instant pass issuance, gate logs |
| 🏢 **Host** | `host@example.com` | `password123` | Review visitor requests, approve/reject appointments, auto-email PDF badge |
| 👤 **Visitor** | `visitor@example.com` | `password123` | View active digital passes, download printable PDF badges |

---

## 📸 3. Screenshots of the Running System

### Screen 1: Multi-Role Login Portal
![Login Screen](https://raw.githubusercontent.com/rahuldmali4217-cpu/visitor-pass-management/main/screenshots/01_login_roles.png)
*Role-Based Access Control (RBAC) login page with one-click demo credentials.*

---

### Screen 2: Visitor Pre-Registration & 6-Digit OTP Verification
![Pre-Registration Screen](https://raw.githubusercontent.com/rahuldmali4217-cpu/visitor-pass-management/main/screenshots/02_visitor_preregistration_otp.png)
*Public visitor pre-registration form with OTP verification step.*

---

### Screen 3: Host Dashboard & Appointment Approvals
![Host Dashboard](https://raw.githubusercontent.com/rahuldmali4217-cpu/visitor-pass-management/main/screenshots/03_host_approval.png)
*Host dashboard where employees approve or reject incoming visit requests.*

---

### Screen 4: Digital Visitor Pass Card & Downloadable PDF Badge
![Visitor Digital Pass](https://raw.githubusercontent.com/rahuldmali4217-cpu/visitor-pass-management/main/screenshots/04_visitor_digital_pass.png)
*Digital visitor card with dynamic 2D QR code and PDF badge generator button.*

---

### Screen 5: Security Gate Control & Dual QR Scanner
![Security Dashboard](https://raw.githubusercontent.com/rahuldmali4217-cpu/visitor-pass-management/main/screenshots/05_security_gate_scanner.png)
*Gate control dashboard supporting WebRTC camera scanning, QR image file upload, and manual entry.*

---

### Screen 6: Admin Dashboard, Analytics & CSV Audit Export
![Admin Dashboard](https://raw.githubusercontent.com/rahuldmali4217-cpu/visitor-pass-management/main/screenshots/06_admin_analytics_reports.png)
*Real-time occupant counters, visitor trends, and one-click CSV export.*

---

## 🏗️ 4. System Architecture & Database Models

The project is built on **Node.js, Express.js, MongoDB (Mongoose), and React.js (Tailwind CSS)**.

```
visitor_pass_project/
├── backend/
│   ├── config/db.js              # MongoDB Atlas connection
│   ├── controllers/
│   │   ├── authController.js     # User auth & OTP verification
│   │   ├── appointmentController.js # Appointment pre-registration & approvals
│   │   ├── passController.js     # Pass creation, QR code & PDF badge
│   │   ├── checkLogController.js # Gate check-in and check-out
│   │   └── analyticsController.js# Dashboard counts & CSV export
│   ├── models/
│   │   ├── User.js               # Staff & visitor user accounts
│   │   ├── Visitor.js            # Visitor profile details
│   │   ├── Otp.js                # 6-Digit OTP with 10-minute TTL index
│   │   ├── Appointment.js        # Visit requests (PENDING/APPROVED/REJECTED)
│   │   ├── Pass.js               # Digital passes with QR code data
│   │   └── CheckLog.js           # Gate check-in/out timestamps
│   ├── utils/
│   │   ├── emailSender.js        # Nodemailer with Ethereal sandbox fallback
│   │   ├── pdfGenerator.js       # PDFKit badge generator
│   │   └── smsSender.js          # SMS gateway logger
│   └── tests/e2e.test.js         # Automated end-to-end integration test suite
└── frontend/
    ├── src/
    │   ├── components/           # Navbar, PassCard, QRScannerModal
    │   ├── context/AuthContext.jsx # Global user auth state
    │   └── pages/                # Login, Register, PreRegister, Dashboards
    └── package.json
```

---

## 🛠️ 5. My Development Journey & How I Solved Real Bugs

While building and testing this project, I encountered several practical engineering challenges and solved them step-by-step:

### 🐛 Bug 1: MongoDB DNS SRV Lookup Timeout on Windows
* **The Problem**: When connecting to MongoDB Atlas (`mongodb+srv://...`), local Node.js threw `querySrv ECONNREFUSED` errors due to Windows DNS resolver timeouts.
* **How I Fixed It**: In `backend/config/db.js`, I imported Node's native `dns` module and configured public fallback DNS resolvers (`dns.setServers(['8.8.8.8', '1.1.1.1'])`).

### 🐛 Bug 2: `sh: 1: vite: not found` during Render Production Build
* **The Problem**: Render sets `NODE_ENV=production`, causing `npm install` to skip `devDependencies` where `vite` was initially listed.
* **How I Fixed It**: I moved `vite` and `@vitejs/plugin-react` into `"dependencies"` in `frontend/package.json` and updated the root build command to `npm --prefix frontend install --include=dev && npm --prefix frontend run build`.

### 🐛 Bug 3: Sending Real Emails Without Paid SMTP
* **The Problem**: Using real Gmail SMTP can get blocked by 2-factor authentication or spam filters during testing.
* **How I Fixed It**: I used Nodemailer's built-in **Ethereal Mail sandbox** (`nodemailer.createTestAccount()`). When no paid SMTP credentials are provided in `.env`, the backend dispatches real SMTP test emails and logs a clickable preview URL (`nodemailer.getTestMessageUrl`), proving the email was actually generated and sent.

### 🐛 Bug 4: Preventing Accidental Double Check-Ins
* **The Problem**: If a guard scanned a QR code twice, duplicate entry records were created without an exit timestamp.
* **How I Fixed It**: In `checkLogController.js`, before saving a new `CHECKED_IN` record, I added a database check for any active entry (`status: 'CHECKED_IN'`) for that pass.

### 🐛 Bug 5: QR Scanner Failing on Devices Without Webcams
* **The Problem**: Evaluators testing on desktop PCs without webcams could not test the camera scanner.
* **How I Fixed It**: In `QRScannerModal.jsx`, I used `html5-qrcode`'s `scanFile` API to add a second tab: **"Upload QR Image"**, allowing users to upload a screenshot of any pass QR code to verify it.

---

## ⚙️ 6. Environment Variables Setup

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/visitor_pass_db?retryWrites=true&w=majority
JWT_SECRET=my_custom_secret_key_2026
CLIENT_URL=http://localhost:5173

# Optional: Real SMTP email settings (Ethereal test sandbox used automatically if omitted)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

---

## 🚀 7. Local Setup & Execution

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/rahuldmali4217-cpu/visitor-pass-management.git
cd visitor-pass-management

# Install dependencies for root, backend, and frontend
npm run install-all
```

### 2. Seed Initial Demo Accounts
```bash
cd backend
npm run seed
cd ..
```

### 3. Start Application
```bash
# Build frontend and start Express server
npm run build
npm start
```
* **Frontend App**: `http://localhost:5173` (or `http://localhost:5000` in production)
* **Backend API**: `http://localhost:5000`

---

## 🧪 8. Automated Integration Testing (`npm test`)

To prove that all core endpoints and database workflows work end-to-end, I wrote an automated test suite in `backend/tests/e2e.test.js`:

```bash
npm test
```

### Test Results Summary:
```text
======================================================
🚀 VISITOR PASS MANAGEMENT SYSTEM - E2E TEST SUITE
======================================================
[TEST DB] Connected to MongoDB successfully.

--- TEST GROUP 1: System Health ---
  ✅ PASS: GET /api/health returns 200 online

--- TEST GROUP 2: Authentication & RBAC ---
  ✅ PASS: Register Admin returns JWT token
  ✅ PASS: Register Host returns user ID
  ✅ PASS: Login with valid credentials succeeds
  ✅ PASS: GET /api/auth/me verifies JWT session

--- TEST GROUP 3: Real Database-Backed OTP Verification ---
  ✅ PASS: POST /api/auth/send-otp dispatches OTP
  ✅ PASS: OTP code stored in MongoDB with 10-minute TTL
  ✅ PASS: Verify with invalid OTP returns 400 rejection
  ✅ PASS: Verify with correct OTP returns signed verificationToken

--- TEST GROUP 4: Pre-Registration & Pass Issuance ---
  ✅ PASS: Public pre-registration creates PENDING appointment
  ✅ PASS: Host approval creates active Pass with PassCode

--- TEST GROUP 5: QR Verification & Gate Access Logging ---
  ✅ PASS: Pass VP-XXXXXX verified as VALID
  ✅ PASS: Security check-in logs entry time and marks CHECKED_IN
  ✅ PASS: Duplicate check-in blocked when visitor is already inside
  ✅ PASS: Security check-out logs exit timestamp

--- TEST GROUP 6: System Analytics & CSV Audit ---
  ✅ PASS: Analytics dashboard returns calculated counters
  ✅ PASS: Export CSV returns downloadable audit log spreadsheet

======================================================
📊 TEST SUMMARY: 17 Passed | 0 Failed
======================================================
```
