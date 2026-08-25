import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera, Keyboard } from 'lucide-react';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Delay mounting scanner to allow modal DOM rendering
      const timer = setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          'qr-reader-container',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          /* verbose= */ false
        );

        scanner.render(
          (decodedText) => {
            scanner.clear();
            onScanSuccess(decodedText);
          },
          (error) => {
            // Silence scan frame errors
          }
        );

        scannerRef.current = scanner;
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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl relative border border-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 mb-4">
          <Camera className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-800">Scan Visitor QR Code</h3>
        </div>

        {/* Camera Container */}
        <div id="qr-reader-container" className="w-full bg-slate-50 rounded-xl overflow-hidden min-h-[260px]"></div>

        <div className="relative my-4 flex items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-xs text-slate-400 font-semibold uppercase">Or Enter Pass Code</span>
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
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default QRScannerModal;
