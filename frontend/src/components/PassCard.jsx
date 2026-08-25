import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, CheckCircle, Clock, XCircle, Building, User, Calendar } from 'lucide-react';
import API from '../services/api';

const PassCard = ({ pass }) => {
  if (!pass) return null;

  const handleDownloadPDF = async () => {
    try {
      const response = await API.get(`/passes/${pass._id}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Visitor-Pass-${pass.passCode}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download PDF badge: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center space-x-1"><CheckCircle className="w-3.5 h-3.5"/><span>ACTIVE</span></span>;
      case 'EXPIRED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center space-x-1"><Clock className="w-3.5 h-3.5"/><span>EXPIRED</span></span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200 inline-flex items-center space-x-1"><XCircle className="w-3.5 h-3.5"/><span>{status}</span></span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden hover:shadow-lg transition-shadow max-w-md w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex justify-between items-center">
        <div>
          <span className="text-xs uppercase tracking-wider font-medium text-blue-100 block">Digital Entry Pass</span>
          <h4 className="text-lg font-bold tracking-tight">{pass.passCode}</h4>
        </div>
        {getStatusBadge(pass.status)}
      </div>

      <div className="p-6">
        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
          <QRCodeSVG
            value={pass.passCode}
            size={160}
            level="H"
            includeMargin={true}
          />
          <p className="text-xs text-slate-500 font-mono mt-2 font-medium">Scan code at front desk</p>
        </div>

        {/* Details Grid */}
        <div className="space-y-3 text-sm">
          <div className="flex items-start space-x-3">
            <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs text-slate-400 block font-medium">Visitor</span>
              <p className="font-semibold text-slate-800">{pass.visitorName}</p>
              <p className="text-xs text-slate-500">{pass.visitorEmail} • {pass.visitorPhone}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Building className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs text-slate-400 block font-medium">Company & Host</span>
              <p className="font-medium text-slate-700">{pass.visitorCompany || 'Independent'}</p>
              <p className="text-xs text-slate-500">Meeting with: <span className="font-semibold text-slate-700">{pass.host?.name || 'Host'}</span></p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs text-slate-400 block font-medium">Validity Window</span>
              <p className="text-xs text-slate-600 font-medium">
                {new Date(pass.validFrom).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(pass.validUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[11px] text-slate-400">{new Date(pass.validFrom).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={handleDownloadPDF}
          className="mt-6 w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-900 text-white font-medium text-sm rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF Badge</span>
        </button>
      </div>
    </div>
  );
};

export default PassCard;
