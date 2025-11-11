const razorpay = require('razorpay');
const crypto = require('crypto');

const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = {
    razorpayInstance,
    validatePaymentVerification: ({ order_id, payment_id, signature }) => {
        const text = order_id + "|" + payment_id;
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(text)
            .digest('hex');
        return generated_signature === signature;
    }
};