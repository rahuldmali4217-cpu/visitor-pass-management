const QRCode = require('qrcode');

/**
 * Generate a QR code Data URL (base64 PNG) for a pass code or JSON payload
 */
const generateQRCode = async (data) => {
  try {
    const qrDataString = typeof data === 'object' ? JSON.stringify(data) : String(data);
    const qrCodeDataUrl = await QRCode.toDataURL(qrDataString, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 250,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR Code:', error);
    throw error;
  }
};

module.exports = { generateQRCode };
