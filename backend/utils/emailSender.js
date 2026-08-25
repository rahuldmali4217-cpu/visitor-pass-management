const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.SMTP_HOST) {
      console.log(`[EMAIL SIMULATOR] To: ${to} | Subject: ${subject}`);
      return { success: true, simulated: true };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Visitor Pass System" <noreply@visitorpass.com>',
      to,
      subject,
      text,
      html
    });

    console.log(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail };
