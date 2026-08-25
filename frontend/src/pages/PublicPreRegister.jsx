import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Calendar, User, Mail, Phone, Building, FileText, CheckCircle, Shield, Key, ArrowLeft } from 'lucide-react';
import PassCard from '../components/PassCard';
import { useNavigate } from 'react-router-dom';

const PublicPreRegister = () => {
  const navigate = useNavigate();
  const [hosts, setHosts] = useState([]);
  const [step, setStep] = useState(1); // Step 1: Form, Step 2: Mock OTP, Step 3: Confirmation / Pass
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [error, setError] = useState('');

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
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSendOtp = (e) => {
    e.preventDefault();
    setError('');
    if (!formData.visitorName || !formData.visitorEmail || !formData.visitorPhone || !formData.hostId || !formData.purpose) {
      setError('Please fill in all required fields');
      return;
    }
    // Simulate sending 6-digit OTP
    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(mockCode);
    setStep(2);
  };

  const handleVerifyOtpAndSubmit = async (e) => {
    e.preventDefault();
    if (otp !== generatedOtp && otp !== '123456') {
      setError('Invalid OTP code. Try entering 123456 or the code shown below.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await API.post('/appointments/public-register', formData);
      setSuccessResult(res.data.data);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit pre-registration');
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
          <span>Back to Previous Page</span>
        </button>
        <button
          onClick={() => navigate('/login')}
          className="text-xs font-semibold text-blue-600 hover:underline"
        >
          Sign In Page →
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
        </div>

        {error && (
          <div className="m-6 mb-0 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
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
                    placeholder="ramesh@gmail.com"
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
                ← Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-md shadow-blue-500/20"
              >
                Continue to OTP Verification →
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Mock OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtpAndSubmit} className="p-8 space-y-6 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Phone Verification (OTP)</h3>
              <p className="text-xs text-slate-500 mt-1">We sent a 6-digit verification code to {formData.visitorPhone}</p>
              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg font-mono">
                Mock OTP Code: <b>{generatedOtp}</b> (or enter 123456)
              </div>
            </div>

            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              className="w-full text-center tracking-widest text-2xl font-mono py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/2 py-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium rounded-xl text-sm"
              >
                ← Edit Details
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
              >
                {loading ? 'Submitting...' : 'Verify & Submit'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Confirmation & Digital Pass */}
        {step === 3 && successResult && (
          <div className="p-8 flex flex-col items-center text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Pre-Registration Submitted!</h3>
              <p className="text-sm text-slate-500 mt-1">
                Your request has been created. An notification email has been dispatched.
              </p>
            </div>

            {successResult.pass ? (
              <PassCard pass={successResult.pass} />
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl max-w-md">
                Your visit is currently <b>PENDING approval</b> by the host. Once approved, your digital QR pass will be issued automatically.
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
                onClick={() => { setStep(1); setSuccessResult(null); }}
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
