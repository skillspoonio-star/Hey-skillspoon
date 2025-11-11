// Notification utility: email, SMS, push (mocked for now)

module.exports = {
  sendEmail: async (to, subject, body) => {
    // Integrate with nodemailer or any email service
    console.log(`Email to ${to}: ${subject} - ${body}`);
    return true;
  },
  sendSMS: async (to, message) => {
    // Integrate with Twilio or any SMS service
    console.log(`SMS to ${to}: ${message}`);
    return true;
  },
  sendPush: async (userId, payload) => {
    // Integrate with Firebase Cloud Messaging or similar
    console.log(`Push to ${userId}: ${JSON.stringify(payload)}`);
    return true;
  }
};
