import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, LogOut, User as UserIcon, Calendar, ArrowLeft } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Security': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Host': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isHomePage = location.pathname === '/login' || location.pathname === '/';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left Section: Back Button & Brand Logo */}
        <div className="flex items-center space-x-3">
          {!isHomePage && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex items-center space-x-1 font-medium text-xs border border-slate-200"
              title="Go Back to previous page"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">VisitorPass</span>
              <span className="text-xs text-slate-500 font-medium">Digital Pass Management</span>
            </div>
          </Link>
        </div>

        {/* Public vs Auth Links */}
        {user ? (
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-3 pr-4 border-r border-slate-200">
              <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</p>
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(user.role)} uppercase tracking-wider`}>
                  {user.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link
              to="/pre-register"
              className="inline-flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Pre-Register Visit</span>
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
