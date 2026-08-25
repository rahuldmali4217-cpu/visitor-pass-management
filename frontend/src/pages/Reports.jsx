import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { FileText, Download, Search, RefreshCw } from 'lucide-react';

const Reports = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [search, statusFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/check-logs?search=${search}&status=${statusFilter}`);
      setLogs(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await API.get('/analytics/export-csv', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Visitor-Pass-Logs.csv';
      a.click();
    } catch (err) {
      alert('CSV Export failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Reports & Check Logs</h1>
          <p className="text-sm text-slate-500">Historical visitor check-in/out records and audit trail</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Report</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by visitor name, pass code, or host..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="CHECKED_IN">CHECKED_IN</option>
          <option value="CHECKED_OUT">CHECKED_OUT</option>
        </select>
        <button
          onClick={fetchLogs}
          className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                    Loading logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No log entries match your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-blue-600">{log.passCode}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{log.visitorName}</td>
                    <td className="px-6 py-4 text-slate-600">{log.hostName}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(log.checkInTime).toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {log.checkOutTime ? new Date(log.checkOutTime).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${log.status === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
