const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Inaruhusu inline CSS/JS kwenye HTML yako
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// 🔥 HUU NDIO MSINGI - Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '/')));  // Au '/public' ikiwa files ziko kwenye folder ya public

// 🔥 ROUTE YA HOME PAGE (muhimu!)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Contact Form API Endpoint
app.post('/api/contact', async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Kama hujasanidi email, endelea tu kwa demo mode
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('Demo mode - message received:', { name, email, subject, message });
        return res.status(200).json({ success: true, message: 'Message received (demo mode)' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"Sila Tech Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            replyTo: email,
            subject: `New Contact: ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px;">
                    <h2 style="color: #0066ff;">New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <p><strong>Message:</strong></p>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        // Auto-reply
        const autoReplyOptions = {
            from: `"Sila Tech Team" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Thank you for contacting Sila Tech!',
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2 style="color: #0066ff;">Hello ${name},</h2>
                    <p>Thank you for reaching out to Sila Tech!</p>
                    <p>We have received your message regarding <strong>"${subject}"</strong> and will get back to you within 24 hours.</p>
                    <br>
                    <p>Best regards,<br><strong>Sila Tech Team</strong></p>
                </div>
            `
        };

        await transporter.sendMail(autoReplyOptions);

        res.status(200).json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Email error:', error);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

// WhatsApp Bot API Endpoint
app.post('/api/whatsapp/send', async (req, res) => {
    const { number, message } = req.body;
    // Implement actual WhatsApp integration here
    res.json({ success: true, message: 'WhatsApp message queued', data: { number, message } });
});

// Security Scan Endpoint
app.post('/api/security/scan', async (req, res) => {
    const { url } = req.body;
    res.json({
        status: 'completed',
        vulnerabilities: [],
        score: 95,
        recommendations: ['Update SSL certificate', 'Enable 2FA']
    });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Catch-all route - in case of 404
app.get('*', (req, res) => {
    res.status(404).send('Page not found. Go to <a href="/">Home</a>');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Sila Tech Server running on port ${PORT}`);
    console.log(`📧 Email service: ${process.env.EMAIL_USER ? 'Configured' : 'Not configured - using demo mode'}`);
    console.log(`🌐 Visit: http://localhost:${PORT}`);
});
