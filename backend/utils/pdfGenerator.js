const PDFDocument = require('pdfkit');
const { generateQRCode } = require('./qrGenerator');

/**
 * Generate a complete, professional PDF Pass Badge Buffer
 */
const generatePassPDFBuffer = async (passData) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Standard badge dimensions (360x520 pt - portrait badge size)
      const doc = new PDFDocument({ size: [360, 540], margin: 0 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // 1. Top Header Background Banner
      doc.rect(0, 0, 360, 75).fill('#1e293b'); // Dark Slate header

      // Top Header Title & Subtitle
      doc
        .fillColor('#ffffff')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('VISITOR PASS', 0, 18, { align: 'center' });

      doc
        .fillColor('#38bdf8')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`PASS ID: ${passData.passCode}`, 0, 42, { align: 'center' });

      // 2. Generate QR Code Image Buffer
      const qrDataUrl = await generateQRCode(passData.passCode);
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');

      // White Card Container for QR Code
      doc.roundedRect(95, 90, 170, 170, 8).fillAndStroke('#f8fafc', '#cbd5e1');
      doc.image(qrBuffer, 105, 100, { width: 150, height: 150 });

      doc
        .fillColor('#64748b')
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('SCAN AT SECURITY GATE', 0, 268, { align: 'center' });

      // 3. Divider Line
      doc.moveTo(20, 285).lineTo(340, 285).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // 4. Details Section (2-Column clean layout)
      let yPos = 300;

      const drawDetailRow = (label, value, y) => {
        doc
          .fillColor('#64748b')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text(label.toUpperCase(), 25, y);

        doc
          .fillColor('#0f172a')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(value || 'N/A', 130, y, { width: 205 });
      };

      drawDetailRow('Visitor Name', passData.visitorName, yPos);
      yPos += 22;

      if (passData.visitorEmail || passData.visitorPhone) {
        const contactStr = [passData.visitorEmail, passData.visitorPhone].filter(Boolean).join(' | ');
        drawDetailRow('Contact Info', contactStr, yPos);
        yPos += 22;
      }

      drawDetailRow('Company / Org', passData.visitorCompany || 'Independent', yPos);
      yPos += 22;

      drawDetailRow('Host Person', passData.hostName || passData.host?.name || 'Authorized Host', yPos);
      yPos += 22;

      drawDetailRow('Purpose of Visit', passData.purpose, yPos);
      yPos += 22;

      const validFromStr = new Date(passData.validFrom).toLocaleString([], {
        dateStyle: 'short',
        timeStyle: 'short'
      });
      const validUntilStr = new Date(passData.validUntil).toLocaleString([], {
        dateStyle: 'short',
        timeStyle: 'short'
      });

      drawDetailRow('Valid From', validFromStr, yPos);
      yPos += 22;

      drawDetailRow('Valid Until', validUntilStr, yPos);
      yPos += 24;

      // 5. Bottom Security Footer
      doc.rect(0, 490, 360, 50).fill('#0f172a');

      doc
        .fillColor('#94a3b8')
        .fontSize(7.5)
        .font('Helvetica')
        .text('Must be displayed visibly at all times inside premises.', 0, 500, { align: 'center' });

      doc
        .fillColor('#64748b')
        .fontSize(7)
        .text(`Issued On: ${new Date().toLocaleString()} • Non-Transferable Security Badge`, 0, 516, { align: 'center' });

      // Outer Border Frame
      doc.rect(1, 1, 358, 538).strokeColor('#cbd5e1').lineWidth(2).stroke();

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generatePassPDFBuffer };
