import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import PassCard from '../components/PassCard';
import { Ticket, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

const VisitorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPasses();
  }, []);

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const res = await API.get('/passes');
      setPasses(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Visitor Digital Passes</h1>
          <p className="text-sm text-slate-500">View your active QR passes and download printable badges</p>
        </div>
        <Link
          to="/pre-register"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Request New Visit</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 font-medium">Loading your passes...</div>
      ) : passes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">No Active Passes Found</h3>
            <p className="text-sm text-slate-500 mt-1">Pre-register a visit or ask your host for an invitation.</p>
          </div>
          <Link
            to="/pre-register"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl shadow-sm"
          >
            Request Visit Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {passes.map((pass) => (
            <PassCard key={pass._id} pass={pass} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VisitorDashboard;
