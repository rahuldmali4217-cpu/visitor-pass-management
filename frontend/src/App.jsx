import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import PublicPreRegister from './pages/PublicPreRegister';
import AdminDashboard from './pages/AdminDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import HostDashboard from './pages/HostDashboard';
import VisitorDashboard from './pages/VisitorDashboard';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />

          <div className="flex-1 flex max-w-7xl w-full mx-auto">
            <Sidebar />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/pre-register" element={<PublicPreRegister />} />

                {/* Protected Role Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['Admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/security"
                  element={
                    <ProtectedRoute allowedRoles={['Security', 'Admin']}>
                      <SecurityDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host"
                  element={
                    <ProtectedRoute allowedRoles={['Host', 'Admin']}>
                      <HostDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/visitor"
                  element={
                    <ProtectedRoute allowedRoles={['Visitor']}>
                      <VisitorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute allowedRoles={['Admin', 'Security']}>
                      <Reports />
                    </ProtectedRoute>
                  }
                />

                {/* Default Redirect */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </main>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
