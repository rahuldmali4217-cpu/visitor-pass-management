import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { UserCheck, Plus, CheckCircle, XCircle, Clock, Calendar, Mail, Phone } from 'lucide-react';

const HostDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [inviteForm, setInviteForm] = useState({
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    visitorCompany: '',
    purpose: '',
    scheduledStartTime: new Date().toISOString().slice(0, 16),
    scheduledEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await API.get('/appointments');
      setAppointments(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await API.put(`/appointments/${id}/status`, { status });
      fetchAppointments();
    } catch (err) {
      alert('Failed to update appointment status');
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    try {
      const meRes = await API.get('/auth/me');
      const hostId = meRes.data.data._id;

      await API.post('/appointments', {
        ...inviteForm,
        hostId
      });

      setShowInviteModal(false);
      setInviteForm({
        visitorName: '',
        visitorEmail: '',
        visitorPhone: '',
        visitorCompany: '',
        purpose: '',
        scheduledStartTime: new Date().toISOString().slice(0, 16),
        scheduledEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });
      fetchAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating invitation');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Host Visitor Approvals</h1>
          <p className="text-sm text-slate-500">Manage pre-registrations, send invitations, and issue visitor approvals</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Invite New Visitor</span>
        </button>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-base">Visit Requests & Invitations</h3>
          <span className="text-xs text-slate-500 font-medium">{appointments.length} Total</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium">Loading requests...</div>
        ) : appointments.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No visitor requests found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((app) => (
              <div key={app._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/80 transition-colors">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-bold text-slate-900 text-base">{app.visitor.name}</h4>
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                      app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      app.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {app.visitor.email} • {app.visitor.phone} • <span className="font-medium text-slate-700">{app.visitor.company}</span>
                  </p>
                  <p className="text-sm font-medium text-slate-700">Purpose: {app.purpose}</p>
                  <p className="text-xs text-slate-400">
                    Scheduled: {new Date(app.scheduledStartTime).toLocaleString()}
                  </p>
                </div>

                {app.status === 'PENDING' && (
                  <div className="flex space-x-3 w-full md:w-auto">
                    <button
                      onClick={() => handleUpdateStatus(app._id, 'APPROVED')}
                      className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve Visit</span>
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(app._id, 'REJECTED')}
                      className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-xl transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Visitor Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Send Visitor Invitation</h3>
            <form onSubmit={handleInviteSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  value={inviteForm.visitorName}
                  onChange={(e) => setInviteForm({ ...inviteForm, visitorName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Visitor Email *</label>
                <input
                  type="email"
                  required
                  value={inviteForm.visitorEmail}
                  onChange={(e) => setInviteForm({ ...inviteForm, visitorEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={inviteForm.visitorPhone}
                    onChange={(e) => setInviteForm({ ...inviteForm, visitorPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Company</label>
                  <input
                    type="text"
                    value={inviteForm.visitorCompany}
                    onChange={(e) => setInviteForm({ ...inviteForm, visitorCompany: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Purpose of Visit *</label>
                <input
                  type="text"
                  required
                  value={inviteForm.purpose}
                  onChange={(e) => setInviteForm({ ...inviteForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="w-1/2 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostDashboard;
