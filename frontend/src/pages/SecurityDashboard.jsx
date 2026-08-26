import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { ScanLine, LogIn, LogOut, CheckCircle, AlertCircle, Plus, Search, ShieldCheck } from 'lucide-react';
import QRScannerModal from '../components/QRScannerModal';

const SecurityDashboard = () => {
  const [passCodeInput, setPassCodeInput] = useState('');
  const [scannedPass, setScannedPass] = useState(null);
  const [logs, setLogs] = useState([]);
  const [hosts, setHosts] = useState([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [issueForm, setIssueForm] = useState({
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    visitorCompany: '',
    hostId: '',
    purpose: ''
  });

  useEffect(() => {
    fetchLogs();
    fetchHosts();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await API.get('/check-logs');
      setLogs(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHosts = async () => {
    try {
      const res = await API.get('/users?role=Host');
      setHosts(res.data.data);
      if (res.data.data.length > 0) {
        setIssueForm((prev) => ({ ...prev, hostId: res.data.data[0]._id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Pass code ya QR scan data verify karna (Active/Expired status check karna)
  const handleVerifyCode = async (code) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await API.get(`/passes/verify/${code}`);
      setScannedPass(res.data);
      setPassCodeInput(code);
    } catch (err) {
      setScannedPass(null);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Invalid Pass Code' });
    } finally {
      setLoading(false);
    }
  };

  // 2. Camera QR Scanner se successful scan hone par code verify karna
  const handleScanSuccess = (code) => {
    setIsScannerOpen(false);
    handleVerifyCode(code);
  };

  // 3. Visitor Check-In: Gate par entry timestamp aur security guard ID log karna
  const handleCheckIn = async () => {
    if (!scannedPass?.data?.passCode) return;
    setLoading(true);
    try {
      const res = await API.post('/check-logs/check-in', { passCode: scannedPass.data.passCode });
      setMessage({ type: 'success', text: res.data.message });
      fetchLogs();
      handleVerifyCode(scannedPass.data.passCode);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Check-in failed' });
    } finally {
      setLoading(false);
    }
  };

  // 4. Visitor Check-Out: Gate se exit hone par exit time log karna
  const handleCheckOut = async () => {
    if (!scannedPass?.data?.passCode) return;
    setLoading(true);
    try {
      const res = await API.post('/check-logs/check-out', { passCode: scannedPass.data.passCode });
      setMessage({ type: 'success', text: res.data.message });
      fetchLogs();
      handleVerifyCode(scannedPass.data.passCode);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Check-out failed' });
    } finally {
      setLoading(false);
    }
  };

  // 5. Gate par on-the-spot instant pass issue karna
  const handleInstantIssue = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/passes', issueForm);
      setShowIssueModal(false);
      setMessage({ type: 'success', text: `Pass issued successfully: ${res.data.data.passCode}` });
      handleVerifyCode(res.data.data.passCode);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue pass');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security Gate Control</h1>
          <p className="text-sm text-slate-500">Scan QR codes, verify visitor credentials, and log entry/exit</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
          >
            <ScanLine className="w-4 h-4" />
            <span>Open Camera Scanner</span>
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Instant Pass</span>
          </button>
        </div>
      </div>

      {/* Verification / Scanning Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Pass Verification & Gate Entry</h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (passCodeInput) handleVerifyCode(passCodeInput);
          }}
          className="flex space-x-3 mb-6"
        >
          <div className="relative flex-grow">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Enter Pass Code (e.g. VP-DEMO01)"
              value={passCodeInput}
              onChange={(e) => setPassCodeInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Verify Pass
          </button>
        </form>

        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium mb-6 flex items-center space-x-2 ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Scanned Pass Details Box */}
        {scannedPass && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="font-mono text-xl font-bold text-slate-900">{scannedPass.data.passCode}</span>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${scannedPass.valid ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                  {scannedPass.valid ? 'VALID PASS' : scannedPass.status}
                </span>
              </div>
              <p className="text-base font-bold text-slate-800">{scannedPass.data.visitorName} ({scannedPass.data.visitorCompany || 'Independent'})</p>
              <p className="text-xs text-slate-500">
                Host: <span className="font-semibold text-slate-700">{scannedPass.data.host?.name || 'N/A'}</span> • Purpose: {scannedPass.data.purpose}
              </p>
            </div>

            <div className="flex space-x-3 w-full md:w-auto">
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Log Check-In</span>
              </button>
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="flex-1 md:flex-initial inline-flex items-center justify-center space-x-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Check-Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Log Activity Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-base">Live Check-In / Check-Out Log Feed</h3>
          <button onClick={fetchLogs} className="text-xs text-blue-600 font-semibold hover:underline">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase">
                <th className="px-6 py-3">Pass Code</th>
                <th className="px-6 py-3">Visitor Name</th>
                <th className="px-6 py-3">Host Name</th>
                <th className="px-6 py-3">Check-In Time</th>
                <th className="px-6 py-3">Check-Out Time</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-blue-600">{log.passCode}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{log.visitorName}</td>
                  <td className="px-6 py-4 text-slate-600">{log.hostName}</td>
                  <td className="px-6 py-4 text-slate-600">{new Date(log.checkInTime).toLocaleTimeString()}</td>
                  <td className="px-6 py-4 text-slate-600">
                    {log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString() : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${log.status === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* Issue Instant Pass Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Issue On-The-Spot Pass</h3>
            <form onSubmit={handleInstantIssue} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Visitor Name *</label>
                <input
                  type="text"
                  required
                  value={issueForm.visitorName}
                  onChange={(e) => setIssueForm({ ...issueForm, visitorName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Visitor Email *</label>
                <input
                  type="email"
                  required
                  value={issueForm.visitorEmail}
                  onChange={(e) => setIssueForm({ ...issueForm, visitorEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    value={issueForm.visitorPhone}
                    onChange={(e) => setIssueForm({ ...issueForm, visitorPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Company</label>
                  <input
                    type="text"
                    value={issueForm.visitorCompany}
                    onChange={(e) => setIssueForm({ ...issueForm, visitorCompany: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Host / Employee *</label>
                <select
                  value={issueForm.hostId}
                  onChange={(e) => setIssueForm({ ...issueForm, hostId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                >
                  {hosts.map((h) => (
                    <option key={h._id} value={h._id}>{h.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Purpose of Visit *</label>
                <input
                  type="text"
                  required
                  value={issueForm.purpose}
                  onChange={(e) => setIssueForm({ ...issueForm, purpose: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="w-1/2 py-2 bg-slate-100 text-slate-700 font-medium rounded-xl text-sm hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-blue-600 text-white font-semibold rounded-xl text-sm hover:bg-blue-700"
                >
                  Generate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
