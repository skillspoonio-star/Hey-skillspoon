const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const Admin = require('../models/admin');

// In-memory OTP store: { adminId: { otp, expiresAt } }
const otpStore = new Map();

// Configure nodemailer using env variables (see backend/.env)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
        : undefined
});

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function login(req, res) {
    const { adminId, password } = req.body;
    if (!adminId || !password) return res.status(400).json({ error: 'adminId and password required' });

    try {
        const admin = await Admin.findOne({ adminId });
        if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
        console.log('Admin authenticated:', adminId);
        // Generate OTP and store with TTL (configurable via OTP_TTL_SECONDS)
        const otp = generateOtp();
        const ttlSeconds = 300; // default 5 minutes
        const expiresAt = Date.now() + ttlSeconds * 1000;
        otpStore.set(adminId, { otp, expiresAt });
        console.log(`Generated OTP for ${adminId}: ${otp} `);
        // Send OTP to admin.email via nodemailer

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: admin.email,
            subject: process.env.OTP_EMAIL_SUBJECT || 'Your Admin OTP',
            html: `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
        <h2 style="color: #1a73e8;">Hello Admin,</h2>
        <p>You have requested an OTP for verification purposes. Please use the OTP below to proceed:</p>
        <p style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #000;">${otp}</p>
        <p>This OTP is valid for the next <strong>5 minutes</strong>. Please do not share this OTP with anyone.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="font-size: 12px; color: #888;">If you did not request this OTP, please ignore this email. This is an automated message; please do not reply.</p>
    </div>
    `
        };



        // send mail (do not block on success)
        transporter.sendMail(mailOptions).catch((err) => {
            console.error('Failed to send OTP email:', err.message || err);
        });

        return res.json({ message: 'OTP sent' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
}

function verifyOtp(req, res) {
    const { adminId, otp } = req.body;
    if (!adminId || !otp) return res.status(400).json({ error: 'adminId and otp required' });

    const record = otpStore.get(adminId);
    if (!record) return res.status(400).json({ error: 'No OTP requested' });
    if (Date.now() > record.expiresAt) {
        otpStore.delete(adminId);
        return res.status(400).json({ error: 'OTP expired' });
    }
    if (record.otp !== otp) return res.status(401).json({ error: 'Invalid OTP' });

    // OTP verified — remove it
    otpStore.delete(adminId);
    return res.json({ message: 'OTP verified' });
}

module.exports = { login, verifyOtp };
