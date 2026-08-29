import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Keyboard, Upload, AlertCircle } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [manualCode, setManualCode] = useState('');
  const [scanMode, setScanMode] = useState('camera'); // 'camera' | 'file'
  const [fileError, setFileError] = useState('');
  const [fileProcessing, setFileProcessing] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (isOpen && scanMode === 'camera') {
      const timer = setTimeout(() => {
        try {
          const scanner = new Html5QrcodeScanner(
            'qr-reader-container',
            {
              fps: 10,
              qrbox: { width: 240, height: 240 },
              rememberLastUsedCamera: true,
              aspectRatio: 1.0
            },
            /* verbose= */ false
          );

          scanner.render(
            (decodedText) => {
              try {
                scanner.clear();
              } catch (e) {}
              onScanSuccess(decodedText);
            },
            (error) => {
              // Frame scanning interval - suppress repetitive errors
            }
          );

          scannerRef.current = scanner;
        } catch (err) {
          console.warn('Camera scanner initialization notice:', err.message);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch (e) {}
        }
      };
    }
  }, [isOpen, scanMode]);

  if (!isOpen) return null;

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
      setManualCode('');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError('');
    setFileProcessing(true);

    try {
      const html5QrCode = new Html5Qrcode('qr-file-processor');
      const decodedText = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      setFileProcessing(false);
      onScanSuccess(decodedText);
    } catch (err) {
      setFileProcessing(false);
      setFileError('No valid QR code found in this image. Please upload a clear QR code image or enter the code manually.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-4 pr-8">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">Scan Visitor QR Pass</h3>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setScanMode('camera'); setFileError(''); }}
              className={`px-3 py-1 rounded-lg transition-colors ${
                scanMode === 'camera' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Live Camera
            </button>
            <button
              onClick={() => {
                if (scannerRef.current) {
                  try { scannerRef.current.clear(); } catch (e) {}
                }
                setScanMode('file');
              }}
              className={`px-3 py-1 rounded-lg transition-colors ${
                scanMode === 'file' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload QR Image
            </button>
          </div>
        </div>

        {/* Hidden File Processor Element */}
        <div id="qr-file-processor" className="hidden"></div>

        {/* Scan Mode 1: Live WebRTC Camera */}
        {scanMode === 'camera' && (
          <div id="qr-reader-container" className="w-full bg-slate-50 rounded-xl overflow-hidden min-h-[260px] border border-slate-200"></div>
        )}

        {/* Scan Mode 2: Image File Upload (Ideal for Desktop Evaluators) */}
        {scanMode === 'file' && (
          <div className="w-full p-8 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-center">
            <Upload className="w-10 h-10 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">Upload Visitor Badge QR Image</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">Upload a screenshot or PNG/JPEG image containing a visitor QR code</p>
            
            <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
              <span>{fileProcessing ? 'Processing QR...' : 'Select QR Image File'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={fileProcessing}
                className="hidden"
              />
            </label>

            {fileError && (
              <div className="mt-4 p-2 bg-red-50 text-red-700 text-xs rounded-lg flex items-center space-x-1">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{fileError}</span>
              </div>
            )}
          </div>
        )}

        <div className="relative my-4 flex items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-xs text-slate-400 font-semibold uppercase">Or Enter Code Manually</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleManualSubmit} className="flex space-x-2">
          <div className="relative flex-grow">
            <Keyboard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="e.g. VP-DEMO01"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-colors"
          >
            Verify Pass
          </button>
        </form>
      </div>
    </div>
  );
};

export default QRScannerModal;
