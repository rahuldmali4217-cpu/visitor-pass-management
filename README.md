# Visitor Pass Management System (MERN Stack)

A digital Visitor Pass Management System built using the **MERN stack (MongoDB, Express.js, React.js, Node.js)**. This project digitizes manual visitor entry registers with digital check-ins, OTP verification, host approval workflows, dynamic QR code passes, PDF badge generation, and real-time gate security logging.

---

## 📌 Project Overview & Objectives

In many offices, colleges, and buildings, visitors still write their details in manual paper logbooks. This leads to security loopholes, messy logs, and long wait times.

**Main Goals of this Project:**
1. Allow visitors to pre-register online with OTP verification.
2. Allow hosts (employees) to approve or reject visit requests.
3. Automatically generate digital passes with 2D QR codes and downloadable PDF badges.
4. Provide security guards with a camera QR scanner to log visitor check-ins and check-outs in real time.
5. Provide administrators with analytics and downloadable CSV reports.

---

## 🚀 Live Demo & Links

* **Live Website**: [https://visitor-pass-management-z0w5.onrender.com/](https://visitor-pass-management-z0w5.onrender.com/)
* **GitHub Repository**: [https://github.com/rahuldmali4217-cpu/visitor-pass-management](https://github.com/rahuldmali4217-cpu/visitor-pass-management)
* **Demo Video**: [`visitor_pass_demo.webm`](./visitor_pass_demo.webm)

---

## 🔑 Demo Accounts for Testing

The login page includes quick 1-click login buttons for testing each user role (All passwords: `password123`):

| Role | Email | Password | What this role can do |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password123` | System overview, manage staff, view stats, export CSV |
| **Security** | `security@example.com` | `password123` | QR camera scanner, issue on-the-spot passes, log check-in/out |
| **Host** | `host@example.com` | `password123` | View visit requests, approve/reject appointments |
| **Visitor** | `visitor@example.com` | `password123` | View digital pass card, download PDF badge |

---

## 📸 Screenshots of the Running Application

### 1. Login Page & Role-Based Access
![Login Screen](./screenshots/01_login_roles.png)
*Authentication screen with JWT support and 1-click demo logins.*

---

### 2. Visitor Pre-Registration & Real OTP Verification
![Pre-Registration Screen](./screenshots/02_visitor_preregistration_otp.png)
*Public registration form with 6-digit OTP verification.*

---

### 3. Host Dashboard (Approval Workflow)
![Host Dashboard](./screenshots/03_host_approval.png)
*Host portal to review pending visit requests and issue passes.*

---

### 4. Visitor Digital Pass & PDF Badge
![Visitor Digital Pass](./screenshots/04_visitor_digital_pass.png)
*Digital visitor card with dynamic QR code and printable PDF badge.*

---

### 5. Security Gate Dashboard & QR Scanner
![Security Dashboard](./screenshots/05_security_gate_scanner.png)
*Front desk portal with WebRTC camera QR scanner, image file upload, and gate logs.*

---

### 6. Admin Dashboard & CSV Audit Export
![Admin Dashboard](./screenshots/06_admin_analytics_reports.png)
*Real-time metrics counters and 1-click CSV audit report export.*

---

## 🏗️ System Architecture & Database Design

The project uses MongoDB with 6 collections:

1. **Users (`models/User.js`)**: Stores registered staff and visitors with encrypted passwords (`bcryptjs`) and roles (`Admin`, `Host`, `Security`, `Visitor`).
2. **Visitors (`models/Visitor.js`)**: Stores visitor profiles, contact info, and government ID proof types.
3. **Otp (`models/Otp.js`)**: Stores 6-digit verification codes with a 10-minute MongoDB TTL index for automatic cleanup.
4. **Appointments (`models/Appointment.js`)**: Stores visit requests, purpose, scheduled time slots, and status (`PENDING`, `APPROVED`, `REJECTED`).
5. **Passes (`models/Pass.js`)**: Stores approved digital passes, validity windows, and embedded QR code data.
6. **CheckLogs (`models/CheckLog.js`)**: Stores gate entry and exit timestamps with the guard's user reference.

---

## 💡 Engineering Challenges & How I Solved Them

During the development and testing of this project, I ran into several practical problems and solved them:

### 1. Handling Real Email Dispatch in Development
* **Problem**: Setting up real SMTP credentials in development can trigger spam filters or fail if credentials are missing.
* **Solution**: I implemented Nodemailer with automatic **Ethereal Mail** fallback. When no custom SMTP is provided, the backend generates an Ethereal test mailbox and prints a clickable preview URL (`nodemailer.getTestMessageUrl`) in the console, making it easy to test without needing real email credentials.

### 2. QR Code Scanning on Different Devices
* **Problem**: Not all evaluators or desktop PCs have a working webcam or browser camera permission enabled.
* **Solution**: In `QRScannerModal.jsx`, I built dual scanning options: **Live WebRTC Camera Scan** and **QR Image File Upload & Scan** (using `html5-qrcode`), allowing users to upload a screenshot of a pass to verify it instantly.

### 3. Preventing Unverified Pre-Registration Submissions
* **Problem**: Preventing bot submissions on the public pre-registration page.
* **Solution**: I created an `Otp` schema with a 10-minute TTL expiry in MongoDB. When verified, the backend issues a signed verification token that must be presented when creating the appointment.

### 4. Preventing Double Check-Ins
* **Problem**: A visitor scanning their QR pass twice without checking out could create corrupt attendance records.
* **Solution**: Before creating a `CHECKED_IN` record, `checkLogController.js` checks if there is already an active check-in for that pass.

---

## ⚙️ Environment Variables Setup

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

## 🛠️ How to Run Locally

### 1. Install Dependencies
```bash
# Install root, backend, and frontend packages
npm run install-all
```

### 2. Seed Demo Accounts
```bash
cd backend
npm run seed
cd ..
```

### 3. Start the Application
```bash
# Run both frontend and backend
npm run build
npm start
```
* **Frontend**: `http://localhost:5173` (or `http://localhost:5000` in production)
* **Backend**: `http://localhost:5000`

---

## 🧪 Running Automated Tests

I wrote an integration test suite in `backend/tests/e2e.test.js` to test the full system lifecycle:

```bash
npm test
```

**Test Coverage (17 Tests across 6 Groups):**
- ✅ System health check
- ✅ User registration & JWT authentication
- ✅ Real database-backed OTP generation & verification
- ✅ Pre-registration & Host approval workflow
- ✅ QR code verification & Gate Check-In/Check-Out
- ✅ Real-time analytics counters & CSV audit export

---

## 📝 Known Limitations

1. **Camera Permissions**: Live camera scanning requires `HTTPS` or `localhost` due to WebRTC security policies. On plain HTTP remote connections, use the "Upload QR Image" tab.
2. **Email Sandbox**: Without custom SMTP configured in `.env`, emails are sent through the Ethereal testing sandbox and generate preview URLs.
