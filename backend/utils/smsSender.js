/**
 * SMS Notification Utility
 * Supports integration with providers like Twilio, Fast2SMS, AWS SNS, etc.
 */
const sendSMS = async ({ toPhone, message }) => {
  try {
    if (!toPhone) {
      return { success: false, message: 'Phone number is required' };
    }

    // Check if SMS provider credentials are configured (e.g. Twilio)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER) {
      // Optional Twilio SDK dispatch
      const twilio = require('twilio');
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const res = await client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: toPhone
      });
      console.log(`[SMS DISPATCHED] Twilio SID: ${res.sid} to ${toPhone}`);
      return { success: true, provider: 'twilio', sid: res.sid };
    }

    // Standard fallback logging for testing environments
    console.log(`[SMS GATEWAY] To: ${toPhone} | Body: "${message}"`);
    return {
      success: true,
      provider: 'gateway_sandbox',
      to: toPhone,
      status: 'dispatched'
    };
  } catch (error) {
    console.error(`[SMS ERROR] Failed to dispatch SMS to ${toPhone}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendSMS };
