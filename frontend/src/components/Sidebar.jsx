import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ScanLine, 
  UserCheck, 
  Ticket, 
  FileText, 
  Users, 
  UserPlus 
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  const role = user.role;

  const links = [];

  if (role === 'Admin') {
    links.push(
      { to: '/admin', label: 'Overview', icon: LayoutDashboard },
      { to: '/security', label: 'Gate Control & Scanner', icon: ScanLine },
      { to: '/host', label: 'Appointments & Invites', icon: UserCheck },
      { to: '/reports', label: 'Check Logs & CSV', icon: FileText }
    );
  } else if (role === 'Security') {
    links.push(
      { to: '/security', label: 'Gate Check-In / Out', icon: ScanLine },
      { to: '/reports', label: 'Log Feed', icon: FileText }
    );
  } else if (role === 'Host') {
    links.push(
      { to: '/host', label: 'My Visitors & Invites', icon: UserCheck }
    );
  } else if (role === 'Visitor') {
    links.push(
      { to: '/visitor', label: 'My Digital Passes', icon: Ticket },
      { to: '/pre-register', label: 'Request New Visit', icon: UserPlus }
    );
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 hidden md:block shrink-0">
      <div className="space-y-1">
        <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Navigation ({role})
        </p>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
