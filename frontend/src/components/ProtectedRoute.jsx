import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect user to their default dashboard role route
    if (user.role === 'Admin') return <Navigate to="/admin" replace />;
    if (user.role === 'Security') return <Navigate to="/security" replace />;
    if (user.role === 'Host') return <Navigate to="/host" replace />;
    if (user.role === 'Visitor') return <Navigate to="/visitor" replace />;
  }

  return children;
};

export default ProtectedRoute;
