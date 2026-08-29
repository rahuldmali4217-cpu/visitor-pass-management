import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Calendar, User, Mail, Phone, Building, FileText, CheckCircle, Shield, Key, ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react';
import PassCard from '../components/PassCard';
import { useNavigate } from 'react-router-dom';

const PublicPreRegister = () => {
  const navigate = useNavigate();
  const [hosts, setHosts] = useState([]);
  const [step, setStep] = useState(1); // Step 1: Form, Step 2: Real OTP Verification, Step 3: Confirmation
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailPreviewUrl, setEmailPreviewUrl] = useState(null);
  const [devOtpCode, setDevOtpCode] = useState(null);
  const [verificationToken, setVerificationToken] = useState(null);
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const [formData, setFormData] = useState({
    visitorName: '',
    visitorEmail: '',
    visitorPhone: '',
    visitorCompany: '',
    idProofType: 'Aadhaar',
    idProofNumber: '',
    hostId: '',
    purpose: '',
    scheduledStartTime: new Date().toISOString().slice(0, 16),
    scheduledEndTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });

  useEffect(() => {
    fetchHosts();
  }, []);

  const fetchHosts = async () => {
    try {
      const res = await API.get('/users?role=Host');
      setHosts(res.data.data);
      if (res.data.data.length > 0) {
        setFormData((prev) => ({ ...prev, hostId: res.data.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed to fetch hosts:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 1. Dispatch real OTP via Email & SMS backend endpoint
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!formData.visitorName || !formData.visitorEmail || !formData.visitorPhone || !formData.hostId || !formData.purpose) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const res = await API.post('/auth/send-otp', {
        email: formData.visitorEmail,
        phone: formData.visitorPhone,
        name: formData.visitorName
      });

      setEmailPreviewUrl(res.data.previewUrl || null);
      setDevOtpCode(res.data.devOtp || null);
      setInfoMessage(`Verification code sent to ${formData.visitorEmail}`);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch verification OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP code with backend database & submit pre-registration
  const handleVerifyOtpAndSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the valid 6-digit OTP code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 2a: Verify OTP with backend
      const verifyRes = await API.post('/auth/verify-otp', {
        email: formData.visitorEmail,
        otpCode: otp.trim()
      });

      const token = verifyRes.data.verificationToken;
      setVerificationToken(token);

      // Step 2b: Submit pre-registration appointment with verified token
      const apptRes = await API.post('/appointments/public-register', {
        ...formData,
        verificationToken: token
      });

      setSuccessResult(apptRes.data.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed. Please enter the correct code or request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top Back Navigation Bar */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center space-x-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <button
          onClick={() => navigate('/login')}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          Staff Sign In →
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Visitor Pre-Registration</h2>
              <p className="text-xs text-slate-400">Request entry approval prior to your arrival</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <Shield className="w-4 h-4 text-blue-400" />
            <span>2-Step Entry Verification</span>
          </div>
        </div>

        {error && (
          <div className="m-6 mb-0 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center justify-between">
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="m-6 mb-0 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-xl">
            {infoMessage}
          </div>
        )}

        {/* STEP 1: Registration Form */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="p-8 space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">1. Visitor Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    name="visitorName"
                    required
                    value={formData.visitorName}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    name="visitorEmail"
                    required
                    value={formData.visitorEmail}
                    onChange={handleChange}
                    placeholder="ramesh@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number *</label>
                  <input
                    type="text"
                    name="visitorPhone"
                    required
                    value={formData.visitorPhone}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Company / Organization</label>
                  <input
                    type="text"
                    name="visitorCompany"
                    value={formData.visitorCompany}
                    onChange={handleChange}
                    placeholder="e.g. Infosys Ltd."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Government ID Proof</label>
                  <select
                    name="idProofType"
                    value={formData.idProofType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">ID Proof Number (Optional)</label>
                  <input
                    type="text"
                    name="idProofNumber"
                    value={formData.idProofNumber}
                    onChange={handleChange}
                    placeholder="e.g. XXXX-XXXX-1234"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">2. Visit Details & Host</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select Host / Employee *</label>
                  <select
                    name="hostId"
                    required
                    value={formData.hostId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {hosts.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.name} ({h.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Purpose of Visit *</label>
                  <input
                    type="text"
                    name="purpose"
                    required
                    value={formData.purpose}
                    onChange={handleChange}
                    placeholder="Business meeting / Interview / Delivery"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Scheduled Start Time</label>
                  <input
                    type="datetime-local"
                    name="scheduledStartTime"
                    value={formData.scheduledStartTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Scheduled End Time</label>
                  <input
                    type="datetime-local"
                    name="scheduledEndTime"
                    value={formData.scheduledEndTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-1/3 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold rounded-xl text-sm transition-colors"
              >
                ← Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2"
              >
                {loading ? <span>Sending Code...</span> : <span>Continue to OTP Verification →</span>}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Real OTP Verification Form */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtpAndSubmit} className="p-8 space-y-6 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <Key className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Email & Phone Verification</h3>
              <p className="text-xs text-slate-500 mt-1">
                We dispatched a secure 6-digit OTP to <b>{formData.visitorEmail}</b>
              </p>

              {emailPreviewUrl && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 text-left">
                  <p className="font-semibold mb-1">📨 Evaluator / Sandbox Email Preview:</p>
                  <a
                    href={emailPreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-blue-600 hover:underline font-medium"
                  >
                    <span>Click to view dispatched email in Ethereal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {devOtpCode && (
                <div className="mt-2 p-2 bg-slate-100 border border-slate-200 text-slate-700 text-xs rounded-lg font-mono">
                  Sandbox Code: <b className="text-blue-600">{devOtpCode}</b>
                </div>
              )}
            </div>

            <div>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="• • • • • •"
                className="w-full text-center tracking-widest text-2xl font-mono py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-400 mt-2">Code is valid for 10 minutes</p>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/2 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium rounded-xl text-sm"
              >
                ← Edit Form
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
              >
                {loading ? 'Verifying...' : 'Verify & Submit'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={loading}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:underline"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resend Verification Code</span>
            </button>
          </form>
        )}

        {/* STEP 3: Confirmation Screen */}
        {step === 3 && successResult && (
          <div className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Pre-Registration Submitted!</h3>
              <p className="text-sm text-slate-500 mt-1">
                Your request has been verified and registered. An email notification has been dispatched.
              </p>
            </div>

            {successResult.pass ? (
              <PassCard pass={successResult.pass} />
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl max-w-md text-left space-y-2">
                <p className="font-semibold">Status: PENDING Host Approval</p>
                <p className="text-xs text-amber-700">
                  Your designated host has been notified. As soon as they approve your visit, your active Digital Pass & QR Code will be issued automatically.
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 font-medium text-sm rounded-xl hover:bg-slate-200"
              >
                ← Back to Login
              </button>
              <button
                onClick={() => { setStep(1); setSuccessResult(null); setOtp(''); }}
                className="px-6 py-2.5 bg-slate-900 text-white font-medium text-sm rounded-xl hover:bg-slate-800"
              >
                Submit Another Request
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicPreRegister;
